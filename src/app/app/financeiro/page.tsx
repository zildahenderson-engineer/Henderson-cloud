import { CircleDollarSign, Receipt, TrendingDown, TrendingUp, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireWorkspace } from "@/lib/workspace";
import { deleteFinanceTransaction } from "../operations-actions";
import { FinanceForm } from "../operations-forms";

const statusLabels: Record<string, string> = { pending: "Pendente", paid: "Pago", canceled: "Cancelado" };
const typeLabels: Record<string, string> = { income: "Receita", expense: "Despesa" };

export default async function FinancePage() {
  const workspace = await requireWorkspace();
  const supabase = await createClient();
  const { data: transactions, error } = await supabase.from("finance_transactions").select("id, type, description, category, amount, due_date, status, created_at").eq("organization_id", workspace.organizationId).order("created_at", { ascending: false }).limit(100);
  const items = transactions ?? [];
  const income = items.filter((item) => item.type === "income" && item.status !== "canceled").reduce((total, item) => total + Number(item.amount), 0);
  const expenses = items.filter((item) => item.type === "expense" && item.status !== "canceled").reduce((total, item) => total + Number(item.amount), 0);
  const balance = income - expenses;
  const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: workspace.currency });
  const dateFormatter = new Intl.DateTimeFormat(workspace.locale, { dateStyle: "medium", timeZone: workspace.timezone });
  async function removeTransaction(formData: FormData) {
    await deleteFinanceTransaction(formData);
  }
  return <>
    <div className="page-heading"><div><p className="eyebrow">Operação · financeiro</p><h1 className="page-title">Controle financeiro</h1><p className="page-subtitle">Receitas e despesas reais da organização, protegidas por tenant e registradas na auditoria.</p></div><span className="pill"><CircleDollarSign size={12} /> {items.length} lançamentos</span></div>
    <div className="stat-grid">
      <article className="card stat-card"><div className="stat-label"><span>Saldo operacional</span><CircleDollarSign size={16} className="text-[#6a8e80]" /></div><div className="stat-value">{currency.format(balance)}</div><p className="stat-note">Receitas menos despesas não canceladas</p></article>
      <article className="card stat-card"><div className="stat-label"><span>Receitas</span><TrendingUp size={16} className="text-emerald-600" /></div><div className="stat-value">{currency.format(income)}</div><p className="stat-note">Total registrado nesta visão</p></article>
      <article className="card stat-card"><div className="stat-label"><span>Despesas</span><TrendingDown size={16} className="text-amber-600" /></div><div className="stat-value">{currency.format(expenses)}</div><p className="stat-note">Total registrado nesta visão</p></article>
    </div>
    {error && <div className="form-error mt-5">Não foi possível carregar o financeiro. Confirme se a migration dos módulos operacionais foi aplicada.</div>}
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.65fr)]">
      <section className="card overflow-hidden"><div className="panel-heading"><div><h2 className="panel-title">Lançamentos</h2><p className="mt-1 text-[11px] text-slate-400">Até 100 registros mais recentes</p></div><Receipt size={16} className="text-slate-400" /></div>{items.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Descrição</th><th>Tipo</th><th>Valor</th><th>Status</th><th>Vencimento</th><th aria-label="Ações" /></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><div className="font-semibold text-slate-700">{item.description}</div><div className="mt-1 text-[10px] text-slate-400">{item.category || "Sem categoria"}</div></td><td><span className="pill">{typeLabels[item.type] ?? item.type}</span></td><td className={item.type === "income" ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>{item.type === "income" ? "+" : "−"}{currency.format(Number(item.amount))}</td><td><span className="pill">{statusLabels[item.status] ?? item.status}</span></td><td className="whitespace-nowrap text-slate-400">{item.due_date ? dateFormatter.format(new Date(`${item.due_date}T12:00:00`)) : "—"}</td><td><form action={removeTransaction}><input type="hidden" name="id" value={item.id} /><button className="secondary-button !min-h-8 !w-8 !p-0 text-slate-400 hover:text-red-600" title="Remover lançamento" type="submit"><Trash2 size={13} /></button></form></td></tr>)}</tbody></table></div> : <div className="empty-state"><div><span className="empty-icon mx-auto"><Receipt size={18} /></span><p className="mt-4 text-[13px] font-semibold text-slate-700">Nenhum lançamento ainda</p><p className="mx-auto mt-1 max-w-xs text-[11px] leading-5 text-slate-400">Registre uma receita ou despesa real para iniciar o acompanhamento.</p></div></div>}</section>
      <FinanceForm />
    </div>
  </>;
}
