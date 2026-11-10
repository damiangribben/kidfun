-- Households: both parents share one household and all its data.
-- Parents never write these tables directly; they use create_household / join_household.

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  invite_code text not null unique,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id),
  -- Phase 1: a parent belongs to exactly one household.
  unique (user_id)
);

alter table public.households enable row level security;
alter table public.household_members enable row level security;

-- Security definer so policies on household_members can call it without recursing.
create function public.is_household_member(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = (select auth.uid())
  );
$$;

create policy "Members can see their household"
  on public.households for select to authenticated
  using (public.is_household_member(id));

create policy "Members can see who is in their household"
  on public.household_members for select to authenticated
  using (public.is_household_member(household_id));

-- 8 characters from a 32-character alphabet with no 0/O or 1/I lookalikes.
create function public.generate_invite_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (get_byte(b, i) % 32) + 1, 1), ''
  )
  from (select extensions.gen_random_bytes(8) as b) r,
       generate_series(0, 7) as i;
$$;

create function public.create_household(household_name text)
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
  return h;
end;
$$;

create function public.join_household(code text)
returns public.households
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  normalized text := upper(regexp_replace(coalesce(code, ''), '[^A-Za-z0-9]', '', 'g'));
  h public.households;
begin
  if uid is null then
    raise exception 'You need to be signed in';
  end if;
  if exists (select 1 from public.household_members where user_id = uid) then
    raise exception 'You are already in a household';
  end if;

  select * into h from public.households where invite_code = normalized;
  if not found then
    raise exception 'No household has that invite code';
  end if;

  insert into public.household_members (household_id, user_id) values (h.id, uid);
  return h;
end;
$$;

revoke all on function public.is_household_member(uuid) from public, anon;
revoke all on function public.generate_invite_code() from public, anon, authenticated;
revoke all on function public.create_household(text) from public, anon;
revoke all on function public.join_household(text) from public, anon;
grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.create_household(text) to authenticated;
grant execute on function public.join_household(text) to authenticated;
