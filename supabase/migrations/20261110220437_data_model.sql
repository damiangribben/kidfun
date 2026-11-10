-- Phase 1 data model: parents, children, places, toys, ideas and ratings.
--
-- Every row belongs to one household. household_id defaults to the signed-in
-- parent's household, so the app never has to send it. Composite foreign keys
-- on (household_id, id) stop a row linking to another household's data.

-- ---------------------------------------------------------------------------
-- Helpers

create function public.my_household_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select household_id from public.household_members where user_id = (select auth.uid());
$$;

revoke all on function public.my_household_id() from public, anon;
grant execute on function public.my_household_id() to authenticated;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Parents: a display name on the existing membership row.

alter table public.household_members
  add column display_name text check (char_length(display_name) between 1 and 40);

-- Parents may only change their own display name, nothing else on the row.
revoke update on public.household_members from authenticated;
grant update (display_name) on public.household_members to authenticated;

create policy "Parents can update their own display name"
  on public.household_members for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Children

create table public.children (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null default public.my_household_id()
    references public.households (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  -- Ages are worked out from this, so they stay right over time.
  birth_date date not null,
  favourites text check (char_length(favourites) <= 500),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, id)
);

-- ---------------------------------------------------------------------------
-- Places (home, grandparents' etc.)

create table public.places (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null default public.my_household_id()
    references public.households (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, id),
  unique (household_id, name)
);

-- ---------------------------------------------------------------------------
-- Toys

create table public.toys (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null default public.my_household_id()
    references public.households (id) on delete cascade,
  place_id uuid not null,
  name text not null check (char_length(name) between 1 and 80),
  category text not null default 'other' check (category in (
    'building', 'small_world', 'games', 'puzzles', 'arts_crafts',
    'pretend', 'musical', 'outdoor_active', 'other'
  )),
  -- Approximate and optional; toys move about.
  location_hint text check (char_length(location_hint) <= 80),
  small_parts boolean not null default false,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, id),
  -- A place can't be deleted while toys are still in it.
  foreign key (household_id, place_id)
    references public.places (household_id, id) on delete restrict
);

create index toys_place_idx on public.toys (household_id, place_id);

-- ---------------------------------------------------------------------------
-- Ideas
--
-- content holds the structured idea, written by the idea generator:
--   {
--     "toys":        [{ "toy_id", "name", "location_hint" }],
--     "setup":       ["step", ...],
--     "child_roles": [{ "child_id", "name", "role" }],
--     "parent_role": "what the parent does"
--   }
-- Toy and player tags are also stored in idea_toys / idea_players for matching.

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null default public.my_household_id()
    references public.households (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  pitch text not null check (char_length(pitch) between 1 and 300),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  supervise_closely boolean not null default false,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (household_id, id)
);

create table public.idea_toys (
  household_id uuid not null default public.my_household_id(),
  idea_id uuid not null,
  toy_id uuid not null,
  primary key (idea_id, toy_id),
  foreign key (household_id, idea_id)
    references public.ideas (household_id, id) on delete cascade,
  foreign key (household_id, toy_id)
    references public.toys (household_id, id) on delete cascade
);

create index idea_toys_toy_idx on public.idea_toys (household_id, toy_id);

-- Who the idea was made for: each row is either a child or a parent.
create table public.idea_players (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null default public.my_household_id(),
  idea_id uuid not null,
  child_id uuid,
  user_id uuid,
  check (num_nonnulls(child_id, user_id) = 1),
  unique (idea_id, child_id),
  unique (idea_id, user_id),
  foreign key (household_id, idea_id)
    references public.ideas (household_id, id) on delete cascade,
  foreign key (household_id, child_id)
    references public.children (household_id, id) on delete cascade,
  foreign key (household_id, user_id)
    references public.household_members (household_id, user_id) on delete cascade
);

create index idea_players_child_idx on public.idea_players (household_id, child_id);

-- One thumbs up (1) or down (-1) per parent per idea; ranking adds them up.
create table public.idea_ratings (
  household_id uuid not null default public.my_household_id(),
  idea_id uuid not null,
  user_id uuid not null default auth.uid(),
  value smallint not null check (value in (-1, 1)),
  rated_at timestamptz not null default now(),
  primary key (idea_id, user_id),
  foreign key (household_id, idea_id)
    references public.ideas (household_id, id) on delete cascade,
  foreign key (household_id, user_id)
    references public.household_members (household_id, user_id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- updated_at triggers

create trigger children_updated_at before update on public.children
  for each row execute function public.set_updated_at();
create trigger places_updated_at before update on public.places
  for each row execute function public.set_updated_at();
create trigger toys_updated_at before update on public.toys
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security: household members share everything in their household.

alter table public.children enable row level security;
alter table public.places enable row level security;
alter table public.toys enable row level security;
alter table public.ideas enable row level security;
alter table public.idea_toys enable row level security;
alter table public.idea_players enable row level security;
alter table public.idea_ratings enable row level security;

create policy "Household members manage children" on public.children
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "Household members manage places" on public.places
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "Household members manage toys" on public.toys
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "Household members manage ideas" on public.ideas
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "Household members manage idea toys" on public.idea_toys
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "Household members manage idea players" on public.idea_players
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "Household members see ratings" on public.idea_ratings
  for select to authenticated
  using (public.is_household_member(household_id));

create policy "Parents add their own ratings" on public.idea_ratings
  for insert to authenticated
  with check (public.is_household_member(household_id) and user_id = (select auth.uid()));

create policy "Parents change their own ratings" on public.idea_ratings
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (public.is_household_member(household_id) and user_id = (select auth.uid()));

create policy "Parents remove their own ratings" on public.idea_ratings
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Every household starts with a "Home" place.

create or replace function public.create_household(household_name text)
returns public.households
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  h public.households;
begin
  if uid is null then
    raise exception 'You need to be signed in';
  end if;
  if exists (select 1 from public.household_members where user_id = uid) then
    raise exception 'You are already in a household';
  end if;

  loop
    begin
      insert into public.households (name, invite_code, created_by)
      values (trim(household_name), public.generate_invite_code(), uid)
      returning * into h;
      exit;
    exception when unique_violation then
      -- Invite code collision; try another.
    end;
  end loop;

  insert into public.household_members (household_id, user_id) values (h.id, uid);
  insert into public.places (household_id, name) values (h.id, 'Home');
  return h;
end;
$$;

insert into public.places (household_id, name)
select id, 'Home' from public.households
on conflict (household_id, name) do nothing;
