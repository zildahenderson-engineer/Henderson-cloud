-- Allow the platform owner to enter the control plane without an onboarding dependency.
-- Workspace provisioning can happen separately and must not block platform administration.
create or replace function public.claim_platform_owner()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_email text := lower(coalesce((select auth.jwt() ->> 'email'), ''));
  bootstrap_email text;
  current_owner_count integer;
begin
  if actor_id is null then return false; end if;
  select lower(email) into bootstrap_email
    from public.platform_owner_bootstrap
   where id = true and enabled = true;
  if bootstrap_email is null or actor_email <> bootstrap_email then return false; end if;
  select count(*)::integer into current_owner_count
    from public.platform_owners where status = 'active';
  if current_owner_count > 0 and not exists (
    select 1 from public.platform_owners
     where user_id = actor_id and status = 'active'
  ) then return false; end if;
  insert into public.platform_owners (user_id, email, status, last_seen_at)
  values (actor_id, actor_email, 'active', now())
  on conflict (user_id) do update
    set last_seen_at = now(), status = 'active';
  return true;
end;
$$;

grant execute on function public.claim_platform_owner() to authenticated;
