# Deployment

## Estado atual — 29/09/2026

A migration `20260928120000_foundation.sql` foi aplicada e verificada no projeto Supabase indicado pelo usuário. O projeto `oaas-platform` existe na Vercel. Nenhum deployment foi criado: a API de upload não recebeu dois blocos da fonte e o fallback inline foi rejeitado pela validação do conector antes de executar a chamada. Uma consulta posterior de escopo retornou 403; portanto, não afirmamos que as variáveis do projeto foram verificadas. A prévia temporária do Sandbox responde em `/login`, mas não é o deployment Vercel nem produção. A configuração de Auth (redirect URLs, confirmação de e-mail, SMTP e MFA) ainda precisa ser validada.

## Supabase

1. Use o projeto indicado pelo usuário; confirme região, política de senha do banco e opções de backup antes de produção.
2. Configure Authentication: confirmação de e-mail, redirect URLs para local e domínio da aplicação, SMTP de produção e MFA TOTP.
3. A migration já foi aplicada manualmente pelo dashboard. Antes de usar o CLI, vincule o projeto e reconcilie o histórico conforme `DATABASE.md` (`supabase migration repair --status applied 20260928120000` e `supabase migration list`). Não reaplique o SQL integral.
4. Execute `supabase test db` contra um ambiente local compatível e confirme que os testes cross-tenant passam.
5. Configure monitoramento, backups e restore testado antes de armazenar dados reais.

## Vercel

1. Revalidar o escopo de acesso ao projeto `oaas-platform` e os nomes/ambientes das variáveis Supabase; não descriptografar valores ao inspecionar.
2. Completar o envio da fonte pelo Vercel CLI ou por um repositório Git autorizado e criar uma prévia. Até então, não há deployment Vercel.
3. Confirmar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` nos ambientes Development, Preview e Production, com valores corretos por ambiente.
4. Não configure `SUPABASE_SERVICE_ROLE_KEY` nesta aplicação; não é necessária para os recursos atuais. Nunca prefixe credenciais privilegiadas com `NEXT_PUBLIC_`.
5. Teste cadastro/confirmação de e-mail, onboarding MFA e isolamento entre dois tenants antes de qualquer promoção para Production.
6. Configure domínio, CSP, rate limits, alertas de erros e estratégia de rollback.
