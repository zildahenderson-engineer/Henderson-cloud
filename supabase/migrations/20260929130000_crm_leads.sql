-- CRM leads / phase 2 slice
create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  name text not null check (char_length(trim(name)) between 2 and 160),
  email text check (email is null or char_length(trim(email)) <= 320),
  company text check (company is null or char_length(trim(company)) <= 160),
  phone text check (phone is null or char_length(trim(phone)) <= 40),
  status text not null default 'new' check (status in ('new', 'qualified', 'proposal', 'won', 'lost')),
  source text check (source is null or char_length(trim(source)) <= 80),
  notes text check (notes is null or char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists crm_leads_org_status_idx on public.crm_leads (organization_id, status, created_at desc);
create index if not exists crm_leads_org_owner_idx on public.crm_leads (organization_id, owner_user_id);

insert into public.permissions (key, description) values
  ('crm.leads.read', 'View CRM leads'),
  ('crm.leads.create', 'Create CRM leads'),
  ('crm.leads.update', 'Update CRM leads'),
  ('crm.leads.delete', 'Delete CRM leads')
on conflict (key) do nothing;

-- New organizations inherit CRM access through create_organization's role mapping.
-- Existing organizations receive the least-privilege baseline here.
insert into public.role_permissions (role_id, permission_key)
select r.id, p.key
from public.roles r
cross join public.permissions p
where p.key like 'crm.leads.%'
  and ((r.code in ('owner', 'admin')) or (r.code = 'manager' and p.key <> 'crm.leads.delete') or (r.code in ('employee', 'viewer') and p.key = 'crm.leads.read'))
on conflict do nothing;

create or replace function public.seed_crm_role_permissions()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.is_system then
    insert into public.role_permissions (role_id, permission_key)
    select new.id, p.key
    from public.permissions p
    where p.key like 'crm.leads.%'
      and ((new.code in ('owner', 'admin')) or (new.code = 'manager' and p.key <> 'crm.leads.delete') or (new.code in ('employee', 'viewer') and p.key = 'crm.leads.read'))
    on conflict do nothing;
  end if;
  return new;
end;
$$;
create trigger roles_seed_crm_permissions after insert on public.roles
for each row execute function public.seed_crm_role_permissions();

create or replace function public.crm_leads_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger crm_leads_touch_updated_at before update on public.crm_leads
for each row execute function public.crm_leads_touch_updated_at();
create trigger crm_leads_audit after insert or update or delete on public.crm_leads
for each row execute function public.write_audit_log();

alter table public.crm_leads enable row level security;
create policy crm_leads_select_authorized on public.crm_leads for select to authenticated
using (public.has_org_permission(organization_id, 'crm.leads.read'));
create policy crm_leads_insert_authorized on public.crm_leads for insert to authenticated
with check (public.has_org_permission(organization_id, 'crm.leads.create'));
create policy crm_leads_update_authorized on public.crm_leads for update to authenticated
using (public.has_org_permission(organization_id, 'crm.leads.update'))
with check (public.has_org_permission(organization_id, 'crm.leads.update'));
create policy crm_leads_delete_authorized on public.crm_leads for delete to authenticated
using (public.has_org_permission(organization_id, 'crm.leads.delete'));

revoke all on table public.crm_leads from anon, authenticated;
grant select on public.crm_leads to authenticated;
grant insert (organization_id, owner_user_id, name, email, company, phone, status, source, notes) on public.crm_leads to authenticated;
grant update (owner_user_id, name, email, company, phone, status, source, notes) on public.crm_leads to authenticated;
grant delete on public.crm_leads to authenticated;
revoke all on function public.crm_leads_touch_updated_at() from public, anon, authenticated;
revoke all on function public.seed_crm_role_permissions() from public, anon, authenticated;
