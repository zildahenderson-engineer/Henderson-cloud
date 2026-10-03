-- Henderson Cloud: a proprietária usa login e senha normalmente; MFA permanece opcional.
create or replace function public.is_platform_owner()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.platform_owners p
    where p.user_id = (select auth.uid())
      and p.status = 'active'
  );
$$;

create or replace function public.claim_platform_owner()
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_email text := lower(coalesce((select auth.jwt() ->> 'email'), ''));
  bootstrap_email text;
  current_owner_count integer;
begin
  if actor_id is null then return false; end if;
  select lower(email) into bootstrap_email from public.platform_owner_bootstrap where id = true and enabled = true;
  if bootstrap_email is null or actor_email <> bootstrap_email then return false; end if;
  select count(*)::integer into current_owner_count from public.platform_owners where status = 'active';
  if current_owner_count > 0 and not exists (select 1 from public.platform_owners where user_id = actor_id and status = 'active') then return false; end if;
  insert into public.platform_owners (user_id, email, status, last_seen_at)
  values (actor_id, actor_email, 'active', now())
  on conflict (user_id) do update set last_seen_at = now(), status = 'active';
  if not exists (select 1 from public.organization_members where user_id = actor_id and status = 'active') then
    perform public.create_organization('Henderson Cloud', 'henderson-cloud', 'BR', 'pt-BR', 'America/Sao_Paulo', 'BRL');
  end if;
  return true;
end;
$$;

grant execute on function public.is_platform_owner() to authenticated;
grant execute on function public.claim_platform_owner() to authenticated;
