import { redirect } from "next/navigation";
import { AuthForm } from "./auth-form";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getAuthenticatedEntryPath } from "@/lib/entry-routing";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();
  if (configured && !params.error) {
    const entryPath = await getAuthenticatedEntryPath();
    if (entryPath) redirect(entryPath);
  }

  return (
    <main className="auth-shell">
      <aside className="auth-aside">
        <div className="brand-lockup"><span className="brand-mark" style={{ background: "#d7eee5", color: "#153a36" }}>HC</span><span>Henderson Cloud</span></div>
        <div className="relative z-10 max-w-lg pb-10">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[.2em] text-emerald-100/65">Henderson Cloud</p>
          <h1 className="text-[clamp(38px,5vw,58px)] font-semibold leading-[1.04] tracking-[-.055em]">Sua operação,<br />em um só lugar.</h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-emerald-50/75">Uma fundação segura para conectar pessoas, processos e decisões da sua empresa — construída para crescer junto com o negócio.</p>
          <div className="mt-10 flex flex-wrap gap-2 text-[11px] text-emerald-50/75">
            <span className="rounded-full border border-white/15 px-3 py-1.5">Multi-organização</span><span className="rounded-full border border-white/15 px-3 py-1.5">Acesso por função</span><span className="rounded-full border border-white/15 px-3 py-1.5">Auditoria</span>
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-between text-[10px] text-emerald-50/50"><span>Henderson Cloud · Fase 1</span><span>© Henderson Cloud</span></div>
      </aside>
      <section className="auth-main">
        <div className="auth-card">
          <div className="brand-lockup md:hidden"><span className="brand-mark">HC</span><span>Henderson Cloud</span></div>
          <p className="eyebrow mt-0 md:mt-0">Acesso seguro</p>
          <h2 className="mt-2 text-[25px] font-semibold tracking-[-.045em] text-slate-900">Bem-vindo de volta</h2>
          <p className="mt-2 text-[13px] leading-6 text-slate-500">Entre com seu e-mail corporativo para continuar.</p>
          {!configured && <div className="setup-banner mt-6"><span className="mt-0.5">!</span><p><strong>Conexão Supabase pendente.</strong> A autenticação e o banco só serão ativados após configurar a URL e a chave pública do projeto em <code>.env.local</code> ou nos ambientes da Vercel.</p></div>}
          <AuthForm configured={configured} initialError={params.error === "confirmation_expired" || params.error === "link" ? "Este link de confirmação expirou ou já foi utilizado. Crie a conta novamente ou solicite um novo e-mail." : params.error === "platform_admin" ? "Esta área é exclusiva da proprietária da Henderson Cloud e exige a conta autorizada." : ""} />
          <p className="mt-7 border-t border-slate-100 pt-5 text-[10px] leading-5 text-slate-400">Ao continuar, você acessará somente os espaços e dados autorizados para sua conta.</p>
        </div>
      </section>
    </main>
  );
}
