import type { PostgrestError } from '@supabase/supabase-js';

import type { Tables, TablesInsert } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type Child = Tables<'children'>;
export type ChildInput = Pick<TablesInsert<'children'>, 'name' | 'birth_date' | 'favourites' | 'notes'>;
export type Place = Pick<Tables<'places'>, 'id' | 'name'> & { toyCount: number };

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

/** An error with a message that's fine to show a parent. */
export class FriendlyError extends Error {}

function fail(error: PostgrestError, messages: Record<string, string> = {}): never {
  throw new FriendlyError(messages[error.code] ?? error.message);
}

// Children -------------------------------------------------------------------

export async function listChildren(): Promise<Child[]> {
  const { data, error } = await supabase.from('children').select('*').order('birth_date');
  if (error) fail(error);
  return data;
}

export async function getChild(id: string): Promise<Child> {
  const { data, error } = await supabase.from('children').select('*').eq('id', id).single();
  if (error) fail(error);
  return data;
}

export async function saveChild(id: string | undefined, input: ChildInput): Promise<void> {
  const { error } = id
    ? await supabase.from('children').update(input).eq('id', id)
    : await supabase.from('children').insert(input);
  if (error) fail(error);
}

export async function deleteChild(id: string): Promise<void> {
  const { error } = await supabase.from('children').delete().eq('id', id);
  if (error) fail(error);
}

// Places ---------------------------------------------------------------------

export async function listPlaces(): Promise<Place[]> {
  const { data, error } = await supabase.from('places').select('id, name, toys(count)').order('name');
  if (error) fail(error);
  return data.map(({ id, name, toys }) => ({ id, name, toyCount: toys[0]?.count ?? 0 }));
}

export async function getPlace(id: string): Promise<Place> {
  const { data, error } = await supabase
    .from('places')
    .select('id, name, toys(count)')
    .eq('id', id)
    .single();
  if (error) fail(error);
  return { id: data.id, name: data.name, toyCount: data.toys[0]?.count ?? 0 };
}

export async function savePlace(id: string | undefined, name: string): Promise<void> {
  const { error } = id
    ? await supabase.from('places').update({ name }).eq('id', id)
    : await supabase.from('places').insert({ name });
  if (error) fail(error, { [UNIQUE_VIOLATION]: `You already have a place called "${name}".` });
}

export async function deletePlace(id: string): Promise<void> {
  const { count, error: countError } = await supabase
    .from('places')
    .select('id', { count: 'exact', head: true });
  if (countError) fail(countError);
  if (count === 1) throw new FriendlyError('You need at least one place, so this one can’t be deleted.');

  const { error } = await supabase.from('places').delete().eq('id', id);
  if (error) {
    fail(error, { [FOREIGN_KEY_VIOLATION]: 'Move or remove the toys here before deleting this place.' });
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
