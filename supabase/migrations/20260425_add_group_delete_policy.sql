drop policy if exists "Group admins can delete groups" on public.activity_groups;

create policy "Group admins can delete groups"
on public.activity_groups
for delete
to authenticated
using (
  creator_user_id = auth.uid()
  or exists (
    select 1
    from public.group_members
    where public.group_members.group_id = activity_groups.id
      and public.group_members.auth_user_id = auth.uid()
      and public.group_members.role in ('admin', 'creator')
  )
);
