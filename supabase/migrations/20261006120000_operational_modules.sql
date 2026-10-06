-- Henderson Cloud operational modules: finance, projects and documents.
-- Every table is tenant-scoped, permissioned and covered by the existing audit trigger.

create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  type text not null check (type in ('income', 'expense')),
  description text not null check (char_length(trim(description)) between 2 and 180),
  category text check (category is null or char_length(trim(category)) <= 80),
  amount numeric(14,2) not null check (amount > 0),
  due_date date,
  status text not null default 'pending' check (status in ('pending', 'paid', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists finance_transactions_org_date_idx on public.finance_transactions (organization_id, due_date desc, created_at desc);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete set null,
  name text not null check (char_length(trim(name)) between 2 and 160),
  description text check (description is null or char_length(description) <= 5000),
  status text not null default 'planning' check (status in ('planning', 'active', 'on_hold', 'done')),
  start_date date,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_org_status_idx on public.projects (organization_id, status, created_at desc);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  name text not null check (char_length(trim(name)) between 2 and 180),
  description text check (description is null or char_length(description) <= 5000),
  content text check (content is null or char_length(content) <= 20000),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists documents_org_status_idx on public.documents (organization_id, status, updated_at desc);

insert into public.permissions (key, description) values
  ('finance.transactions.read', 'View financial transactions'),
  ('finance.transactions.create', 'Create financial transactions'),
  ('finance.transactions.update', 'Update financial transactions'),
  ('finance.transactions.delete', 'Delete financial transactions'),
  ('projects.read', 'View projects'),
  ('projects.create', 'Create projects'),
  ('projects.update', 'Update projects'),
  ('projects.delete', 'Delete projects'),
  ('documents.read', 'View documents'),
  ('documents.create', 'Create documents'),
  ('documents.update', 'Update documents'),
  ('documents.delete', 'Delete documents')
on conflict (key) do nothing;

create or replace function public.seed_operational_permissions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_system then
    insert into public.role_permissions (role_id, permission_key)
    select new.id, p.key
      from public.permissions p
     where p.key in (
       'finance.transactions.read', 'finance.transactions.create', 'finance.transactions.update', 'finance.transactions.delete',
       'projects.read', 'projects.create', 'projects.update', 'projects.delete',
       'documents.read', 'documents.create', 'documents.update', 'documents.delete'
     )
       and (
         new.code in ('owner', 'admin')
         or (new.code = 'manager' and p.key not like '%.delete')
         or (new.code = 'employee' and p.key like '%.read' or new.code = 'employee' and p.key like '%.create')
         or (new.code = 'viewer' and p.key like '%.read')
       )
    on conflict do nothing;
  end if;
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'roles_seed_operational_permissions') then
    create trigger roles_seed_operational_permissions
      after insert on public.roles
      for each row execute function public.seed_operational_permissions();
  end if;
end;
$$;

insert into public.role_permissions (role_id, permission_key)
select r.id, p.key
  from public.roles r
 cross join public.permissions p
 where p.key in (
   'finance.transactions.read', 'finance.transactions.create', 'finance.transactions.update', 'finance.transactions.delete',
   'projects.read', 'projects.create', 'projects.update', 'projects.delete',
   'documents.read', 'documents.create', 'documents.update', 'documents.delete'
 )
   and (
     r.code in ('owner', 'admin')
     or (r.code = 'manager' and p.key not like '%.delete')
     or (r.code = 'employee' and (p.key like '%.read' or p.key like '%.create'))
     or (r.code = 'viewer' and p.key like '%.read')
   )
on conflict do nothing;

create or replace function public.operational_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'finance_transactions_touch_updated_at') then
    create trigger finance_transactions_touch_updated_at before update on public.finance_transactions for each row execute function public.operational_touch_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'projects_touch_updated_at') then
    create trigger projects_touch_updated_at before update on public.projects for each row execute function public.operational_touch_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'documents_touch_updated_at') then
    create trigger documents_touch_updated_at before update on public.documents for each row execute function public.operational_touch_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'finance_transactions_audit') then
    create trigger finance_transactions_audit after insert or update or delete on public.finance_transactions for each row execute function public.write_audit_log();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'projects_audit') then
    create trigger projects_audit after insert or update or delete on public.projects for each row execute function public.write_audit_log();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'documents_audit') then
    create trigger documents_audit after insert or update or delete on public.documents for each row execute function public.write_audit_log();
  end if;
end;
$$;

alter table public.finance_transactions enable row level security;
alter table public.projects enable row level security;
alter table public.documents enable row level security;

create policy finance_transactions_select_authorized on public.finance_transactions for select to authenticated using (public.has_org_permission(organization_id, 'finance.transactions.read'));
create policy finance_transactions_insert_authorized on public.finance_transactions for insert to authenticated with check (public.has_org_permission(organization_id, 'finance.transactions.create'));
create policy finance_transactions_update_authorized on public.finance_transactions for update to authenticated using (public.has_org_permission(organization_id, 'finance.transactions.update')) with check (public.has_org_permission(organization_id, 'finance.transactions.update'));
create policy finance_transactions_delete_authorized on public.finance_transactions for delete to authenticated using (public.has_org_permission(organization_id, 'finance.transactions.delete'));

create policy projects_select_authorized on public.projects for select to authenticated using (public.has_org_permission(organization_id, 'projects.read'));
create policy projects_insert_authorized on public.projects for insert to authenticated with check (public.has_org_permission(organization_id, 'projects.create'));
create policy projects_update_authorized on public.projects for update to authenticated using (public.has_org_permission(organization_id, 'projects.update')) with check (public.has_org_permission(organization_id, 'projects.update'));
create policy projects_delete_authorized on public.projects for delete to authenticated using (public.has_org_permission(organization_id, 'projects.delete'));

create policy documents_select_authorized on public.documents for select to authenticated using (public.has_org_permission(organization_id, 'documents.read'));
create policy documents_insert_authorized on public.documents for insert to authenticated with check (public.has_org_permission(organization_id, 'documents.create'));
create policy documents_update_authorized on public.documents for update to authenticated using (public.has_org_permission(organization_id, 'documents.update')) with check (public.has_org_permission(organization_id, 'documents.update'));
create policy documents_delete_authorized on public.documents for delete to authenticated using (public.has_org_permission(organization_id, 'documents.delete'));

revoke all on table public.finance_transactions, public.projects, public.documents from anon, authenticated;
grant select on public.finance_transactions, public.projects, public.documents to authenticated;
grant insert (organization_id, created_by, type, description, category, amount, due_date, status) on public.finance_transactions to authenticated;
grant update (type, description, category, amount, due_date, status) on public.finance_transactions to authenticated;
grant delete on public.finance_transactions to authenticated;
grant insert (organization_id, created_by, owner_user_id, name, description, status, start_date, due_date) on public.projects to authenticated;
grant update (owner_user_id, name, description, status, start_date, due_date) on public.projects to authenticated;
grant delete on public.projects to authenticated;
grant insert (organization_id, created_by, name, description, content, status) on public.documents to authenticated;
grant update (name, description, content, status) on public.documents to authenticated;
grant delete on public.documents to authenticated;

grant execute on function public.seed_operational_permissions() to authenticated;
revoke all on function public.operational_touch_updated_at() from public, anon, authenticated;
