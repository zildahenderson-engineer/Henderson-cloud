# Environment

| Variable | Exposição | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | URL do projeto Supabase; não é credencial de admin. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Pública | Chave publishable/anon do cliente; RLS precisa estar ativa em todo dado exposto. |

Use `.env.example` como referência e crie `.env.local` localmente. `.env.local` não deve ser commitado. Em Vercel, cadastre variáveis no painel de ambiente e separe Preview/Production.

Não adicionar service-role key, senha de banco, API key de integração, SMTP secret ou token a arquivos versionados, `NEXT_PUBLIC_*`, logs, screenshots ou mensagens. Rotacione qualquer valor exposto. O projeto não precisa de chave privilegiada para a Fase 1.
