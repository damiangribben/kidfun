import type { Tables, TablesInsert } from '@/lib/database.types';
import { FriendlyError } from '@/lib/family';
import { invokeFunction as invoke } from '@/lib/functions';
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

/** Adds toys and returns their new ids. */
export async function addToys(toys: ToyInput[]): Promise<string[]> {
  const { data, error } = await supabase.from('toys').insert(toys).select('id');
  if (error) throw new FriendlyError(error.message);
  return data.map((t) => t.id);
}

export async function deleteToy(id: string): Promise<void> {
  const { error } = await supabase.from('toys').delete().eq('id', id);
  if (error) throw new FriendlyError(error.message);
}

/** Sends a typed or dictated list to Claude and returns the toys it found. */
export async function parseToyList(text: string): Promise<DetectedToy[]> {
  const { toys } = await invoke<{ toys: DetectedToy[] }>('parse-toys', { text });
  return toys;
}

function photoPayload(base64Jpegs: string[]) {
  return base64Jpegs.map((data) => ({ data, mediaType: 'image/jpeg' }));
}

/** Sends JPEG photos to Claude and returns the toys it can see across all of them. */
export async function detectToysInPhotos(base64Jpegs: string[]): Promise<DetectedToy[]> {
  const { toys } = await invoke<{ toys: DetectedToy[] }>('photo-toys', {
    images: photoPayload(base64Jpegs),
  });
  return toys;
}

export type SpottedToy = DetectedToy & { existing_toy_id: string | null };

/**
 * Like detectToysInPhotos, but also matches each toy against the inventory:
 * the toys kept at one place, or every toy when placeId is null.
 */
export async function spotToys(base64Jpegs: string[], placeId: string | null): Promise<SpottedToy[]> {
  const { toys } = await invoke<{ toys: SpottedToy[] }>('photo-toys', {
    images: photoPayload(base64Jpegs),
    ...(placeId ? { placeId } : { matchAllToys: true }),
  });
  return toys;
}
