import { createClient } from "npm:@supabase/supabase-js@2.119.0";

/** An error whose message is safe to show to the parent. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return json({ error: error.message }, error.status);
  }
  console.error(error);
  return json({ error: "Something went wrong. Please try again." }, 500);
}

/**
 * Checks the caller is a signed-in parent who belongs to a household.
 * Every function that spends Claude credit calls this first.
 */
export async function requireHouseholdMember(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Please sign in again.");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) throw new HttpError(401, "Please sign in again.");

  const { data: householdId, error: householdError } = await supabase.rpc("my_household_id");
  if (householdError || !householdId) throw new HttpError(403, "Join a household first.");

  return { supabase, userId: userData.user.id, householdId: householdId as string };
}
