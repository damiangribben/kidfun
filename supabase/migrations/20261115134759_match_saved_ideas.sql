-- Finds saved ideas that use any of the chosen toys, best first:
--   1. ideas whose toys are all among the chosen ones ("ready to play"),
--      then ideas that share only some of them
--   2. higher thumbs score (both parents' votes added up)
--   3. ideas made for exactly the same children
--   4. more shared toys, then most recently saved
-- Runs as the caller, so row-level security keeps it to their household.
create function public.match_saved_ideas(chosen_toy_ids uuid[], chosen_child_ids uuid[])
returns table (
  idea_id uuid,
  all_toys_chosen boolean,
  shared_toys integer,
  score integer,
  same_players boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with candidates as (
    select
      i.id,
      i.saved_at,
      count(*) filter (where it.toy_id = any (chosen_toy_ids)) as shared,
      count(*) as total
    from public.ideas i
    join public.idea_toys it on it.idea_id = i.id
    where i.saved_at is not null
    group by i.id, i.saved_at
  ),
  ranked as (
    select
      c.id,
      c.saved_at,
      c.shared = c.total as all_chosen,
      c.shared::integer as shared,
      coalesce((select sum(r.value) from public.idea_ratings r where r.idea_id = c.id), 0)::integer
        as score,
      coalesce(
        (select array_agg(p.child_id order by p.child_id)
         from public.idea_players p
         where p.idea_id = c.id and p.child_id is not null),
        '{}'
      ) = coalesce(
        (select array_agg(x order by x) from unnest(chosen_child_ids) as x),
        '{}'
      ) as same_players
    from candidates c
    where c.shared > 0
  )
  select id, all_chosen, shared, score, same_players
  from ranked
  order by all_chosen desc, score desc, same_players desc, shared desc, saved_at desc
  limit 20;
$$;

revoke all on function public.match_saved_ideas(uuid[], uuid[]) from public, anon;
grant execute on function public.match_saved_ideas(uuid[], uuid[]) to authenticated;
