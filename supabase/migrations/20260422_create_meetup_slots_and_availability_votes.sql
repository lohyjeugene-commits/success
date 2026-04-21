create extension if not exists "uuid-ossp";

create table if not exists public.meetup_slots (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.activity_groups(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.availability_votes (
  id uuid primary key default uuid_generate_v4(),
  slot_id uuid not null references public.meetup_slots(id) on delete cascade,
  user_id text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists availability_votes_slot_id_user_id_idx
on public.availability_votes (slot_id, user_id);
