"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateOrganization, type OrganizationState } from "./actions";
import type { WorkspaceContext } from "@/lib/workspace";
import { LoaderCircle, Save } from "lucide-react";

function SaveButton() {
  const { pending } = useFormStatus();
  return <button className="primary-button" type="submit" disabled={pending}>{pending ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}{pending ? "Salvando…" : "Salvar alterações"}</button>;
}

export function OrganizationForm({ context }: { context: WorkspaceContext }) {
  const [state, action] = useActionState<OrganizationState, FormData>(updateOrganization, null);
  return <form action={action} className="grid gap-5">
    <input type="hidden" name="id" value={context.organizationId} />
    <div><label htmlFor="org-name" className="field-label">Nome da empresa</label><input className="field" id="org-name" name="name" defaultValue={context.organizationName} required minLength={2} maxLength={120} /></div>
    <div><label htmlFor="org-slug" className="field-label">Identificador</label><input className="field" id="org-slug" name="slug" defaultValue={context.organizationSlug} required minLength={3} maxLength={48} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div><label htmlFor="org-country" className="field-label">País</label><select className="field" id="org-country" name="country" defaultValue="BR"><option value="BR">Brasil</option><option value="US">Estados Unidos</option><option value="MX">México</option><option value="ES">Espanha</option><option value="AR">Argentina</option><option value="PT">Portugal</option></select></div>
      <div><label htmlFor="org-currency" className="field-label">Moeda-base</label><select className="field" id="org-currency" name="currency" defaultValue={context.currency}><option value="BRL">BRL — Real</option><option value="USD">USD — Dólar</option><option value="EUR">EUR — Euro</option><option value="MXN">MXN — Peso</option><option value="ARS">ARS — Peso argentino</option></select></div>
      <div><label htmlFor="org-locale" className="field-label">Idioma</label><select className="field" id="org-locale" name="locale" defaultValue={context.locale}><option value="pt-BR">Português (Brasil)</option><option value="en">English</option><option value="es">Español</option></select></div>
      <div><label htmlFor="org-timezone" className="field-label">Fuso horário</label><select className="field" id="org-timezone" name="timezone" defaultValue={context.timezone}><option value="America/Sao_Paulo">São Paulo</option><option value="America/Mexico_City">Cidade do México</option><option value="America/New_York">Nova York</option><option value="Europe/Madrid">Madri</option><option value="UTC">UTC</option></select></div>
    </div>
    {state?.error && <p role="alert" className="form-error">{state.error}</p>}
    {state?.success && <p role="status" className="form-success">{state.success}</p>}
    <div className="flex justify-end"><SaveButton /></div>
  </form>;
}
