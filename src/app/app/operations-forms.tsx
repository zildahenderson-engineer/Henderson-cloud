"use client";

import { useActionState } from "react";
import { createDocument, createFinanceTransaction, createProject, type OperationActionState } from "./operations-actions";

const initialState: OperationActionState = { ok: false, message: "" };

function Feedback({ state }: { state: OperationActionState }) {
  return state.message ? <p className={state.ok ? "form-success mt-4" : "form-error mt-4"} role="status">{state.message}</p> : null;
}

export function FinanceForm() {
  const [state, action, pending] = useActionState(createFinanceTransaction, initialState);
  return <form action={action} className="card p-5">
    <div className="mb-4"><h2 className="panel-title">Novo lançamento</h2><p className="mt-1 text-[11px] text-slate-400">Registre receitas e despesas reais da organização.</p></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label><span className="field-label">Tipo</span><select className="field" name="type" defaultValue="income"><option value="income">Receita</option><option value="expense">Despesa</option></select></label>
      <label><span className="field-label">Status</span><select className="field" name="status" defaultValue="pending"><option value="pending">Pendente</option><option value="paid">Pago</option><option value="canceled">Cancelado</option></select></label>
      <label className="sm:col-span-2"><span className="field-label">Descrição *</span><input className="field" name="description" required maxLength={180} placeholder="Ex.: Contrato mensal do cliente" /></label>
      <label><span className="field-label">Valor (R$) *</span><input className="field" name="amount" required type="number" min="0.01" step="0.01" /></label>
      <label><span className="field-label">Vencimento</span><input className="field" name="due_date" type="date" /></label>
      <label className="sm:col-span-2"><span className="field-label">Categoria</span><input className="field" name="category" maxLength={80} placeholder="Operação, pessoal, vendas..." /></label>
    </div>
    <Feedback state={state} />
    <button className="primary-button mt-5 w-full" disabled={pending} type="submit">{pending ? "Salvando…" : "Registrar lançamento"}</button>
  </form>;
}

export function ProjectForm() {
  const [state, action, pending] = useActionState(createProject, initialState);
  return <form action={action} className="card p-5">
    <div className="mb-4"><h2 className="panel-title">Novo projeto</h2><p className="mt-1 text-[11px] text-slate-400">Organize uma frente de trabalho do seu negócio.</p></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="sm:col-span-2"><span className="field-label">Nome *</span><input className="field" name="name" required maxLength={160} placeholder="Ex.: Implantação do cliente" /></label>
      <label><span className="field-label">Status</span><select className="field" name="status" defaultValue="planning"><option value="planning">Planejamento</option><option value="active">Em andamento</option><option value="on_hold">Em espera</option><option value="done">Concluído</option></select></label>
      <label><span className="field-label">Início</span><input className="field" name="start_date" type="date" /></label>
      <label><span className="field-label">Prazo</span><input className="field" name="due_date" type="date" /></label>
      <label className="sm:col-span-2"><span className="field-label">Descrição</span><textarea className="field min-h-24 py-3" name="description" maxLength={5000} /></label>
    </div>
    <Feedback state={state} />
    <button className="primary-button mt-5 w-full" disabled={pending} type="submit">{pending ? "Salvando…" : "Criar projeto"}</button>
  </form>;
}

export function DocumentForm() {
  const [state, action, pending] = useActionState(createDocument, initialState);
  return <form action={action} className="card p-5">
    <div className="mb-4"><h2 className="panel-title">Novo documento</h2><p className="mt-1 text-[11px] text-slate-400">Centralize uma política, procedimento ou registro operacional.</p></div>
    <div className="grid gap-4">
      <label><span className="field-label">Nome *</span><input className="field" name="name" required maxLength={180} placeholder="Ex.: Política de atendimento" /></label>
      <label><span className="field-label">Status</span><select className="field" name="status" defaultValue="draft"><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label>
      <label><span className="field-label">Descrição</span><input className="field" name="description" maxLength={5000} /></label>
      <label><span className="field-label">Conteúdo</span><textarea className="field min-h-36 py-3" name="content" maxLength={20000} placeholder="Escreva o conteúdo do documento…" /></label>
    </div>
    <Feedback state={state} />
    <button className="primary-button mt-5 w-full" disabled={pending} type="submit">{pending ? "Salvando…" : "Criar documento"}</button>
  </form>;
}
