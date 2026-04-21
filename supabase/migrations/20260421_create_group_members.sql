create extension if not exists "uuid-ossp";

create table if not exists public.group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.activity_groups(id) on delete cascade,
  name text not null
);
