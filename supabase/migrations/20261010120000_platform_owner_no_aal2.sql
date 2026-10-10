-- The platform owner uses normal email/password authentication.
-- Do not require an AAL2/MFA claim for the owner control plane.
create or replace function public.is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.platform_owners p
     where p.user_id = (select auth.uid())
       and p.status = 'active'
  );
$$;
