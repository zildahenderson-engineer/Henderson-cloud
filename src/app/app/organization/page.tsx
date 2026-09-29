import { Building2, Globe2, ShieldCheck } from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { OrganizationForm } from "./organization-form";

export default async function OrganizationPage() {
  const context = await requireWorkspace();
  return <>
    <div className="page-heading"><div><p className="eyebrow">Administração do espaço</p><h1 className="page-title">Organização</h1><p className="page-subtitle">Identidade e contexto regional usados pelas áreas da plataforma.</p></div><span className="pill"><ShieldCheck size={12} /> Isolamento ativo</span></div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(260px,.65fr)]">
      <section className="card p-5 sm:p-7"><div className="mb-6 flex items-center gap-3"><span className="empty-icon"><Building2 size={18} /></span><div><h2 className="text-[14px] font-semibold">Dados principais</h2><p className="mt-1 text-[11px] text-slate-400">Alterações exigem permissão no servidor e entram na auditoria.</p></div></div><OrganizationForm context={context} /></section>
      <aside className="grid content-start gap-4">
        <section className="card p-5"><div className="flex items-center gap-2 text-[12px] font-semibold"><Globe2 size={15} className="text-[#548274]" /> Localização</div><p className="mt-3 text-[12px] leading-6 text-slate-500">O idioma, a moeda e o fuso horário são armazenados por organização. A conversão e regras fiscais por país serão entregues em fases posteriores.</p></section>
        <section className="card p-5"><div className="flex items-center gap-2 text-[12px] font-semibold"><ShieldCheck size={15} className="text-[#548274]" /> Limites desta fase</div><p className="mt-3 text-[12px] leading-6 text-slate-500">Criação e edição da organização estão implementadas. Exclusão do espaço não é disponibilizada nesta fase para proteger dados e trilhas de auditoria.</p></section>
      </aside>
    </div>
  </>;
}
