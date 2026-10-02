-- Henderson Cloud foundation / phase 1
-- This migration intentionally creates no demo tenants or production sample data.

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  locale text not null default 'pt-BR' check (locale in ('pt-BR', 'en', 'es')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 48),
  country_code char(2) not null default 'BR',
  locale text not null default 'pt-BR' check (locale in ('pt-BR', 'en', 'es')),
  timezone text not null default 'America/Sao_Paulo',
  currency char(3) not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id),
  unique (id, organization_id)
);
create index if not exists organization_members_user_status_idx on public.organization_members (user_id, status);
create index if not exists organization_members_org_status_idx on public.organization_members (organization_id, status);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null check (code ~ '^[a-z][a-z0-9_-]{1,47}$'),
  name text not null check (char_length(trim(name)) between 1 and 80),
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, code),
  unique (id, organization_id)
);

create table if not exists public.permissions (
  key text primary key check (key ~ '^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*){1,3}$'),
  description text not null
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_key)
);

create table if not exists public.member_roles (
  organization_id uuid not null,
  member_id uuid not null,
  role_id uuid not null,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (member_id, role_id),
  foreign key (member_id, organization_id) references public.organization_members(id, organization_id) on delete cascade,
  foreign key (role_id, organization_id) references public.roles(id, organization_id) on delete cascade
);
create index if not exists member_roles_org_role_idx on public.member_roles (organization_id, role_id);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PERMISSION_CHANGE', 'EXPORT', 'ADMIN_ACTION', 'MFA_CHANGE')),
  resource_type text not null,
  resource_id text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists audit_logs_org_time_idx on public.audit_logs (organization_id, occurred_at desc);
create index if not exists audit_logs_actor_time_idx on public.audit_logs (actor_user_id, occurred_at desc);

insert into public.permissions (key, description) values
  ('organization.read', 'View organization settings'),
  ('organization.update', 'Update organization settings'),
  ('members.read', 'View organization members'),
  ('members.invite', 'Invite organization members'),
  ('roles.manage', 'Manage member roles and permissions'),
  ('audit.read', 'View organization audit logs'),
  ('security.manage', 'Manage security settings')
on conflict (key) do nothing;

create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function public.has_org_permission(p_organization_id uuid, p_permission_key text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
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

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.write_audit_log()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  row_data jsonb;
  org_id uuid;
  item_id text;
  event_action text;
  changed_keys jsonb := '[]'::jsonb;
begin
  if (tg_op = 'DELETE') then row_data := to_jsonb(old); else row_data := to_jsonb(new); end if;
  org_id := (row_data ->> 'organization_id')::uuid;
  if org_id is null and tg_table_name = 'organizations' then org_id := (row_data ->> 'id')::uuid; end if;
  if org_id is null then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  item_id := coalesce(row_data ->> 'id', row_data ->> 'member_id');
  event_action := tg_op;
  if tg_op = 'INSERT' then
    if tg_table_name = 'member_roles' then event_action := 'PERMISSION_CHANGE'; else event_action := 'CREATE'; end if;
  end if;
  if tg_op = 'UPDATE' then
    select coalesce(jsonb_agg(key), '[]'::jsonb) into changed_keys
    from jsonb_object_keys(to_jsonb(new)) as keys(key)
    where key in ('name', 'slug', 'country_code', 'locale', 'timezone', 'currency', 'status')
      and (to_jsonb(new) -> key) is distinct from (to_jsonb(old) -> key);
    if tg_table_name in ('organization_members', 'member_roles') then event_action := 'PERMISSION_CHANGE'; else event_action := 'UPDATE'; end if;
  end if;
  if tg_op = 'DELETE' then
    if tg_table_name = 'member_roles' then event_action := 'PERMISSION_CHANGE'; else event_action := 'DELETE'; end if;
  end if;
  insert into public.audit_logs (organization_id, actor_user_id, action, resource_type, resource_id, metadata)
  values (
    org_id,
    (select auth.uid()),
    event_action,
    tg_table_name,
    item_id,
    jsonb_build_object('changed_fields', changed_keys)
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger user_profiles_touch_updated_at before update on public.user_profiles
for each row execute function public.touch_updated_at();
create trigger organizations_touch_updated_at before update on public.organizations
for each row execute function public.touch_updated_at();
create trigger organizations_audit after insert or update or delete on public.organizations
for each row execute function public.write_audit_log();
create trigger organization_members_audit after insert or update or delete on public.organization_members
for each row execute function public.write_audit_log();
create trigger member_roles_audit after insert or update or delete on public.member_roles
for each row execute function public.write_audit_log();

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.create_organization(
  p_name text,
  p_slug text,
  p_country text default 'BR',
  p_locale text default 'pt-BR',
  p_timezone text default 'America/Sao_Paulo',
  p_currency text default 'BRL'
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
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

alter table public.user_profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.member_roles enable row level security;
alter table public.audit_logs enable row level security;

create policy user_profiles_select_self on public.user_profiles for select to authenticated
using (user_id = (select auth.uid()));
create policy user_profiles_select_colleagues on public.user_profiles for select to authenticated
using (exists (
  select 1 from public.organization_members own_member
  join public.organization_members peer_member on peer_member.organization_id = own_member.organization_id
  where own_member.user_id = (select auth.uid()) and own_member.status = 'active'
    and peer_member.user_id = user_profiles.user_id and peer_member.status = 'active'
));
create policy user_profiles_update_self on public.user_profiles for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy organizations_select_member on public.organizations for select to authenticated
using (public.is_org_member(id));
create policy organizations_update_authorized on public.organizations for update to authenticated
using (public.has_org_permission(id, 'organization.update'))
with check (public.has_org_permission(id, 'organization.update'));

create policy organization_members_select_member on public.organization_members for select to authenticated
using (public.is_org_member(organization_id));
create policy roles_select_member on public.roles for select to authenticated
using (public.is_org_member(organization_id));
create policy permissions_select_member on public.permissions for select to authenticated
using (exists (select 1 from public.organization_members m where m.user_id = (select auth.uid()) and m.status = 'active'));
create policy role_permissions_select_member on public.role_permissions for select to authenticated
using (exists (select 1 from public.roles r where r.id = role_id and public.is_org_member(r.organization_id)));
create policy member_roles_select_member on public.member_roles for select to authenticated
using (public.is_org_member(organization_id));
create policy audit_logs_select_authorized on public.audit_logs for select to authenticated
using (public.has_org_permission(organization_id, 'audit.read'));

-- Explicit grants complement RLS; signed-out clients receive no access.
revoke all on table public.user_profiles, public.organizations, public.organization_members, public.roles,
  public.permissions, public.role_permissions, public.member_roles, public.audit_logs from anon, authenticated;
grant select on table public.user_profiles, public.organizations to authenticated;
grant update (display_name, locale) on table public.user_profiles to authenticated;
grant update (name, slug, country_code, locale, timezone, currency) on table public.organizations to authenticated;
grant select on table public.organization_members, public.roles, public.permissions,
  public.role_permissions, public.member_roles, public.audit_logs to authenticated;

revoke all on function public.is_org_member(uuid) from public, anon;
revoke all on function public.has_org_permission(uuid, text) from public, anon;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_permission(uuid, text) to authenticated;
revoke all on function public.create_organization(text, text, text, text, text, text) from public, anon;
grant execute on function public.create_organization(text, text, text, text, text, text) to authenticated;
revoke all on function public.write_audit_log() from public, anon, authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
