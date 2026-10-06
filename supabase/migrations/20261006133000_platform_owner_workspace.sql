-- Provision the owner's own customer workspace so the same login can use both surfaces.
-- The control plane remains at /platform-admin; /app is the owner tenant workspace.
do $$
declare
  actor_id uuid;
  org_id uuid;
  member_uuid uuid;
  owner_role_id uuid;
begin
  select id into actor_id from auth.users where lower(email) = 'zildahenderson9@gmail.com' limit 1;
  if actor_id is null then
    raise exception 'Platform owner account not found';
  end if;

  select id into org_id from public.organizations where slug = 'henderson-cloud-owner' limit 1;
  if org_id is null then
    insert into public.organizations (name, slug, country_code, locale, timezone, currency, created_by)
    values ('Henderson Cloud', 'henderson-cloud-owner', 'BR', 'pt-BR', 'America/Sao_Paulo', 'BRL', actor_id)
    returning id into org_id;
  end if;

  insert into public.roles (organization_id, code, name, is_system)
  values
    (org_id, 'owner', 'Proprietário', true),
    (org_id, 'admin', 'Administrador', true),
    (org_id, 'manager', 'Gerente', true),
    (org_id, 'employee', 'Colaborador', true),
    (org_id, 'viewer', 'Leitor', true)
  on conflict (organization_id, code) do nothing;

  insert into public.role_permissions (role_id, permission_key)
  select r.id, p.key
    from public.roles r cross join public.permissions p
   where r.organization_id = org_id
     and r.code = 'owner'
  on conflict do nothing;

  select id into member_uuid from public.organization_members where organization_id = org_id and user_id = actor_id limit 1;
  if member_uuid is null then
    insert into public.organization_members (organization_id, user_id, status)
    values (org_id, actor_id, 'active')
    returning id into member_uuid;
  else
    update public.organization_members set status = 'active' where id = member_uuid;
  end if;

  select id into owner_role_id from public.roles where organization_id = org_id and code = 'owner' limit 1;
  insert into public.member_roles (organization_id, member_id, role_id, assigned_by)
  values (org_id, member_uuid, owner_role_id, actor_id)
  on conflict do nothing;

  insert into public.platform_owners (user_id, email, status, last_seen_at)
  values (actor_id, 'zildahenderson9@gmail.com', 'active', now())
  on conflict (user_id) do update set status = 'active', last_seen_at = now();
end;
$$;
