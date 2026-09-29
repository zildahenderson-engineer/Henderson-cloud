# Contributing

## Change workflow

1. Leia a arquitetura e a política de segurança antes de alterar uma fronteira de tenant.
2. Faça uma migration nova e reversível sempre que possível; não edite migrations já aplicadas em ambientes compartilhados.
3. Para cada recurso tenant-scoped, acrescente `organization_id`, FK/índice, RLS, grants e testes positivos/negativos entre dois tenants.
4. Valide entradas no servidor, derive o tenant da sessão, confira autorização no backend e mantenha erros sem detalhes internos.
5. Implemente loading/empty/error/success na interface e logging/auditoria sem conteúdo sensível.
6. Rode `pnpm lint`, `pnpm typecheck`, `pnpm test`, análise de dependências e `pnpm build`.

## Definition of done

Uma feature não é concluída só por renderizar uma tela. Ela precisa de regra de negócio, persistência, autorização, validação, isolamento, tratamento de erro, testes e documentação. Não introduza dados demo em produção.
