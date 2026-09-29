import { ShieldCheck, LockKeyhole, Fingerprint } from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { MfaSettings } from "./mfa-settings";

export default async function SecurityPage() {
  const workspace = await requireWorkspace();
  return <>
    <div className="page-heading"><div><p className="eyebrow">Controles de conta</p><h1 className="page-title">Segurança</h1><p className="page-subtitle">Proteja o acesso à sua conta e consulte a base de controles do workspace.</p></div><span className="pill"><ShieldCheck size={12} /> Sessão verificada</span></div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(270px,.8fr)]">
      <section className="card p-5 sm:p-7"><MfaSettings /></section>
      <div className="grid content-start gap-4">
        <section className="card p-5"><div className="flex items-center gap-2 text-[12px] font-semibold"><LockKeyhole size={15} className="text-[#548274]" /> Sessão</div><p className="mt-3 text-[11px] text-slate-400">Conta atual</p><p className="mt-1 break-all text-[12px] font-medium text-slate-700">{workspace.email}</p><p className="mt-3 text-[11px] leading-5 text-slate-500">O servidor valida os claims do token e o Supabase gerencia a sessão por cookies HttpOnly apropriados ao fluxo SSR.</p></section>
        <section className="card p-5"><div className="flex items-center gap-2 text-[12px] font-semibold"><Fingerprint size={15} className="text-[#548274]" /> Autorização</div><p className="mt-3 text-[11px] leading-5 text-slate-500">As permissões de tenant são revalidadas no banco por políticas RLS; ocultar componentes na interface não concede nem remove acesso.</p></section>
      </div>
    </div>
  </>;
}
