import { BriefcaseBusiness, CirclePlus, Mail, Phone, Trash2, Users } from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/server";
import { CrmLeadForm } from "../crm-lead-form";
import { deleteLead } from "../crm-actions";

const statusLabels: Record<string, string> = { new: "Novo", qualified: "Qualificado", proposal: "Proposta", won: "Ganho", lost: "Perdido" };

export default async function CrmPage() {
  const workspace = await requireWorkspace();
  const supabase = await createClient();
  const { data: leads, error } = await supabase.from("crm_leads").select("id, name, email, company, phone, status, source, created_at").eq("organization_id", workspace.organizationId).order("created_at", { ascending: false }).limit(100);
  const items = leads ?? [];
  const formatter = new Intl.DateTimeFormat(workspace.locale, { dateStyle: "medium", timeZone: workspace.timezone });
  async function removeLead(formData: FormData) {
    await deleteLead(formData);
  }

  return <>
    <div className="page-heading"><div><p className="eyebrow">CRM · leads</p><h1 className="page-title">Relacionamento comercial</h1><p className="page-subtitle">Uma visão operacional dos leads da organização, com dados persistidos e protegidos por tenant.</p></div><span className="pill"><Users size={12} /> {items.length} registrados</span></div>
    {error && <div className="form-error mb-5">Não foi possível carregar os leads. Verifique se a migration do CRM foi aplicada ao banco.</div>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,.7fr)]">
      <section className="card overflow-hidden"><div className="panel-heading"><div><h2 className="panel-title">Pipeline de leads</h2><p className="mt-1 text-[11px] text-slate-400">Ordenado pelos registros mais recentes</p></div><BriefcaseBusiness size={16} className="text-slate-400" /></div>
        {items.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Lead</th><th>Status</th><th>Origem</th><th>Entrada</th><th aria-label="Ações" /></tr></thead><tbody>{items.map((lead) => <tr key={lead.id}><td><div className="font-semibold text-slate-700">{lead.name}</div><div className="mt-1 flex flex-wrap gap-3 text-[10px] text-slate-400">{lead.company && <span>{lead.company}</span>}{lead.email && <span className="inline-flex items-center gap-1"><Mail size={10} />{lead.email}</span>}{lead.phone && <span className="inline-flex items-center gap-1"><Phone size={10} />{lead.phone}</span>}</div></td><td><span className="pill">{statusLabels[lead.status] ?? lead.status}</span></td><td className="text-slate-500">{lead.source || "—"}</td><td className="whitespace-nowrap text-slate-400">{formatter.format(new Date(lead.created_at))}</td><td><form action={removeLead}><input type="hidden" name="id" value={lead.id} /><button className="secondary-button !min-h-8 !w-8 !p-0 text-slate-400 hover:text-red-600" title="Remover lead" type="submit"><Trash2 size={13} /></button></form></td></tr>)}</tbody></table></div> : <div className="empty-state"><div><span className="empty-icon mx-auto"><BriefcaseBusiness size={18} /></span><p className="mt-4 text-[13px] font-semibold text-slate-700">Seu pipeline começa aqui</p><p className="mx-auto mt-1 max-w-xs text-[11px] leading-5 text-slate-400">Cadastre o primeiro lead para começar a acompanhar oportunidades reais.</p><div className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold text-[#145b52]"><CirclePlus size={14} /> Use o formulário ao lado</div></div></div>}
      </section>
      <CrmLeadForm />
    </div>
  </>;
}
