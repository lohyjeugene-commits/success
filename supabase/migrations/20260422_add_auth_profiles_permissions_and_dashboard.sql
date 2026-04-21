create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  bio text,
  favorite_activity text,
  home_area text,
  avatar_emoji text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touchgrass_set_current_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touchgrass_profiles_updated_at on public.profiles;

create trigger touchgrass_profiles_updated_at
before update on public.profiles
for each row
execute procedure public.touchgrass_set_current_timestamp();

create or replace function public.touchgrass_create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    left(regexp_replace(split_part(coalesce(new.email, 'touchgrass-user'), '@', 1), '[^a-zA-Z0-9-]+', '-', 'g'), 24),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'TouchGrass member'), '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists touchgrass_on_auth_user_created on auth.users;

create trigger touchgrass_on_auth_user_created
after insert on auth.users
for each row
execute procedure public.touchgrass_create_profile_for_new_user();

alter table public.activity_groups
add column if not exists creator_user_id uuid references auth.users(id) on delete set null;

alter table public.group_members
add column if not exists auth_user_id uuid references auth.users(id) on delete cascade;

alter table public.group_members
add column if not exists role text;

update public.group_members
set role = 'member'
where role is null;

alter table public.group_members
alter column role set default 'member';

alter table public.group_members
alter column role set not null;

alter table public.group_members
drop constraint if exists group_members_role_check;

alter table public.group_members
add constraint group_members_role_check
check (role in ('member', 'admin', 'creator'));

create unique index if not exists group_members_group_id_auth_user_id_idx
on public.group_members (group_id, auth_user_id)
where auth_user_id is not null;

alter table public.availability_votes
add column if not exists auth_user_id uuid references auth.users(id) on delete cascade;

create unique index if not exists availability_votes_slot_id_auth_user_id_idx
on public.availability_votes (slot_id, auth_user_id)
where auth_user_id is not null;

create table if not exists public.slot_acceptances (
  id uuid primary key default uuid_generate_v4(),
  slot_id uuid not null references public.meetup_slots(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(slot_id, user_id)
);

alter table public.activity_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.meetup_slots enable row level security;
alter table public.availability_votes enable row level security;
alter table public.slot_acceptances enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Anyone can read groups" on public.activity_groups;
create policy "Anyone can read groups"
on public.activity_groups
for select
using (true);

drop policy if exists "Authenticated users can create groups" on public.activity_groups;
create policy "Authenticated users can create groups"
on public.activity_groups
for insert
to authenticated
with check (creator_user_id = auth.uid());

drop policy if exists "Anyone can read group members" on public.group_members;
create policy "Anyone can read group members"
on public.group_members
for select
using (true);

drop policy if exists "Users can join groups as themselves" on public.group_members;
create policy "Users can join groups as themselves"
on public.group_members
for insert
to authenticated
with check (auth_user_id = auth.uid());

drop policy if exists "Anyone can read meetup slots" on public.meetup_slots;
create policy "Anyone can read meetup slots"
on public.meetup_slots
for select
using (true);

drop policy if exists "Group admins can create meetup slots" on public.meetup_slots;
create policy "Group admins can create meetup slots"
on public.meetup_slots
for insert
to authenticated
with check (
  exists (
    select 1
    from public.activity_groups
    where public.activity_groups.id = meetup_slots.group_id
      and public.activity_groups.creator_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.group_members
    where public.group_members.group_id = meetup_slots.group_id
      and public.group_members.auth_user_id = auth.uid()
      and public.group_members.role in ('admin', 'creator')
  )
);

drop policy if exists "Anyone can read availability votes" on public.availability_votes;
create policy "Anyone can read availability votes"
on public.availability_votes
for select
using (true);

drop policy if exists "Joined members can vote availability" on public.availability_votes;
create policy "Joined members can vote availability"
on public.availability_votes
for insert
to authenticated
with check (
  auth_user_id = auth.uid()
  and exists (
    select 1
    from public.meetup_slots
    join public.group_members
      on public.group_members.group_id = public.meetup_slots.group_id
    where public.meetup_slots.id = availability_votes.slot_id
      and public.group_members.auth_user_id = auth.uid()
  )
);

drop policy if exists "Users can read their own accepted invites" on public.slot_acceptances;
create policy "Users can read their own accepted invites"
on public.slot_acceptances
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Joined members can accept slot invites" on public.slot_acceptances;
create policy "Joined members can accept slot invites"
on public.slot_acceptances
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.meetup_slots
    join public.group_members
      on public.group_members.group_id = public.meetup_slots.group_id
    where public.meetup_slots.id = slot_acceptances.slot_id
      and public.group_members.auth_user_id = auth.uid()
  )
);

drop policy if exists "Public profiles are readable" on public.profiles;
create policy "Public profiles are readable"
on public.profiles
for select
using (true);

drop policy if exists "Users can insert their own profiles" on public.profiles;
create policy "Users can insert their own profiles"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Users can update their own profiles" on public.profiles;
create policy "Users can update their own profiles"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());
