alter table public.activity_groups
add column if not exists max_members integer;

update public.activity_groups
set max_members = 6
where max_members is null;

alter table public.activity_groups
alter column max_members set default 6;

alter table public.activity_groups
alter column max_members set not null;

alter table public.activity_groups
drop constraint if exists activity_groups_max_members_check;

alter table public.activity_groups
add constraint activity_groups_max_members_check
check (max_members in (2, 3, 4, 5, 6, 8, 10));
