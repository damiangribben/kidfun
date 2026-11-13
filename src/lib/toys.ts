import { FunctionsHttpError } from '@supabase/supabase-js';

import type { Tables, TablesInsert } from '@/lib/database.types';
import { FriendlyError } from '@/lib/family';
import { supabase } from '@/lib/supabase';

// Must match the check constraint on public.toys.category.
export const TOY_CATEGORIES = [
  { value: 'building', label: 'Building' },
  { value: 'small_world', label: 'Small world' },
  { value: 'games', label: 'Games' },
  { value: 'puzzles', label: 'Puzzles' },
  { value: 'arts_crafts', label: 'Arts & crafts' },
  { value: 'pretend', label: 'Pretend play' },
  { value: 'musical', label: 'Musical' },
  { value: 'outdoor_active', label: 'Outdoor & active' },
  { value: 'other', label: 'Other' },
] as const;

export type ToyCategory = (typeof TOY_CATEGORIES)[number]['value'];

export function categoryLabel(value: string): string {
  return TOY_CATEGORIES.find((c) => c.value === value)?.label ?? 'Other';
}

export type Toy = Tables<'toys'> & { places: { name: string } | null };
export type ToyInput = Pick<
  TablesInsert<'toys'>,
  'name' | 'category' | 'place_id' | 'location_hint' | 'small_parts'
>;

/** A toy found by Claude, before the parent saves it. */
export type DetectedToy = {
  name: string;
  category: ToyCategory;
  small_parts: boolean;
};

export async function listToys(): Promise<Toy[]> {
  const { data, error } = await supabase.from('toys').select('*, places(name)').order('name');
  if (error) throw new FriendlyError(error.message);
  return data;
}

export async function getToy(id: string): Promise<Toy> {
  const { data, error } = await supabase
    .from('toys')
    .select('*, places(name)')
    .eq('id', id)
    .single();
  if (error) throw new FriendlyError(error.message);
  return data;
}

export async function saveToy(id: string, input: ToyInput): Promise<void> {
  const { error } = await supabase.from('toys').update(input).eq('id', id);
  if (error) throw new FriendlyError(error.message);
}

export async function addToys(toys: ToyInput[]): Promise<void> {
  const { error } = await supabase.from('toys').insert(toys);
  if (error) throw new FriendlyError(error.message);
}

export async function deleteToy(id: string): Promise<void> {
  const { error } = await supabase.from('toys').delete().eq('id', id);
  if (error) throw new FriendlyError(error.message);
}

/** Calls an Edge Function and turns its error body into a message for the parent. */
async function invoke<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const details = await error.context.json().catch(() => null);
      throw new FriendlyError(details?.error ?? 'Something went wrong. Please try again.');
    }
    throw new FriendlyError('Couldn’t reach the server. Check your connection and try again.');
  }
  return data as T;
}

/** Sends a typed or dictated list to Claude and returns the toys it found. */
export async function parseToyList(text: string): Promise<DetectedToy[]> {
  const { toys } = await invoke<{ toys: DetectedToy[] }>('parse-toys', { text });
  return toys;
}

/** Sends a JPEG photo to Claude and returns the toys it can see. */
export async function detectToysInPhoto(base64Jpeg: string): Promise<DetectedToy[]> {
  const { toys } = await invoke<{ toys: DetectedToy[] }>('photo-toys', {
    image: base64Jpeg,
    mediaType: 'image/jpeg',
  });
  return toys;
}
