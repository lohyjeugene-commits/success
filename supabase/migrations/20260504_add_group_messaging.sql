-- Group Messaging System Migration
-- Run this SQL in Supabase SQL Editor

-- Create messages table
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid not null references public.activity_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.messages enable row level security;

-- Policy: Group members can read messages from their groups
create policy "Group members can read messages"
on public.messages for select
using (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = messages.group_id
    and gm.user_id = auth.uid()
  )
);

-- Policy: Group members can insert messages to their groups
create policy "Group members can send messages"
on public.messages for insert
with check (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = messages.group_id
    and gm.user_id = auth.uid()
  )
  and auth.uid() = user_id
);

-- Policy: Users can delete their own messages
create policy "Users can delete own messages"
on public.messages for delete
using (auth.uid() = user_id);

-- Create index for better performance
create index if not exists idx_messages_group_id_created_at
on public.messages(group_id, created_at);

create index if not exists idx_messages_user_id
on public.messages(user_id);