# Henderson Cloud — operação empresarial

Aplicação multi-tenant em **Next.js 16 + TypeScript**, com **Supabase Auth/Postgres** e deploy em **Vercel**. A plataforma inclui autenticação, onboarding, organizações, RBAC, auditoria, CRM, Financeiro, Projetos, Documentos e control plane da proprietária.

## Estado atual — 29/09/2026

A migration inicial foi aplicada ao projeto Supabase indicado pelo usuário e verificada: 8 tabelas, RLS em todas, 11 políticas, 6 triggers, 6 funções e 7 permissões-base. As migrations do CRM, da control plane Platform Owner e do acesso normal por e-mail e senha também foram aplicadas. Não são criados tenants ou usuários de demonstração automaticamente fora do bootstrap autorizado da proprietária. O código-fonte está publicado no repositório Henderson Cloud e pronto para deployment persistente na Vercel.

## Módulos operacionais disponíveis

- Cadastro, login, logout, confirmação de e-mail e recuperação de senha via Supabase Auth.
- Onboarding que cria organização, papéis iniciais e primeiro proprietário em uma função transacional do banco.
- Multi-tenancy com RLS para as tabelas-base e helpers de autorização no PostgreSQL.
- Papéis iniciais: Proprietário, Administrador, Gerente, Colaborador e Leitor; permissões no formato `module.resource.action`; Acesso por e-mail confirmado e senha; MFA opcional na área Segurança.
- Atualização autorizada da organização, visualização de equipe, enrollment TOTP e trilha de auditoria para mudanças organizacionais e de papéis.
- Interface responsiva, estados vazios/erro/sucesso, configuração regional e CI inicial.
- CRM inicial de leads: listagem tenant-scoped, criação validada no servidor, remoção autorizada, auditoria e permissões granulares.
- Financeiro: receitas, despesas, categorias, vencimentos, status, saldo operacional e auditoria.
- Projetos: frentes de trabalho, descrição, status, datas e remoção autorizada.
- Documentos: biblioteca tenant-scoped para políticas, procedimentos e registros com conteúdo e status.
- Área privada `/platform-admin` para a proprietária do software: KPIs globais, tenants, usuários, leads e auditoria em visão somente leitura; bootstrap restrito ao e-mail proprietário; MFA opcional.

## Próximas evoluções de produto

- Reconciliar o histórico da migration no Supabase CLI antes de executar futuras migrations via `supabase db push` (as primeiras foram aplicadas pelo SQL Editor do dashboard; veja `DATABASE.md`).
- Validar SMTP e templates de confirmação de e-mail no projeto Supabase antes do lançamento comercial.
- Executar os testes pgTAP de isolamento entre tenants contra uma instância Supabase/Postgres local.
- O gateway de pagamentos será integrado por último com o Asaas, ligado à conta empresarial/CNPJ da proprietária. Até essa configuração, nenhuma cobrança real é simulada ou liberada.
- Automações, AI Hub, convites por e-mail e upload de arquivos permanecem como evoluções seguintes, sem aparecerem como módulos operacionais falsamente prontos.

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
