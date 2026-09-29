"use client";

import { useActionState } from "react";
import { createLead, type LeadActionState } from "./crm-actions";

const initialState: LeadActionState = { ok: false, message: "" };

export function CrmLeadForm() {
  const [state, action, pending] = useActionState(createLead, initialState);
  return <form action={action} className="card p-5">
    <div className="mb-4"><h2 className="panel-title">Novo lead</h2><p className="mt-1 text-[11px] text-slate-400">Registre uma oportunidade real no workspace.</p></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label><span className="field-label">Nome *</span><input className="field" name="name" required maxLength={160} placeholder="Ex.: Ana Souza" /></label>
      <label><span className="field-label">E-mail</span><input className="field" name="email" type="email" maxLength={320} placeholder="ana@empresa.com" /></label>
      <label><span className="field-label">Empresa</span><input className="field" name="company" maxLength={160} /></label>
      <label><span className="field-label">Telefone</span><input className="field" name="phone" maxLength={40} /></label>
      <label className="sm:col-span-2"><span className="field-label">Origem</span><input className="field" name="source" maxLength={80} placeholder="Indicação, site, evento..." /></label>
      <label className="sm:col-span-2"><span className="field-label">Observações</span><textarea className="field min-h-24 py-3" name="notes" maxLength={5000} /></label>
    </div>
    {state.message && <p className={state.ok ? "form-success mt-4" : "form-error mt-4"} role="status">{state.message}</p>}
    <button className="primary-button mt-5 w-full" disabled={pending} type="submit">{pending ? "Salvando..." : "Criar lead"}</button>
  </form>;
}
