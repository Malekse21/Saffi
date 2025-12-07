-- Function to allow users to delete their own account
-- This must be SECURITY DEFINER to have permission to delete from auth.users
create or replace function delete_own_user()
returns void
language plpgsql
security definer
as $$
begin
  delete from auth.users
  where id = auth.uid();
end;
$$;
