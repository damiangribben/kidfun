import { FunctionsHttpError } from '@supabase/supabase-js';

import { FriendlyError } from '@/lib/family';
import { supabase } from '@/lib/supabase';

/** Calls an Edge Function and turns its error body into a message for the parent. */
export async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
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
