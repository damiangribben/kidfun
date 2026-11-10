// Confirms the ANTHROPIC_API_KEY secret works. It only looks up model details,
// so calling it uses no Claude tokens.
import Anthropic from "npm:@anthropic-ai/sdk@1.6.0";

const MODEL = "claude-opus-5-5";

function json(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async () => {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return json({ ok: false, error: "ANTHROPIC_API_KEY is not set" }, 500);
  }

  try {
    const client = new Anthropic({ apiKey });
    const model = await client.models.retrieve(MODEL);
    return json({ ok: true, model: model.id }, 200);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return json({ ok: false, error: "Anthropic rejected the API key" }, 502);
    }
    if (error instanceof Anthropic.NotFoundError) {
      return json({ ok: false, error: `Model ${MODEL} not found` }, 502);
    }
    if (error instanceof Anthropic.APIError) {
      return json({ ok: false, error: `Anthropic error ${error.status}` }, 502);
    }
    return json({ ok: false, error: "Could not reach Anthropic" }, 502);
  }
});
