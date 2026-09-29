-- Platform Owner administration / protected control plane
create table if not exists public.platform_owners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

-- The bootstrap address is the owner's address supplied for this platform.
-- Claiming still requires an authenticated session and AAL2/MFA.
create table if not exists public.platform_owner_bootstrap (
  id boolean primary key default true check (id),
  email text not null unique,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
insert into public.platform_owner_bootstrap (id, email)
values (true, 'zildahenderson9@gmail.com')
on conflict (id) do update set email = excluded.email;

alter table public.platform_owners enable row level security;
alter table public.platform_owner_bootstrap enable row level security;
revoke all on table public.platform_owners, public.platform_owner_bootstrap from anon, authenticated;

create or replace function public.is_platform_owner()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.platform_owners p
    where p.user_id = (select auth.uid())
      and p.status = 'active'
      and coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
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
  if coalesce((select auth.jwt() ->> 'aal'), 'aal1') <> 'aal2' then return false; end if;
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

create or replace function public.platform_overview()
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Platform owner access required' using errcode = '42501'; end if;
  select jsonb_build_object(
    'tenant_count', (select count(*) from public.organizations),
    'user_count', (select count(*) from auth.users),
    'active_members', (select count(*) from public.organization_members where status = 'active'),
    'lead_count', (select count(*) from public.crm_leads),
    'audit_count', (select count(*) from public.audit_logs),
    'tenants', coalesce((select jsonb_agg(jsonb_build_object(
      'id', o.id, 'name', o.name, 'slug', o.slug, 'locale', o.locale, 'currency', o.currency,
      'created_at', o.created_at,
      'members', (select count(*) from public.organization_members m where m.organization_id = o.id and m.status = 'active'),
      'leads', (select count(*) from public.crm_leads l where l.organization_id = o.id)
    ) order by o.created_at desc) from public.organizations o), '[]'::jsonb),
    'recent_audit', coalesce((select jsonb_agg(jsonb_build_object(
      'id', a.id, 'organization_id', a.organization_id, 'action', a.action, 'resource_type', a.resource_type, 'resource_id', a.resource_id, 'occurred_at', a.occurred_at
    ) order by a.occurred_at desc) from (select * from public.audit_logs order by occurred_at desc limit 20) a), '[]'::jsonb)
  ) into result;
  update public.platform_owners set last_seen_at = now() where user_id = (select auth.uid());
  return result;
end;
$$;

revoke all on function public.is_platform_owner() from public, anon;
revoke all on function public.claim_platform_owner() from public, anon;
revoke all on function public.platform_overview() from public, anon;
grant execute on function public.is_platform_owner() to authenticated;
grant execute on function public.claim_platform_owner() to authenticated;
grant execute on function public.platform_overview() to authenticated;
