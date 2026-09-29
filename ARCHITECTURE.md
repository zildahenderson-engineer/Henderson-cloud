# Architecture

## Current phase

Fase 1, com Next.js App Router (server components e server actions), TypeScript, Supabase Auth via `@supabase/ssr` e PostgreSQL. A Vercel hospeda a aplicação; o Supabase é responsável por autenticação e dados. O código segue a configuração do usuário, sem depender do runtime gerenciado de outro host.

## Trust boundaries

1. **Browser**: não contém service-role key; recebe apenas URL e publishable key. Qualquer valor de organização enviado pelo navegador é validado novamente e autorizado no servidor/banco.
2. **Next.js server**: verifica usuário com `auth.getUser()` e renova/verifica JWT via `auth.getClaims()` no `src/proxy.ts`. Server actions validam entradas, obtêm usuário da sessão e retornam erros genéricos.
3. **PostgreSQL/Supabase**: RLS é a barreira final por organização; helpers `SECURITY DEFINER` têm `search_path` vazio e nomes qualificados. Grants e policies são aplicados juntos.
4. **CI/Vercel**: segredos devem ser inseridos em variáveis protegidas de Development/Preview/Production, nunca no bundle ou commit.

## Tenant context

O tenant é derivado da sessão autenticada consultando `organization_members`; o servidor não confia em `tenant_id` de formulário como prova de pertencimento. O onboarding chama `create_organization`, que valida `auth.uid()`, cria organização, cinco papéis, permissões e owner numa única transação.

## Current routes

- `/login`: signup, login, reset de senha.
- `/auth/callback`: exchange de código com allowlist de destinos internos.
- `/onboarding`: criação inicial de organização.
- `/app`: dashboard com contagem e auditoria do banco.
- `/app/organization`, `/app/team`, `/app/security`, `/app/audit`: operações da Fase 1.

## Deferred modules

Billing, admin de plataforma, demais áreas operacionais, automações/jobs, providers, webhooks, search/RAG e integrações fiscais permanecem fora da Fase 1. Novos módulos devem incluir migration, autorização backend/RLS, estados de UI, auditoria aplicável e testes cross-tenant antes de aparecer como operacionais.
