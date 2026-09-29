import { Users, UserPlus, ShieldCheck } from "lucide-react";
import { requireWorkspace } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/server";

export default async function TeamPage() {
  const workspace = await requireWorkspace();
  const supabase = await createClient();
  const { data: members, error } = await supabase.from("organization_members").select("id, user_id, status, joined_at").eq("organization_id", workspace.organizationId).order("joined_at", { ascending: true }).limit(100);
  const ids = (members ?? []).map((member) => member.user_id);
  const [{ data: profiles }, { data: roleRows }] = ids.length ? await Promise.all([
    supabase.from("user_profiles").select("user_id, display_name").in("user_id", ids),
    supabase.from("member_roles").select("member_id, role_id").eq("organization_id", workspace.organizationId),
  ]) : [{ data: [] }, { data: [] }];
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.user_id, profile.display_name]));
  const roleMap = new Map((roleRows ?? []).map((row) => [row.member_id, row.role_id]));
  const roleIds = [...new Set((roleRows ?? []).map((row) => row.role_id))];
  const { data: roles } = roleIds.length ? await supabase.from("roles").select("id, name").in("id", roleIds) : { data: [] };
  const roleNames = new Map((roles ?? []).map((role) => [role.id, role.name]));

  return <>
    <div className="page-heading"><div><p className="eyebrow">Acesso à organização</p><h1 className="page-title">Equipe e acessos</h1><p className="page-subtitle">Pessoas e papéis ativos neste espaço. Os convites serão adicionados na próxima etapa do núcleo.</p></div><span className="pill"><ShieldCheck size={12} /> RBAC no banco</span></div>
    <section className="card">
      <div className="panel-heading"><div><h2 className="panel-title">Membros</h2><p className="mt-1 text-[11px] text-slate-400">{members?.length ?? 0} registro(s) · até 100 exibidos</p></div><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#eaf3f0] text-[#145b52]"><Users size={15} /></span></div>
      {error ? <div className="p-6"><p role="alert" className="form-error">Não foi possível carregar a equipe autorizada.</p></div> : (members?.length ?? 0) === 0 ? <div className="empty-state"><div><span className="empty-icon mx-auto"><Users size={18} /></span><p className="mt-4 text-[13px] font-semibold">Nenhum membro encontrado</p></div></div> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Pessoa</th><th>Papel</th><th>Status</th><th>Desde</th></tr></thead><tbody>{members?.map((member) => <tr key={member.id}><td><span className="font-semibold text-slate-700">{profileMap.get(member.user_id) || "Membro"}</span></td><td>{roleNames.get(roleMap.get(member.id) ?? "") || "Sem papel"}</td><td><span className="pill">{member.status === "active" ? "Ativo" : member.status === "invited" ? "Convidado" : "Suspenso"}</span></td><td>{new Intl.DateTimeFormat(workspace.locale, { dateStyle: "medium", timeZone: workspace.timezone }).format(new Date(member.joined_at))}</td></tr>)}</tbody></table></div>}
    </section>
    <section className="mt-5 grid gap-4 md:grid-cols-2">
      <article className="card p-5"><div className="flex items-center gap-3"><span className="empty-icon"><ShieldCheck size={17} /></span><div><h3 className="text-[12px] font-semibold">Papéis iniciais</h3><p className="mt-1 text-[10px] text-slate-400">Criados por organização no banco.</p></div></div><p className="mt-4 text-[12px] leading-6 text-slate-500">Proprietário, Administrador, Gerente, Colaborador e Leitor. Permissões são verificadas no PostgreSQL, além da interface.</p></article>
      <article className="card p-5"><div className="flex items-center gap-3"><span className="empty-icon"><UserPlus size={17} /></span><div><h3 className="text-[12px] font-semibold">Convites de equipe</h3><p className="mt-1 text-[10px] text-slate-400">Próxima entrega do núcleo.</p></div></div><p className="mt-4 text-[12px] leading-6 text-slate-500">A emissão segura de convites por e-mail será adicionada com expiração, auditoria e validação de papel.</p></article>
    </section>
  </>;
}
