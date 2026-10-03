import { Activity, Building2, Database, ShieldCheck, Users, UserRound } from "lucide-react";
import { requirePlatformOwner } from "./access";

function Stat({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof Users }) {
  return <article className="card stat-card"><div className="stat-label"><span>{label}</span><Icon size={16} className="text-[#6a8e80]" /></div><div className="stat-value">{value}</div><p className="stat-note">{note}</p></article>;
}

export default async function PlatformAdminPage() {
  const overview = await requirePlatformOwner();
  const formatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo" });
  return <>
    <div className="page-heading"><div><p className="eyebrow">OaaS control plane · acesso global</p><h1 className="page-title">Área da proprietária</h1><p className="page-subtitle">Zilda Henderson · zildahenderson9@gmail.com. Controle global do Henderson Cloud: tenants, usuários, operação, observabilidade e auditoria.</p></div><span className="pill"><ShieldCheck size={12} /> Platform Owner ativo</span></div>
    <div className="stat-grid">
      <Stat label="Tenants" value={String(overview.tenant_count)} note="Organizações cadastradas" icon={Building2} />
      <Stat label="Usuários" value={String(overview.user_count)} note="Contas de autenticação" icon={UserRound} />
      <Stat label="Membros ativos" value={String(overview.active_members)} note="Vínculos ativos em organizações" icon={Users} />
      <Stat label="Leads CRM" value={String(overview.lead_count)} note="Registros em todos os tenants" icon={Database} />
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.75fr)]">
      <section className="card overflow-hidden"><div className="panel-heading"><div><h2 className="panel-title">Tenants da plataforma</h2><p className="mt-1 text-[11px] text-slate-400">Visão global da operação · somente leitura</p></div><Building2 size={16} className="text-slate-400" /></div>{overview.tenants.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Organização</th><th>Membros</th><th>Leads</th><th>Localidade</th><th>Criada em</th></tr></thead><tbody>{overview.tenants.map((tenant) => <tr key={tenant.id}><td><div className="font-semibold text-slate-700">{tenant.name}</div><div className="mt-1 text-[10px] text-slate-400">{tenant.slug}</div></td><td>{tenant.members}</td><td>{tenant.leads}</td><td>{tenant.locale} · {tenant.currency}</td><td className="whitespace-nowrap text-slate-400">{formatter.format(new Date(tenant.created_at))}</td></tr>)}</tbody></table></div> : <div className="empty-state"><div><span className="empty-icon mx-auto"><Building2 size={18} /></span><p className="mt-4 text-[13px] font-semibold text-slate-700">Nenhum tenant cadastrado</p></div></div>}</section>
      <section className="card overflow-hidden"><div className="panel-heading"><div><h2 className="panel-title">Auditoria global</h2><p className="mt-1 text-[11px] text-slate-400">{overview.audit_count} eventos registrados</p></div><Activity size={16} className="text-slate-400" /></div>{overview.recent_audit.length ? <div className="divide-y divide-slate-100">{overview.recent_audit.slice(0, 8).map((event) => <div key={event.id} className="px-5 py-3"><div className="flex items-center justify-between gap-3"><span className="text-[11px] font-semibold text-slate-700">{event.action}</span><span className="pill">{event.resource_type}</span></div><p className="mt-1 text-[10px] text-slate-400">{formatter.format(new Date(event.occurred_at))}</p></div>)}</div> : <div className="empty-state !min-h-[160px]"><div><span className="empty-icon mx-auto"><Activity size={18} /></span><p className="mt-4 text-[13px] font-semibold text-slate-700">Sem eventos ainda</p></div></div>}</section>
    </div>
  </>;
}
