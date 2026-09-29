-- Henderson Cloud: email/password authentication is sufficient for access.
-- MFA remains available as an optional security feature in the Security area.
create or replace function public.is_org_member(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function public.has_org_permission(p_organization_id uuid, p_permission_key text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.organization_members m
    join public.member_roles mr on mr.member_id = m.id and mr.organization_id = m.organization_id
    join public.role_permissions rp on rp.role_id = mr.role_id
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and rp.permission_key = p_permission_key
  );
$$;

create or replace function public.create_organization(
  p_name text,
  p_slug text,
  p_country text default 'BR',
  p_locale text default 'pt-BR',
  p_timezone text default 'America/Sao_Paulo',
  p_currency text default 'BRL'
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := (select auth.uid());
  new_org_id uuid;
  new_member_id uuid;
begin
  if actor_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_name is null or char_length(trim(p_name)) not between 2 and 120 then raise exception 'Invalid organization name' using errcode = '22023'; end if;
  if p_slug is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(p_slug) not between 3 and 48 then raise exception 'Invalid organization slug' using errcode = '22023'; end if;
  if p_country is null or p_country !~ '^[A-Z]{2}$' then raise exception 'Invalid country code' using errcode = '22023'; end if;
  if p_currency is null or p_currency !~ '^[A-Z]{3}$' then raise exception 'Invalid currency code' using errcode = '22023'; end if;
  if p_locale not in ('pt-BR', 'en', 'es') then raise exception 'Unsupported locale' using errcode = '22023'; end if;

  insert into public.organizations (name, slug, country_code, locale, timezone, currency, created_by)
  values (trim(p_name), p_slug, p_country, p_locale, p_timezone, p_currency, actor_id)
  returning id into new_org_id;

  insert into public.roles (organization_id, code, name, is_system) values
    (new_org_id, 'owner', 'Proprietário', true),
    (new_org_id, 'admin', 'Administrador', true),
    (new_org_id, 'manager', 'Gerente', true),
    (new_org_id, 'employee', 'Colaborador', true),
    (new_org_id, 'viewer', 'Leitor', true);

  insert into public.role_permissions (role_id, permission_key)
  select r.id, p.key
  from public.roles r cross join public.permissions p
  where r.organization_id = new_org_id and (
    r.code = 'owner'
    or (r.code = 'admin' and p.key <> 'security.manage')
    or (r.code = 'manager' and p.key in ('organization.read', 'members.read', 'audit.read'))
    or (r.code in ('employee', 'viewer') and p.key in ('organization.read', 'members.read'))
  );

  insert into public.organization_members (organization_id, user_id, status)
  values (new_org_id, actor_id, 'active') returning id into new_member_id;

  insert into public.member_roles (organization_id, member_id, role_id, assigned_by)
  select new_org_id, new_member_id, r.id, actor_id
  from public.roles r where r.organization_id = new_org_id and r.code = 'owner';

  return new_org_id;
end;
$$;

create or replace function public.is_platform_owner()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.platform_owners p where p.user_id = (select auth.uid()) and p.status = 'active');
$$;

create or replace function public.claim_platform_owner()
returns boolean language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := (select auth.uid()); actor_email text := lower(coalesce((select auth.jwt() ->> 'email'), '')); bootstrap_email text; current_owner_count integer;
begin
  if actor_id is null then return false; end if;
  select lower(email) into bootstrap_email from public.platform_owner_bootstrap where id = true and enabled = true;
  if bootstrap_email is null or actor_email <> bootstrap_email then return false; end if;
  select count(*)::integer into current_owner_count from public.platform_owners where status = 'active';
  if current_owner_count > 0 and not exists (select 1 from public.platform_owners where user_id = actor_id and status = 'active') then return false; end if;
  insert into public.platform_owners (user_id, email, status, last_seen_at) values (actor_id, actor_email, 'active', now()) on conflict (user_id) do update set last_seen_at = now(), status = 'active';
  if not exists (select 1 from public.organization_members where user_id = actor_id and status = 'active') then
    perform public.create_organization('Henderson Cloud', 'henderson-cloud', 'BR', 'pt-BR', 'America/Sao_Paulo', 'BRL');
  end if;
  return true;
end;
$$;
