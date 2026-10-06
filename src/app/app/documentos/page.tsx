import { Archive, FileText, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireWorkspace } from "@/lib/workspace";
import { deleteDocument } from "../operations-actions";
import { DocumentForm } from "../operations-forms";

const statusLabels: Record<string, string> = { draft: "Rascunho", published: "Publicado", archived: "Arquivado" };

export default async function DocumentsPage() {
  const workspace = await requireWorkspace();
  const supabase = await createClient();
  const { data: documents, error } = await supabase.from("documents").select("id, name, description, content, status, updated_at").eq("organization_id", workspace.organizationId).order("updated_at", { ascending: false }).limit(100);
  const items = documents ?? [];
  const dateFormatter = new Intl.DateTimeFormat(workspace.locale, { dateStyle: "medium", timeZone: workspace.timezone });
  async function removeDocument(formData: FormData) {
    await deleteDocument(formData);
  }
  return <>
    <div className="page-heading"><div><p className="eyebrow">Operação · documentos</p><h1 className="page-title">Documentos operacionais</h1><p className="page-subtitle">Registre políticas, procedimentos e decisões da organização com histórico de atualização.</p></div><span className="pill"><FileText size={12} /> {items.length} documentos</span></div>
    {error && <div className="form-error mb-5">Não foi possível carregar os documentos. Confirme se a migration dos módulos operacionais foi aplicada.</div>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,.7fr)]">
      <section className="card overflow-hidden"><div className="panel-heading"><div><h2 className="panel-title">Biblioteca da organização</h2><p className="mt-1 text-[11px] text-slate-400">Conteúdo isolado por tenant</p></div><FileText size={16} className="text-slate-400" /></div>{items.length ? <div className="divide-y divide-slate-100">{items.map((item) => <article key={item.id} className="flex items-start gap-4 px-5 py-4"><span className="empty-icon shrink-0"><FileText size={16} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-[12px] font-semibold text-slate-700">{item.name}</h3><span className="pill">{statusLabels[item.status] ?? item.status}</span></div><p className="mt-1 text-[11px] leading-5 text-slate-500">{item.description || item.content?.slice(0, 180) || "Sem descrição ou conteúdo"}</p><p className="mt-2 text-[10px] text-slate-400">Atualizado em {dateFormatter.format(new Date(item.updated_at))}</p></div><form action={removeDocument}><input type="hidden" name="id" value={item.id} /><button className="secondary-button !min-h-8 !w-8 !p-0 text-slate-400 hover:text-red-600" title="Remover documento" type="submit"><Trash2 size={13} /></button></form></article>)}</div> : <div className="empty-state"><div><span className="empty-icon mx-auto"><Archive size={18} /></span><p className="mt-4 text-[13px] font-semibold text-slate-700">Nenhum documento ainda</p><p className="mx-auto mt-1 max-w-xs text-[11px] leading-5 text-slate-400">Centralize o primeiro procedimento da sua organização.</p></div></div>}</section>
      <DocumentForm />
    </div>
  </>;
}
