# API / server actions

A Fase 1 não publica uma API REST genérica nem chaves de integração para clientes externos. As superfícies atuais são Server Actions e o callback OAuth do Supabase.

- `createWorkspace`: schema Zod no servidor, valida sessão e chama `public.create_organization`; tenant e owner são derivados de `auth.uid()`.
- `updateOrganization`: valida todos os campos, chama `has_org_permission` no servidor, faz update restrito e depende de RLS/grants.
- `signOut`: encerra sessão com Supabase Auth.
- `/auth/callback`: troca código de confirmação/reset por sessão e valida destino relativo ao próprio site.

Queries de leitura também executam com o usuário autenticado e publishable key; RLS aplica autorização no banco. Erros são tratados com mensagens seguras. Futuras APIs devem adicionar versionamento, rate limiting, request IDs, paginação, idempotência e OpenAPI antes de uso por terceiros.
