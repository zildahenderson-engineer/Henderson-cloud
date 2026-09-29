begin;
select plan(5);

-- Dedicated local Supabase test fixtures only; rolled back at the end.
insert into auth.users (id, aud, role, email, encrypted_password)
values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'tenant-a@example.test', 'test-hash'),
  ('20000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'tenant-b@example.test', 'test-hash')
on conflict (id) do nothing;
insert into public.organizations (id, name, slug, created_by)
values
  ('a0000000-0000-4000-8000-000000000001', 'Tenant A test', 'tenant-a-test', '10000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000002', 'Tenant B test', 'tenant-b-test', '20000000-0000-4000-8000-000000000002');
insert into public.organization_members (organization_id, user_id)
values
  ('a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2"}', true);
select is(
  (select count(*)::integer from public.organizations),
  1,
  'Tenant A can see exactly its own organization'
);
select is(
  (select count(*)::integer from public.organizations where id = 'b0000000-0000-4000-8000-000000000002'),
  0,
  'Tenant A cannot read Tenant B by known UUID'
);
select is(
  (select count(*)::integer from public.organization_members where organization_id = 'b0000000-0000-4000-8000-000000000002'),
  0,
  'Tenant A cannot list Tenant B members'
);
select ok(
  not has_table_privilege('anon', 'public.organizations', 'select'),
  'Signed-out role has no organization read grant'
);
select ok(
  not has_table_privilege('authenticated', 'public.audit_logs', 'insert,update,delete'),
  'Authenticated users cannot mutate audit records directly'
);

select * from finish();
rollback;
