# Database

## Migration

`supabase/migrations/20260928120000_foundation.sql` cria o schema inicial em `public`, sem tenants ou dados de demonstração. Ela foi aplicada, após aprovação do usuário, ao projeto Supabase indicado em 2026-09-28 por meio do SQL Editor do dashboard.

Verificação read-only após a execução: **8/8 tabelas**, **8/8 com RLS**, **11 políticas**, **6 triggers**, **6 funções** e **7 permissões-base**. Não foram inseridos usuários ou tenants de demonstração.

### Histórico do Supabase CLI

A migration foi aplicada pelo dashboard, não pelo CLI. Portanto, confirme o histórico antes de rodar `supabase db push`. Depois de vincular o projeto correto, marque a versão como aplicada usando o fluxo suportado pelo CLI, por exemplo `supabase migration repair --status applied 20260928120000`, e confira `supabase migration list`. Não reaplique o SQL integral como forma de registrar o histórico: as criações de policies e triggers não são idempotentes.

## Entidades

- `user_profiles`: atributos mínimos do usuário, sem armazenar e-mail duplicado.
- `organizations`: tenant e preferências de país, locale, timezone e moeda.
- `organization_members`: vínculo user/tenant e estado.
- `roles`, `permissions`, `role_permissions`, `member_roles`: RBAC por organização.
- `audit_logs`: eventos minimizados por tenant.

Todas as relações usam UUID/FK; memberships e roles têm constraints compostas para impedir associação cross-tenant. Índices apoiam consultas por usuário, organização e data de auditoria.

## Authorization

RLS e grants explícitos estão ativos nas oito tabelas. Policies de leitura verificam `is_org_member`; configurações exigem `has_org_permission(..., 'organization.update')`; auditoria exige `audit.read`. `create_organization` é o caminho de criação inicial, revoga EXECUTE de `public`/`anon` e obtém o usuário de `auth.uid()`. As verificações tenant-scoped e o RPC de criação exigem MFA AAL2.

## Validation

- Unit tests: `pnpm test`.
- Checagem estrutural no Supabase: concluída após a aplicação (contagens descritas acima).
- Cross-tenant pgTAP: `supabase/tests/tenant_isolation.test.sql`; ainda não executado contra Supabase/Postgres local.
- Em ambiente local: `supabase start`, `supabase db reset`, `supabase test db`.
