# Threat model — Fase 1

## Assets

Contas e sessões; perfis mínimos; metadados de organização; papéis/permissões; logs de auditoria; secrets de Vercel/Supabase que serão inseridos externamente.

## Actors and trust boundaries

Usuário autenticado de cada tenant, visitante não autenticado, operador da plataforma, mantenedor do código e provedores Vercel/Supabase. O browser é não confiável; Next.js server e PostgreSQL são limites de validação, com RLS como enforcement final.

## Principal threats and controls

- **Cross-tenant IDOR**: tenant id falsificado em URL/form; mitigado ao derivar membership de `auth.uid()`, policies RLS, FK compostas e teste com A/B.
- **Escalada de privilégio**: papel modificado via request; grants de escrita ausentes em memberships/roles, role creation restrita ao RPC, policies e permission RPC.
- **Sequestro de conta/brute force**: senha roubada ou tentativa automatizada; Supabase Auth, confirmação e MFA TOTP disponíveis; rate limits/SMTP e MFA obrigatório ainda precisam de configuração no projeto real.
- **Roubo de sessão**: token adulterado/cache compartilhado; SSR cookies, `getClaims()`, `getUser()` e sem cache de conteúdo autenticado.
- **Vazamento de segredos**: chave privilegiada no cliente/log/repositório; código aceita apenas publishable key no browser; CI e env docs proíbem service-role no bundle.
- **Falsificação de auditoria**: cliente escreve evento arbitrário; escrita direta revogada, gatilhos server-side e seleção condicionada a `audit.read`.
- **Dependência comprometida**: supply-chain attack; lockfile, audit de dependências no CI; aprovação de atualização e observabilidade ainda precisam de rotina operacional.

## Residual risk

Migration e políticas ainda precisam ser executadas/testadas em projeto Supabase real e revisadas por pessoa responsável. MFA enforcement, SMTP, backups testados, monitoramento, response plan e pentest permanecem pendentes. Nenhuma garantia de conformidade jurídica ou segurança absoluta é declarada.
