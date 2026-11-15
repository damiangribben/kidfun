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
  /** Every toy the parent offered when this idea was made. */
  offered_toy_ids?: string[];
};

export type Idea = {
  id: string;
  name: string;
  pitch: string;
  content: IdeaContent;
  supervise_closely: boolean;
  saved: boolean;
  childIds: string[];
  parentIds: string[];
  /** Both parents' thumbs added up. */
  score: number;
  /** This parent's thumbs: 1, -1, or 0 for none. */
  myRating: number;
};

export type Rating = 1 | -1 | 0;

export type IdeaRequest = {
  childIds: string[];
  parentIds: string[];
  toyIds: string[];
  situation?: string;
  count?: number;
};

const IDEA_COLUMNS =
  'id, name, pitch, content, supervise_closely, saved_at, idea_players(child_id, user_id), idea_ratings(user_id, value)';

type IdeaRow = {
  id: string;
  name: string;
  pitch: string;
  content: Json;
  supervise_closely: boolean;
  saved_at: string | null;
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
    saved: row.saved_at !== null,
    childIds: row.idea_players.flatMap((p) => (p.child_id ? [p.child_id] : [])),
    parentIds: row.idea_players.flatMap((p) => (p.user_id ? [p.user_id] : [])),
  };
}

/** Asks Claude for a few new ideas and returns their ids (they start unsaved). */
export async function generateIdeas(request: IdeaRequest): Promise<string[]> {
  const { ideas } = await invokeFunction<{ ideas: { id: string }[] }>('generate-idea', {
    count: 3,
    ...request,
  });
  return ideas.map((i) => i.id);
}

/** The same request again, offering every toy the parent offered the first time. */
export function requestFrom(idea: Idea): IdeaRequest {
  return {
    childIds: idea.childIds,
    parentIds: idea.parentIds,
    toyIds: idea.content.offered_toy_ids ?? idea.content.toys.map((t) => t.toy_id),
    situation: idea.content.situation ?? undefined,
  };
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

/** Every saved idea, best rated first, then most recently saved. */
export async function listSavedIdeas(): Promise<Idea[]> {
  const [{ data, error }, userId] = await Promise.all([
    supabase
      .from('ideas')
      .select(IDEA_COLUMNS)
      .not('saved_at', 'is', null)
      .order('saved_at', { ascending: false }),
    myUserId(),
  ]);
  if (error) throw new FriendlyError(error.message);
  return data.map((row) => toIdea(row, userId)).sort((a, b) => b.score - a.score);
}

/** Saved ideas using any of these toys, ranked by the database (see match_saved_ideas). */
export async function matchSavedIdeas(toyIds: string[], childIds: string[]): Promise<string[]> {
  const { data, error } = await supabase.rpc('match_saved_ideas', {
    chosen_toy_ids: toyIds,
    chosen_child_ids: childIds,
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

export async function setIdeaSaved(id: string, saved: boolean): Promise<void> {
  const { error } = await supabase
    .from('ideas')
    .update({ saved_at: saved ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) throw new FriendlyError(error.message);
}
