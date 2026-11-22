-- Custom places to play (e.g. "Beach", "Restaurant"), on top of the built-in
-- indoors / garden / park / car. Ideas made for one store "custom:<id>" as
-- their setting.
create table public.play_locations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null default public.my_household_id()
    references public.households (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 40),
  created_at timestamptz not null default now()
);

create unique index play_locations_name_idx
  on public.play_locations (household_id, lower(trim(name)));

alter table public.play_locations enable row level security;

create policy "Household members manage play locations" on public.play_locations
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- Library matching now also covers toy-free ideas:
--   with toys chosen  -> ideas sharing at least one of them (as before)
--   with no toys      -> ideas that need no toys
-- Same setting only; ideas from before settings existed count as indoors.
create or replace function public.match_ideas(
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
      count(it.toy_id) filter (where it.toy_id = any (chosen_toy_ids)) as shared,
      count(it.toy_id) as total
    from public.ideas i
    left join public.idea_toys it on it.idea_id = i.id
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
    where (coalesce(cardinality(chosen_toy_ids), 0) = 0 and c.total = 0)
       or c.shared > 0
  )
  select id, all_chosen, shared, score, same_players
  from ranked
  order by all_chosen desc, score desc, same_players desc, shared desc, created_at desc
  limit 20;
$$;
