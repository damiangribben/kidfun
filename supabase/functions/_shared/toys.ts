import Anthropic from "npm:@anthropic-ai/sdk@1.6.0";

import { HttpError } from "./http.ts";

const MODEL = "claude-opus-5-5";
const MAX_TOYS = 60;
const NO_MATCH = "none";

// Must match the check constraint on public.toys.category.
export const TOY_CATEGORIES = [
  "building",
  "small_world",
  "games",
  "puzzles",
  "arts_crafts",
  "pretend",
  "musical",
  "outdoor_active",
  "other",
] as const;

export type DetectedToy = {
  name: string;
  category: (typeof TOY_CATEGORIES)[number];
  small_parts: boolean;
  /** Set when an inventory was given: the matching toy's id, or null if it's new. */
  existing_toy_id?: string | null;
};

export type InventoryToy = { id: string; name: string };

function outputSchema(inventory?: InventoryToy[]) {
  const properties: Record<string, unknown> = {
    name: { type: "string" },
    category: { type: "string", enum: [...TOY_CATEGORIES] },
    small_parts: { type: "boolean" },
  };
  const required = ["name", "category", "small_parts"];
  if (inventory) {
    properties.existing_toy_id = {
      type: "string",
      enum: [...inventory.map((t) => t.id), NO_MATCH],
    };
    required.push("existing_toy_id");
  }
  return {
    type: "object",
    additionalProperties: false,
    required: ["toys"],
    properties: {
      toys: {
        type: "array",
        items: { type: "object", additionalProperties: false, required, properties },
      },
    },
  };
}

/** Shared guidance for every way of adding toys (list, photo). */
export const TOY_GUIDANCE = `You help a family keep an inventory of their children's toys. The children are roughly 2 to 6 years old.

Return one entry per distinct toy or set:
- Treat a set as one toy (e.g. "Duplo farm set", not each animal). Group loose pieces of the same kind (e.g. "Wooden train track").
- Keep brand and product names where given (Magna-Tiles, Duplo, Lego, Playmobil, Orchard Toys).
- Names are short and natural: at most 6 words, no quantities unless they identify the toy.
- Leave out anything that isn't a toy or game, and anything you can't identify with reasonable confidence.

Categories:
- building: construction toys (Lego, Duplo, Magna-Tiles, blocks, marble runs)
- small_world: figures, animals, vehicles, dolls' houses, farms, play sets
- games: board games, card games
- puzzles: jigsaws, shape sorters, puzzle toys
- arts_crafts: drawing, painting, modelling, sticker and craft kits
- pretend: play kitchens, play food, dress-up, doctor's kits, shops
- musical: instruments and music toys
- outdoor_active: balls, bikes, scooters, sports and garden toys
- other: anything that fits none of the above

small_parts is true when the toy has pieces small enough to be a choking hazard for an under-3 (Lego, marbles, beads, small figures, game counters, small puzzle pieces) and false otherwise (Duplo, Magna-Tiles, large puzzles, soft toys).`;

const MATCHING_GUIDANCE = `The family's existing inventory is listed inside <inventory> tags. For each toy you find, set existing_toy_id to the id of the inventory toy it is, allowing for different wording (e.g. "Magna tiles" and "Magna-Tiles magnetic tiles" are the same toy). Use "${NO_MATCH}" only when it is genuinely not in the inventory. When it matches, use the inventory's name for it.`;

function normalise(raw: unknown, inventory?: InventoryToy[]): DetectedToy[] {
  const toys = (raw as { toys?: unknown })?.toys;
  if (!Array.isArray(toys)) return [];
  const inventoryIds = new Set(inventory?.map((t) => t.id));

  const seen = new Set<string>();
  const result: DetectedToy[] = [];
  for (const toy of toys) {
    const name = typeof toy?.name === "string" ? toy.name.trim().slice(0, 80) : "";
    const existing =
      inventory && inventoryIds.has(toy?.existing_toy_id) ? (toy.existing_toy_id as string) : null;
    const key = existing ?? name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    result.push({
      name,
      category: TOY_CATEGORIES.includes(toy.category) ? toy.category : "other",
      small_parts: toy.small_parts === true,
      ...(inventory ? { existing_toy_id: existing } : {}),
    });
    if (result.length === MAX_TOYS) break;
  }
  return result;
}

/**
 * Asks Claude to pick out toys from the given content and returns them as structured data.
 * With an inventory, each toy is also matched against it.
 */
export async function detectToys(
  instructions: string,
  content: Anthropic.Beta.BetaContentBlockParam[],
  effort: "low" | "medium" = "low",
  inventory?: InventoryToy[],
): Promise<DetectedToy[]> {
  const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

  const inventoryBlock: Anthropic.Beta.BetaContentBlockParam[] = inventory
    ? [{
      type: "text",
      text: `<inventory>\n${inventory.map((t) => `- ${t.name} (id ${t.id})`).join("\n") || "(empty)"}\n</inventory>`,
    }]
    : [];

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort,
      format: { type: "json_schema", schema: outputSchema(inventory) },
    },
    system: [TOY_GUIDANCE, inventory ? MATCHING_GUIDANCE : "", instructions].filter(Boolean).join("\n\n"),
    messages: [{ role: "user", content: [...inventoryBlock, ...content] }],
  });

  if (response.stop_reason === "refusal") {
    throw new HttpError(422, "Claude couldn't help with that one. Try wording it differently.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new HttpError(422, "That's too many toys in one go. Try splitting the list.");
  }

  const text = response.content.find((block) => block.type === "text");
  if (!text || text.type !== "text") {
    throw new HttpError(502, "Claude didn't return any toys. Please try again.");
  }
  try {
    return normalise(JSON.parse(text.text), inventory);
  } catch {
    throw new HttpError(502, "Claude's answer couldn't be read. Please try again.");
  }
}
