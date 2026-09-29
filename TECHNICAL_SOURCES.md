# Fontes técnicas verificadas

- **Supabase SSR client (guia oficial):** https://supabase.com/docs/guides/auth/server-side/creating-a-client — `@supabase/ssr`, cookies para SSR, cliente browser/server separado, `proxy.ts` no Next.js 16 e validação de identidade com `auth.getClaims()`; não confiar em `getSession()` no servidor para autorização.
- **Supabase Row Level Security (guia oficial):** https://supabase.com/docs/guides/database/postgres/row-level-security — RLS e grants são camadas independentes; habilitar RLS e restringir grants por tabela; testar allow/deny por operação e papel.
- **Vercel Next.js (guia oficial):** https://vercel.com/docs/frameworks/full-stack/nextjs — Next.js recebe suporte de deploy gerenciado; SSR em Functions e integração do pipeline do framework.
- **Vercel environment variables:** https://vercel.com/docs/environment-variables — segredos/valores por ambiente devem ser configurados fora do código-fonte.

Essas fontes fundamentam o desenho inicial; a implantação, o comportamento do projeto real e as políticas precisam ser testados após conectar as contas escolhidas.
