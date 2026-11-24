-- Ideas are now written generically and shared in one global store (KIDFUN-14).
--
-- Claude never writes real names. Players and toys appear in the text as slot
-- tokens such as {{child_1}}, {{parent_1}}, {{friend_1}} and {{toy_1}}. The
-- generic idea lives in global_ideas, which has no link to any household or
-- parent. Each household's ideas row points at a global idea and holds its own
-- mapping from slots to its children, parents, friends and toys; the app swaps
-- the tokens for names on the device.
--
-- Existing ideas were written with real names, so they are deleted for a clean
-- start (agreed: only testers have ideas so far).

delete from public.ideas;

-- ---------------------------------------------------------------------------
-- Global ideas
--
-- content holds the generic idea:
--   {
--     "setup":       ["step with {{toy_1}}", ...],
--     "roles":       [{ "slot": "child_1", "role": "..." }],
--     "parent_role": "...",
--     "players":     [{ "slot": "child_1", "kind": "child", "age_months": 40 }],
--     "toys":        [{ "slot": "toy_1", "description": "wooden train set",
--                       "category": "small_world", "small_parts": false }]
--   }
-- setting is a built-in setting or 'custom', with place_description saying
-- what kind of place a custom one is ("beach", "grandparent's house").

create table public.global_ideas (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  pitch text not null check (char_length(pitch) between 1 and 300),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  setting text not null check (setting in ('indoors', 'garden', 'park', 'car', 'custom')),
  place_description text check (char_length(place_description) <= 80),
  model text not null,
  created_at timestamptz not null default now()
);

alter table public.global_ideas enable row level security;

-- ---------------------------------------------------------------------------
-- Household ideas now point at a global idea and keep only the localisation.
--
-- local holds the household's mapping:
--   {
--     "players":        { "child_1": { "child_id" }, "parent_1": { "user_id" },
--                         "friend_1": { "age" } },
--     "toys":           { "toy_1": "<toy id>" },
--     "situation":      "..." | null,
--     "offered_toy_ids": ["<toy id>", ...],
--     "guests":         [{ "age" }]
--   }

alter table public.ideas
  drop column name,
  drop column pitch,
  drop column content,
  add column global_idea_id uuid not null
    references public.global_ideas (id) on delete restrict,
  add column setting text not null default 'indoors',
  add column local jsonb not null default '{}' check (jsonb_typeof(local) = 'object');

create index ideas_global_idea_idx on public.ideas (global_idea_id);
create index ideas_setting_idx on public.ideas (household_id, setting);

-- Parents can read a global idea only when their household has it in its
-- library. Nobody writes directly; save_idea inserts them.
create policy "Household members read their linked global ideas" on public.global_ideas
  for select to authenticated
  using (
    exists (
      select 1 from public.ideas i
      where i.global_idea_id = global_ideas.id
        and public.is_household_member(i.household_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Child notes are no longer sent to Claude, so they're no longer kept.

alter table public.children drop column notes;

-- ---------------------------------------------------------------------------
-- save_idea: writes the global idea and the household's row with its tags in
-- one transaction. Security definer so it can insert into global_ideas, which
-- parents can't write to; the household comes from the caller, and the
-- composite foreign keys stop tags pointing at another household's data.

drop function public.save_idea(text, text, jsonb, boolean, uuid[], uuid[], uuid[]);

create function public.save_idea(
  idea_name text,
  idea_pitch text,
  generic_content jsonb,
  generic_setting text,
  generic_place_description text,
  idea_model text,
  local_setting text,
  local_content jsonb,
  supervise boolean,
  toy_ids uuid[],
  child_ids uuid[],
  parent_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  hid uuid := public.my_household_id();
  global_id uuid;
  new_id uuid;
begin
  if hid is null then
    raise exception 'Join a household first';
  end if;

  insert into public.global_ideas (name, pitch, content, setting, place_description, model)
  values (idea_name, idea_pitch, generic_content, generic_setting, generic_place_description, idea_model)
  returning id into global_id;

  insert into public.ideas (household_id, global_idea_id, setting, local, supervise_closely, created_by)
  values (hid, global_id, local_setting, local_content, supervise, auth.uid())
  returning id into new_id;

  insert into public.idea_toys (household_id, idea_id, toy_id)
  select hid, new_id, t from unnest(toy_ids) as t;

  insert into public.idea_players (household_id, idea_id, child_id)
  select hid, new_id, c from unnest(child_ids) as c;

  insert into public.idea_players (household_id, idea_id, user_id)
  select hid, new_id, p from unnest(parent_ids) as p;

  return new_id;
end;
$$;

revoke all on function public.save_idea(text, text, jsonb, text, text, text, text, jsonb, boolean, uuid[], uuid[], uuid[]) from public, anon;
grant execute on function public.save_idea(text, text, jsonb, text, text, text, text, jsonb, boolean, uuid[], uuid[], uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- match_ideas: same ranking as before, reading the setting from its new column.

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
    where i.setting = chosen_setting
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
