-- Library matching now also takes where the family is playing (indoors,
-- garden, park). Ideas record their setting in content->>'setting'; ideas made
-- before settings existed count as indoors.
-- match_ideas(uuid[], uuid[]) hasn't shipped in an installed app yet, so it is
-- replaced rather than kept alongside.
drop function public.match_ideas(uuid[], uuid[]);

create function public.match_ideas(
  chosen_toy_ids uuid[],
  chosen_child_ids uuid[],
  chosen_setting text
)
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
      i.created_at,
      count(*) filter (where it.toy_id = any (chosen_toy_ids)) as shared,
      count(*) as total
    from public.ideas i
    join public.idea_toys it on it.idea_id = i.id
    where coalesce(i.content ->> 'setting', 'indoors') = chosen_setting
    group by i.id, i.created_at
  ),
  ranked as (
    select
      c.id,
      c.created_at,
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
  order by all_chosen desc, score desc, same_players desc, shared desc, created_at desc
  limit 20;
$$;

revoke all on function public.match_ideas(uuid[], uuid[], text) from public, anon;
grant execute on function public.match_ideas(uuid[], uuid[], text) to authenticated;
