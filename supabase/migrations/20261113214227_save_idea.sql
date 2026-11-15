-- Saves an idea with its toy and player tags in one transaction.
-- Runs as the caller, so row-level security and the household defaults apply.
create function public.save_idea(
  idea_name text,
  idea_pitch text,
  idea_content jsonb,
  supervise boolean,
  toy_ids uuid[],
  child_ids uuid[],
  parent_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_id uuid;
begin
  insert into public.ideas (name, pitch, content, supervise_closely)
  values (idea_name, idea_pitch, idea_content, supervise)
  returning id into new_id;

  insert into public.idea_toys (idea_id, toy_id)
  select new_id, t from unnest(toy_ids) as t;

  insert into public.idea_players (idea_id, child_id)
  select new_id, c from unnest(child_ids) as c;

  insert into public.idea_players (idea_id, user_id)
  select new_id, p from unnest(parent_ids) as p;

  return new_id;
end;
$$;

revoke all on function public.save_idea(text, text, jsonb, boolean, uuid[], uuid[], uuid[]) from public, anon;
grant execute on function public.save_idea(text, text, jsonb, boolean, uuid[], uuid[], uuid[]) to authenticated;
