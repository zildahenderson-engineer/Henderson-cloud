import { CalendarDays, FolderKanban, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireWorkspace } from "@/lib/workspace";
import { deleteProject } from "../operations-actions";
import { ProjectForm } from "../operations-forms";

const statusLabels: Record<string, string> = { planning: "Planejamento", active: "Em andamento", on_hold: "Em espera", done: "Concluído" };

export default async function ProjectsPage() {
  const workspace = await requireWorkspace();
  const supabase = await createClient();
  const { data: projects, error } = await supabase.from("projects").select("id, name, description, status, start_date, due_date, created_at").eq("organization_id", workspace.organizationId).order("created_at", { ascending: false }).limit(100);
  const items = projects ?? [];
  const dateFormatter = new Intl.DateTimeFormat(workspace.locale, { dateStyle: "medium", timeZone: workspace.timezone });
  async function removeProject(formData: FormData) {
    await deleteProject(formData);
  }
  return <>
    <div className="page-heading"><div><p className="eyebrow">Operação · projetos</p><h1 className="page-title">Projetos e entregas</h1><p className="page-subtitle">Acompanhe frentes de trabalho, responsáveis e prazos em um só lugar.</p></div><span className="pill"><FolderKanban size={12} /> {items.length} projetos</span></div>
    {error && <div className="form-error mb-5">Não foi possível carregar os projetos. Confirme se a migration dos módulos operacionais foi aplicada.</div>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,.7fr)]">
      <section className="card overflow-hidden"><div className="panel-heading"><div><h2 className="panel-title">Portfólio de projetos</h2><p className="mt-1 text-[11px] text-slate-400">Visão tenant-scoped da operação</p></div><FolderKanban size={16} className="text-slate-400" /></div>{items.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Projeto</th><th>Status</th><th>Início</th><th>Prazo</th><th aria-label="Ações" /></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><div className="font-semibold text-slate-700">{item.name}</div><div className="mt-1 max-w-sm truncate text-[10px] text-slate-400">{item.description || "Sem descrição"}</div></td><td><span className="pill">{statusLabels[item.status] ?? item.status}</span></td><td className="whitespace-nowrap text-slate-400">{item.start_date ? dateFormatter.format(new Date(`${item.start_date}T12:00:00`)) : "—"}</td><td className="whitespace-nowrap text-slate-400">{item.due_date ? dateFormatter.format(new Date(`${item.due_date}T12:00:00`)) : "—"}</td><td><form action={removeProject}><input type="hidden" name="id" value={item.id} /><button className="secondary-button !min-h-8 !w-8 !p-0 text-slate-400 hover:text-red-600" title="Remover projeto" type="submit"><Trash2 size={13} /></button></form></td></tr>)}</tbody></table></div> : <div className="empty-state"><div><span className="empty-icon mx-auto"><CalendarDays size={18} /></span><p className="mt-4 text-[13px] font-semibold text-slate-700">Nenhum projeto cadastrado</p><p className="mx-auto mt-1 max-w-xs text-[11px] leading-5 text-slate-400">Crie a primeira frente de trabalho da sua organização.</p></div></div>}</section>
      <ProjectForm />
    </div>
  </>;
}
