alter table public.group_members
add column if not exists user_id text;

update public.group_members
set user_id = id::text
where user_id is null;

alter table public.group_members
alter column user_id set not null;

create unique index if not exists group_members_group_id_user_id_idx
on public.group_members (group_id, user_id);
