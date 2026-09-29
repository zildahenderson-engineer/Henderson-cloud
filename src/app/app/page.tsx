import { Activity, Building2, CircleCheck, Clock3, Users } from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/server";

function StatCard({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof Users }) {
  return <article className="card stat-card"><div className="stat-label"><span>{label}</span><Icon size={16} className="text-[#6a8e80]" /></div><div className="stat-value">{value}</div><p className="stat-note">{note}</p></article>;
}

export default async function DashboardPage() {
  const workspace = await requireWorkspace();
  const supabase = await createClient();
  const [{ count: memberCount }, { data: events }] = await Promise.all([
    supabase.from("organization_members").select("id", { count: "exact", head: true }).eq("organization_id", workspace.organizationId).eq("status", "active"),
    supabase.from("audit_logs").select("id, action, resource_type, occurred_at, metadata").eq("organization_id", workspace.organizationId).order("occurred_at", { ascending: false }).limit(5),
  ]);
  const auditEvents = events ?? [];
  const formatter = new Intl.DateTimeFormat(workspace.locale, { dateStyle: "medium", timeStyle: "short", timeZone: workspace.timezone });
  const actionLabel: Record<string, string> = { CREATE: "criou", UPDATE: "atualizou", DELETE: "removeu", PERMISSION_CHANGE: "alterou acessos" };

  return <>
    <div className="page-heading"><div><p className="eyebrow">Visão geral · {workspace.organizationSlug}</p><h1 className="page-title">Bom dia, {workspace.displayName.split(" ")[0]}.</h1><p className="page-subtitle">Aqui está a base operacional do seu espaço. Os dados refletem registros reais desta organização.</p></div><span className="pill"><CircleCheck size={12} /> Dados protegidos por organização</span></div>
    <div className="stat-grid">
      <StatCard label="Pessoas no espaço" value={String(memberCount ?? 0)} note="Contas ativas vinculadas a esta organização" icon={Users} />
      <StatCard label="Atividade registrada" value={String(auditEvents.length)} note="Eventos recentes no log de auditoria" icon={Activity} />
      <StatCard label="Configuração regional" value={workspace.currency} note={`${workspace.locale} · ${workspace.timezone}`} icon={Building2} />
    </div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(270px,.8fr)]">
      <section className="card">
        <div className="panel-heading"><div><h2 className="panel-title">Atividade da organização</h2><p className="mt-1 text-[11px] text-slate-400">Trilha recente de auditoria</p></div><Activity size={16} className="text-slate-400" /></div>
        {auditEvents.length ? <div className="divide-y divide-slate-100">{auditEvents.map((event) => <div key={event.id} className="flex items-start gap-3 px-5 py-4"><span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#f1f5f3] text-[#54776a]"><Clock3 size={14} /></span><div className="min-w-0 flex-1"><p className="text-[12px] leading-5 text-slate-700"><span className="font-semibold">{actionLabel[event.action] ?? event.action.toLowerCase()}</span> · {event.resource_type.replaceAll("_", " ")}</p><p className="mt-1 text-[10px] text-slate-400">{formatter.format(new Date(event.occurred_at))}</p></div><span className="pill">{event.action}</span></div>)}</div> : <div className="empty-state"><div><span className="empty-icon mx-auto"><Activity size={18} /></span><p className="mt-4 text-[13px] font-semibold text-slate-700">Ainda não há atividade</p><p className="mx-auto mt-1 max-w-xs text-[11px] leading-5 text-slate-400">As ações relevantes desta organização aparecerão aqui quando forem realizadas.</p></div></div>}
      </section>
      <section className="card">
        <div className="panel-heading"><h2 className="panel-title">Henderson Cloud · Fase 1</h2><span className="pill">Fase 1</span></div>
        <div className="panel-body">
          <p className="text-[12px] leading-6 text-slate-500">A organização já possui isolamento por tenant, papéis iniciais e auditoria no banco de dados.</p>
          <div className="mt-4 grid gap-3">
            {["Identidade da organização", "Membros e funções", "Controles de segurança", "Histórico de auditoria"].map((item, index) => <div key={item} className="flex items-center gap-2.5 text-[11px] text-slate-600"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#e8f3ed] text-[#27614c]"><CircleCheck size={12} /></span><span>{item}</span><span className="ml-auto text-[9px] text-slate-400">{index < 2 ? "ATIVO" : "BASE"}</span></div>)}
          </div>
          <a href="/app/organization" className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold text-[#145b52] hover:underline">Revisar organização <span aria-hidden="true">→</span></a>
        </div>
      </section>
    </div>
  </>;
}
