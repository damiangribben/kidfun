import type { Json } from '@/lib/database.types';
import { FriendlyError } from '@/lib/family';
import { invokeFunction } from '@/lib/functions';
import { supabase } from '@/lib/supabase';

/** The structured idea written by the generate-idea Edge Function. */
export type IdeaContent = {
  toys: { toy_id: string; name: string; place: string | null; location_hint: string | null }[];
  setup: string[];
  child_roles: { child_id: string; name: string; role: string }[];
  parent_role: string;
  situation: string | null;
  /** Where it was meant to be played; missing on ideas made before settings existed. */
  setting?: Setting;
  /** Every toy the parent offered when this idea was made. */
  offered_toy_ids?: string[];
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
  gender: 'boy' | 'girl' | 'unspecified';
  age: number;
};

export function guestLabel(guest: GuestChild): string {
  return guest.gender === 'unspecified' ? `Friend (${guest.age})` : `Friend (${guest.gender}, ${guest.age})`;
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

const IDEA_COLUMNS =
  'id, name, pitch, content, supervise_closely, idea_players(child_id, user_id), idea_ratings(user_id, value)';

type IdeaRow = {
  id: string;
  name: string;
  pitch: string;
  content: Json;
  supervise_closely: boolean;
  idea_players: { child_id: string | null; user_id: string | null }[];
  idea_ratings: { user_id: string; value: number }[];
};

async function myUserId(): Promise<string | undefined> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id;
}

function toIdea(row: IdeaRow, userId: string | undefined): Idea {
  return {
    score: row.idea_ratings.reduce((sum, r) => sum + r.value, 0),
    myRating: row.idea_ratings.find((r) => r.user_id === userId)?.value ?? 0,
    id: row.id,
    name: row.name,
    pitch: row.pitch,
    content: row.content as unknown as IdeaContent,
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
  const [{ data, error }, userId] = await Promise.all([
    supabase.from('ideas').select(IDEA_COLUMNS).eq('id', id).single(),
    myUserId(),
  ]);
  if (error) throw new FriendlyError(error.message);
  return toIdea(data, userId);
}

/** Loads ideas in the order given. */
export async function getIdeas(ids: string[]): Promise<Idea[]> {
  if (ids.length === 0) return [];
  const [{ data, error }, userId] = await Promise.all([
    supabase.from('ideas').select(IDEA_COLUMNS).in('id', ids),
    myUserId(),
  ]);
  if (error) throw new FriendlyError(error.message);
  const byId = new Map(data.map((row) => [row.id, toIdea(row, userId)]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

/** The whole library: best rated first, then newest. */
export async function listIdeas(): Promise<Idea[]> {
  const [{ data, error }, userId] = await Promise.all([
    supabase.from('ideas').select(IDEA_COLUMNS).order('created_at', { ascending: false }),
    myUserId(),
  ]);
  if (error) throw new FriendlyError(error.message);
  // Array.prototype.sort is stable, so equal scores stay newest first.
  return data.map((row) => toIdea(row, userId)).sort((a, b) => b.score - a.score);
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
