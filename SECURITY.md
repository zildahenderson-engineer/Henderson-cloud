# Security

## Implemented controls

- Supabase Auth mantém hashes e tokens; o app não persiste senhas.
- SSR usa cookies do SDK oficial e `getClaims()` para validar claims; server actions confirmam usuário com `getUser()`. As rotas privadas exigem sessão AAL2 no proxy e os helpers tenant-scoped repetem o requisito no PostgreSQL; enrollment/verificação TOTP é obrigatório antes do onboarding e do uso do tenant.
- Publishable key pode estar no browser; service-role key é proibida no cliente e não é necessária para as operações incluídas.
- Entradas de onboarding e settings são validadas com Zod no servidor; mutations recebem identidade da sessão e autorização do PostgreSQL.
- RLS habilitada nas tabelas de aplicação; organização/membros/auditoria não têm acesso `anon`; regras combinam grants e policies.
- Operações de tenant são filtradas no servidor e novamente pelas policies. Funções privileged usam `SECURITY DEFINER`, `search_path = ''` e nomes qualificados.
- Audit log não tem grants de escrita direta para `authenticated`; gatilhos registram mudanças minimizadas.
- Callback aceita somente paths internos; erros não incluem stack traces nem segredos.
- Validação de isolamento e dependências entra no CI.

## Before production

1. Configurar confirmação de e-mail, MFA TOTP e domínio SMTP no Supabase Auth; a aplicação já exige AAL2 antes de liberar onboarding/rotas privadas e também nas policies/helpers.
2. Configurar rate limits e proteção contra abuso no Auth, domínio SMTP de produção, URLs de redirect e allowlist de domínios.
3. Revisar políticas RLS no projeto real, testar a migration contra dois tenants e executar `supabase test db`.
4. Configurar proteção de branches, revisão de dependências, logs/alertas e rotação/revogação de credenciais.
5. Definir retenção, backup e restore testado, região e base legal/privacidade para os mercados operados.
6. Realizar revisão de segurança independente antes de armazenar dados financeiros, fiscais ou pessoais sensíveis.

O projeto não declara segurança absoluta nem certificação OWASP/LGPD/GDPR; controles técnicos não substituem validação jurídica, operacional ou teste de invasão.
