import type { Json } from '@/lib/database.types';
import { FriendlyError } from '@/lib/family';
import { invokeFunction } from '@/lib/functions';
import { supabase } from '@/lib/supabase';

/** A toy the idea uses, with the household's name for it (or a generic one if it's gone). */
export type IdeaToy = {
  toy_id: string | null;
  name: string;
  place: string | null;
  location_hint: string | null;
};

/** An idea with its tokens swapped for this household's names. */
export type IdeaContent = {
  toys: IdeaToy[];
  setup: string[];
  /** One per child or friend playing, in order. */
  child_roles: { key: string; name: string; role: string }[];
  parent_role: string;
};

export type Idea = {
  id: string;
  name: string;
  pitch: string;
  content: IdeaContent;
  supervise_closely: boolean;
  childIds: string[];
  parentIds: string[];
  /** Both parents' thumbs added up. */
  score: number;
  /** This parent's thumbs: 1, -1, or 0 for none. */
  myRating: number;
};

export type Rating = 1 | -1 | 0;

// Where the family is playing. Must match SETTINGS in the generate-idea function.
export const SETTINGS = [
  { value: 'indoors', label: 'Indoors' },
  { value: 'garden', label: 'Garden' },
  { value: 'park', label: 'Park' },
  { value: 'car', label: 'Car' },
] as const;

/** A built-in setting, or "custom:<id>" for one of the household's own places to play. */
export type Setting = string;

export type PlayLocation = { id: string; name: string };

export const customSetting = (location: PlayLocation): Setting => `custom:${location.id}`;

/** The household's own places to play, such as "Beach" or "Restaurant". */
export async function listPlayLocations(): Promise<PlayLocation[]> {
  const { data, error } = await supabase.from('play_locations').select('id, name').order('name');
  if (error) throw new FriendlyError(error.message);
  return data;
}

export async function addPlayLocation(name: string): Promise<PlayLocation> {
  const { data, error } = await supabase
    .from('play_locations')
    .insert({ name: name.trim() })
    .select('id, name')
    .single();
  if (error) {
    throw new FriendlyError(
      error.code === '23505' ? `You already have "${name.trim()}".` : error.message,
    );
  }
  return data;
}

/** Removes a place to play. Ideas made for it stay in the library. */
export async function deletePlayLocation(id: string): Promise<void> {
  const { error } = await supabase.from('play_locations').delete().eq('id', id);
  if (error) throw new FriendlyError(error.message);
}

/** A friend playing today only; never saved. */
export type GuestChild = {
  age: number;
};

export function guestLabel(guest: GuestChild): string {
  return `Friend (${guest.age})`;
}

export type IdeaRequest = {
  setting: Setting;
  childIds: string[];
  parentIds: string[];
  guests?: GuestChild[];
  toyIds: string[];
  situation?: string;
  count?: number;
};

// ---------------------------------------------------------------------------
// Localising ideas
//
// Ideas are stored generically in global_ideas, with players and toys written
// as tokens such as {{child_1}} and {{toy_2}}. Each household's ideas row maps
// those slots to its own children, parents, friends and toys, and the tokens
// are swapped for names here, on the device.

/** The generic idea, as written by the generate-idea Edge Function. */
type GenericContent = {
  setup: string[];
  roles: { slot: string; role: string }[];
  parent_role: string;
  players: { slot: string; kind: 'child' | 'friend' | 'parent'; age_months?: number }[];
  toys: { slot: string; description: string; category: string; small_parts: boolean }[];
};

/** This household's mapping from slots to its own people and toys. */
type LocalContent = {
  players: Record<string, { child_id?: string; user_id?: string; age?: number }>;
  toys: Record<string, string>;
};

/** Names the household uses today, so renamed children and toys show their new names. */
type Household = {
  children: Map<string, string>;
  parents: Map<string, string | null>;
  toys: Map<string, { name: string; place: string | null; location_hint: string | null }>;
};

async function loadHousehold(): Promise<Household> {
  const [children, parents, toys] = await Promise.all([
    supabase.from('children').select('id, name'),
    supabase.from('household_members').select('user_id, display_name'),
    supabase.from('toys').select('id, name, location_hint, places(name)'),
  ]);
  const error = children.error ?? parents.error ?? toys.error;
  if (error) throw new FriendlyError(error.message);
  return {
    children: new Map(children.data!.map((c) => [c.id, c.name])),
    parents: new Map(parents.data!.map((p) => [p.user_id, p.display_name])),
    toys: new Map(
      toys.data!.map((t) => [
        t.id,
        { name: t.name, place: t.places?.name ?? null, location_hint: t.location_hint },
      ]),
    ),
  };
}

/** "the 9-month-old" or "the 3-year-old", for a child the household no longer has. */
function ageDescriptor(months: number | undefined): string {
  if (months === undefined) return 'a child';
  return months < 24 ? `the ${months}-month-old` : `the ${Math.floor(months / 12)}-year-old`;
}

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Works out what each slot is called in this household. */
function slotNames(generic: GenericContent, local: LocalContent, household: Household) {
  const names = new Map<string, string>();
  const friendCount = generic.players.filter((p) => p.kind === 'friend').length;
  for (const player of generic.players) {
    const mapped = local.players?.[player.slot] ?? {};
    if (player.kind === 'child') {
      const name = mapped.child_id ? household.children.get(mapped.child_id) : undefined;
      names.set(player.slot, name ?? ageDescriptor(player.age_months));
    } else if (player.kind === 'friend') {
      names.set(player.slot, friendCount > 1 ? `Friend ${player.slot.split('_')[1]}` : 'your friend');
    } else {
      const name = mapped.user_id ? household.parents.get(mapped.user_id) : undefined;
      names.set(player.slot, name ?? 'a grown-up');
    }
  }
  for (const toy of generic.toys) {
    const toyId = local.toys?.[toy.slot];
    names.set(toy.slot, (toyId && household.toys.get(toyId)?.name) || toy.description);
  }
  return names;
}

/** Swaps {{slot}} tokens for names, capitalising at the start of a sentence. */
function fillTokens(text: string, names: Map<string, string>): string {
  return text.replace(/\{\{\s*([a-z]+_\d+)\s*\}\}/g, (_, slot: string, offset: number) => {
    const name = names.get(slot) ?? 'someone';
    const before = text.slice(0, offset);
    return before.trim() === '' || /[.!?:]\s*["“']?$/.test(before) ? capitalise(name) : name;
  });
}

const IDEA_COLUMNS =
  'id, local, supervise_closely, global_ideas(name, pitch, content), idea_players(child_id, user_id), idea_ratings(user_id, value)';

type IdeaRow = {
  id: string;
  local: Json;
  supervise_closely: boolean;
  global_ideas: { name: string; pitch: string; content: Json } | null;
  idea_players: { child_id: string | null; user_id: string | null }[];
  idea_ratings: { user_id: string; value: number }[];
};

async function myUserId(): Promise<string | undefined> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id;
}

function toIdea(row: IdeaRow, household: Household, userId: string | undefined): Idea {
  const generic = row.global_ideas!.content as unknown as GenericContent;
  const local = row.local as unknown as LocalContent;
  const names = slotNames(generic, local, household);
  const fill = (text: string) => fillTokens(text, names);
  return {
    score: row.idea_ratings.reduce((sum, r) => sum + r.value, 0),
    myRating: row.idea_ratings.find((r) => r.user_id === userId)?.value ?? 0,
    id: row.id,
    name: fill(row.global_ideas!.name),
    pitch: fill(row.global_ideas!.pitch),
    content: {
      toys: generic.toys.map((toy) => {
        const toyId = local.toys?.[toy.slot] ?? null;
        const own = toyId ? household.toys.get(toyId) : undefined;
        return {
          toy_id: toyId,
          name: own?.name ?? toy.description,
          place: own?.place ?? null,
          location_hint: own?.location_hint ?? null,
        };
      }),
      setup: generic.setup.map(fill),
      child_roles: generic.roles.map((r) => {
        const player = generic.players.find((p) => p.slot === r.slot);
        const name = capitalise(names.get(r.slot) ?? 'Someone');
        return {
          key: r.slot,
          name: player?.kind === 'friend' ? `${name} (${local.players?.[r.slot]?.age ?? '?'})` : name,
          role: fill(r.role),
        };
      }),
      parent_role: fill(generic.parent_role),
    },
    supervise_closely: row.supervise_closely,
    childIds: row.idea_players.flatMap((p) => (p.child_id ? [p.child_id] : [])),
    parentIds: row.idea_players.flatMap((p) => (p.user_id ? [p.user_id] : [])),
  };
}

/** Asks Claude for a few new ideas (added straight to the library) and returns their ids. */
export async function generateIdeas(request: IdeaRequest): Promise<string[]> {
  const { ideas } = await invokeFunction<{ ideas: { id: string }[] }>('generate-idea', {
    count: 3,
    ...request,
  });
  return ideas.map((i) => i.id);
}

export async function getIdea(id: string): Promise<Idea> {
  const [{ data, error }, household, userId] = await Promise.all([
    supabase.from('ideas').select(IDEA_COLUMNS).eq('id', id).single(),
    loadHousehold(),
    myUserId(),
  ]);
  if (error) throw new FriendlyError(error.message);
  return toIdea(data as IdeaRow, household, userId);
}

/** Loads ideas in the order given. */
export async function getIdeas(ids: string[]): Promise<Idea[]> {
  if (ids.length === 0) return [];
  const [{ data, error }, household, userId] = await Promise.all([
    supabase.from('ideas').select(IDEA_COLUMNS).in('id', ids),
    loadHousehold(),
    myUserId(),
  ]);
  if (error) throw new FriendlyError(error.message);
  const byId = new Map((data as IdeaRow[]).map((row) => [row.id, toIdea(row, household, userId)]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

/** The whole library: best rated first, then newest. */
export async function listIdeas(): Promise<Idea[]> {
  const [{ data, error }, household, userId] = await Promise.all([
    supabase.from('ideas').select(IDEA_COLUMNS).order('created_at', { ascending: false }),
    loadHousehold(),
    myUserId(),
  ]);
  if (error) throw new FriendlyError(error.message);
  // Array.prototype.sort is stable, so equal scores stay newest first.
  return (data as IdeaRow[])
    .map((row) => toIdea(row, household, userId))
    .sort((a, b) => b.score - a.score);
}

/** Library ideas for this setting using any of these toys, ranked by the database (see match_ideas). */
export async function matchIdeas(
  toyIds: string[],
  childIds: string[],
  setting: Setting,
): Promise<string[]> {
  const { data, error } = await supabase.rpc('match_ideas', {
    chosen_toy_ids: toyIds,
    chosen_child_ids: childIds,
    chosen_setting: setting,
  });
  if (error) throw new FriendlyError(error.message);
  return data.map((m) => m.idea_id);
}

/** Sets this parent's thumbs on an idea (0 clears it) and returns the updated idea. */
export async function rateIdea(idea: Idea, rating: Rating): Promise<Idea> {
  const userId = await myUserId();
  if (!userId) throw new FriendlyError('Please sign in again.');
  const { error } =
    rating === 0
      ? await supabase.from('idea_ratings').delete().eq('idea_id', idea.id).eq('user_id', userId)
      : await supabase
          .from('idea_ratings')
          .upsert({ idea_id: idea.id, user_id: userId, value: rating }, { onConflict: 'idea_id,user_id' });
  if (error) throw new FriendlyError(error.message);
  return { ...idea, myRating: rating, score: idea.score - idea.myRating + rating };
}

/**
 * Deletes an idea from the household's library. Its thumbs and its toy and
 * player tags go with it (the database cascades the delete).
 */
export async function deleteIdea(id: string): Promise<void> {
  const { error } = await supabase.from('ideas').delete().eq('id', id);
  if (error) throw new FriendlyError(error.message);
}
