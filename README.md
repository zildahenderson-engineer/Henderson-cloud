# Henderson Cloud — fundação empresarial

Aplicação multi-tenant em **Next.js 16 + TypeScript**, com **Supabase Auth/Postgres** e deploy preparado para **Vercel**. Esta entrega implementa a fundação da Fase 1 do prompt mestre; não representa o produto final nem inclui dados fictícios persistentes.

## Estado atual — 29/09/2026

A migration inicial foi aplicada ao projeto Supabase indicado pelo usuário e verificada: 8 tabelas, RLS em todas, 11 políticas, 6 triggers, 6 funções e 7 permissões-base. A migration do CRM e a control plane do Platform Owner também foram aplicadas. Não foram criados tenants ou usuários de demonstração. O projeto `oaas-platform` existe na Vercel, mas ainda não há deployment persistente; a prévia do Sandbox é temporária e pode dormir quando a sessão fica inativa.

## Incluído nesta fase

- Cadastro, login, logout, confirmação de e-mail e recuperação de senha via Supabase Auth.
- Onboarding que cria organização, papéis iniciais e primeiro proprietário em uma função transacional do banco.
- Multi-tenancy com RLS para as tabelas-base e helpers de autorização no PostgreSQL.
- Papéis iniciais: Proprietário, Administrador, Gerente, Colaborador e Leitor; permissões no formato `module.resource.action`; Acesso por e-mail confirmado e senha; MFA opcional na área Segurança.
- Atualização autorizada da organização, visualização de equipe, enrollment TOTP e trilha de auditoria para mudanças organizacionais e de papéis.
- Interface responsiva, estados vazios/erro/sucesso, configuração regional e CI inicial.
- CRM inicial de leads: listagem tenant-scoped, criação validada no servidor, remoção autorizada, auditoria e permissões granulares.
- Área privada `/platform-admin` para a proprietária do software: KPIs globais, tenants, usuários, leads e auditoria em visão somente leitura; bootstrap restrito ao e-mail proprietário; MFA opcional.

## O que ainda está pendente

- Reconciliar o histórico da migration no Supabase CLI antes de executar futuras migrations via `supabase db push` (ela foi aplicada pelo SQL Editor do dashboard; veja `DATABASE.md`).
- Validar confirmação de e-mail, URLs de redirect, SMTP e enrollment/verificação TOTP no projeto Supabase.
- Revalidar o escopo Vercel e as variáveis públicas do projeto; completar o envio da fonte via CLI ou repositório Git e publicar uma prévia.
- Executar os testes pgTAP de isolamento entre tenants contra uma instância Supabase/Postgres local.
- Cobrança, financeiro, integrações e automações ficam para fases posteriores. O CRM continua com pipeline, contatos, atividades e vendas em evoluções seguintes.

## Desenvolvimento local

```bash
pnpm install
cp .env.example .env.local
# Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
pnpm dev
```

Sem as duas variáveis de ambiente do Supabase, a autenticação mostra instruções de configuração e não inventa uma sessão. Os arquivos de exemplo não contêm segredos.

## Banco e qualidade

A migration já foi aplicada ao projeto Supabase indicado pelo usuário. Antes de executar `supabase db push`, consulte as instruções de histórico em `DATABASE.md`. Os testes cross-tenant estão em `supabase/tests/tenant_isolation.test.sql` (requer Supabase CLI/Postgres local).

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Consulte `ARCHITECTURE.md`, `API.md`, `DEPLOYMENT.md`, `ENVIRONMENT.md`, `THREAT_MODEL.md`, `DISASTER_RECOVERY.md` e `TECHNICAL_SOURCES.md` para decisões e operação.
