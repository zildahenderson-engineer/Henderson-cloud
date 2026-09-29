import { ClipboardList, ShieldAlert } from "lucide-react";
import { notFound } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/server";

export default async function AuditPage() {
  const workspace = await requireWorkspace();
  const supabase = await createClient();
  const { data: canReadAudit } = await supabase.rpc("has_org_permission", { p_organization_id: workspace.organizationId, p_permission_key: "audit.read" });
  if (!canReadAudit) notFound();
  const { data, error } = await supabase.from("audit_logs").select("id, actor_user_id, action, resource_type, resource_id, occurred_at, metadata").eq("organization_id", workspace.organizationId).order("occurred_at", { ascending: false }).limit(50);
  const rows = data ?? [];
  const format = new Intl.DateTimeFormat(workspace.locale, { dateStyle: "medium", timeStyle: "short", timeZone: workspace.timezone });
  return <>
    <div className="page-heading"><div><p className="eyebrow">Rastreabilidade</p><h1 className="page-title">Auditoria</h1><p className="page-subtitle">Eventos relevantes registrados para esta organização; conteúdo sensível não é incluído no log.</p></div><span className="pill"><ShieldAlert size={12} /> {rows.length} evento(s)</span></div>
    <section className="card">
      <div className="panel-heading"><div><h2 className="panel-title">Trilha de atividade</h2><p className="mt-1 text-[11px] text-slate-400">Página inicial · até 50 registros recentes</p></div><ClipboardList size={16} className="text-slate-400" /></div>
      {error ? <div className="p-6"><p role="alert" className="form-error">Não foi possível consultar a auditoria. Verifique a permissão do seu papel.</p></div> : rows.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Data e hora</th><th>Ação</th><th>Recurso</th><th>ID do recurso</th></tr></thead><tbody>{rows.map((event) => <tr key={event.id}><td>{format.format(new Date(event.occurred_at))}</td><td><span className="pill">{event.action}</span></td><td>{event.resource_type.replaceAll("_", " ")}</td><td><span className="font-mono text-[10px]">{event.resource_id ?? "—"}</span></td></tr>)}</tbody></table></div> : <div className="empty-state"><div><span className="empty-icon mx-auto"><ClipboardList size={18} /></span><p className="mt-4 text-[13px] font-semibold">Ainda não há eventos</p><p className="mt-1 text-[11px] text-slate-400">A criação desta organização deve aparecer aqui após a aplicação da migration.</p></div></div>}
    </section>
  </>;
}
