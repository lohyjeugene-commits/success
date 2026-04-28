-- Auto-Matching and 5-Star Reliability System Migration
-- Run this SQL in Supabase SQL Editor

-- Create user_reliability table
create table if not exists public.user_reliability (
  user_id uuid primary key references auth.users(id) on delete cascade,
  attended_count int not null default 0,
  no_show_count int not null default 0,
  cancelled_count int not null default 0,
  rating numeric not null default 5.0,
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.user_reliability enable row level security;

-- Policy: Users can read their own reliability data
create policy "Users can view own reliability"
on public.user_reliability for select
using (auth.uid() = user_id);

-- Policy: Service role can manage all reliability data
create policy "Service role can manage reliability"
on public.user_reliability for all
using (auth.role() = 'service_role');

-- Create function to compute rating
create or replace function public.compute_user_rating(
  p_attended_count int,
  p_no_show_count int,
  p_cancelled_count int
)
returns numeric
language plpgsql
as $$
declare
  v_rating numeric;
begin
  v_rating := 5.0
    - (p_no_show_count * 1.0)
    - (p_cancelled_count * 0.3)
    + (p_attended_count * 0.1);
  
  return greatest(0, least(5, v_rating));
end;
$$;

-- Create function to get user rating (returns 5.0 if no row exists)
create or replace function public.get_user_rating(p_user_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rating numeric;
begin
  select rating into v_rating
  from public.user_reliability
  where user_id = p_user_id;
  
  return coalesce(v_rating, 5.0);
end;
$$;

-- Create function to update user reliability
create or replace function public.update_user_reliability(
  p_user_id uuid,
  p_event_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current record;
begin
  -- Get current values or defaults
  select attended_count, no_show_count, cancelled_count
  into v_current
  from public.user_reliability
  where user_id = p_user_id
  for update;
  
  if not found then
    insert into public.user_reliability (user_id, attended_count, no_show_count, cancelled_count, rating)
    values (
      p_user_id,
      case when p_event_type = 'attended' then 1 else 0 end,
      case when p_event_type = 'no_show' then 1 else 0 end,
      case when p_event_type = 'cancelled' then 1 else 0 end,
      5.0
    )
    on conflict (user_id) do update
    set attended_count = excluded.attended_count,
        no_show_count = excluded.no_show_count,
        cancelled_count = excluded.cancelled_count,
        rating = excluded.rating,
        updated_at = now();
  else
    update public.user_reliability
    set attended_count = attended_count + case when p_event_type = 'attended' then 1 else 0 end,
        no_show_count = no_show_count + case when p_event_type = 'no_show' then 1 else 0 end,
        cancelled_count = cancelled_count + case when p_event_type = 'cancelled' then 1 else 0 end,
        rating = public.compute_user_rating(
          attended_count + case when p_event_type = 'attended' then 1 else 0 end,
          no_show_count + case when p_event_type = 'no_show' then 1 else 0 end,
          cancelled_count + case when p_event_type = 'cancelled' then 1 else 0 end
        ),
        updated_at = now()
    where user_id = p_user_id;
  end if;
end;
$$;

-- Grant execute permissions
grant execute on function public.compute_user_rating(int, int, int) to service_role, authenticated, anon;
grant execute on function public.get_user_rating(uuid) to service_role, authenticated, anon;
grant execute on function public.update_user_reliability(uuid, text) to service_role, authenticated;

-- Add host_id column to activity_groups if not exists
alter table public.activity_groups
add column if not exists host_id uuid references auth.users(id) on delete set null;

-- Create index for faster queries
create index if not exists idx_activity_groups_host on activity_groups(host_id);
create index if not exists idx_group_members_user on group_members(user_id);
create index if not exists idx_group_members_auth_user on group_members(auth_user_id);