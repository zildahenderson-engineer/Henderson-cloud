"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createWorkspace, type OnboardingState } from "./actions";
import { toSlug } from "@/lib/validation";
import { ArrowRight, LoaderCircle } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="primary-button mt-2" disabled={pending} type="submit">{pending ? <LoaderCircle size={16} className="animate-spin" /> : <>Criar organização <ArrowRight size={15} /></>}</button>;
}

export function OnboardingForm() {
  const [state, action] = useActionState<OnboardingState, FormData>(createWorkspace, null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return <form action={action} className="grid gap-5">
    <div><label className="field-label" htmlFor="name">Nome da empresa</label><input className="field" id="name" name="name" value={name} onChange={(event) => { const next = event.target.value; setName(next); if (!slugTouched) setSlug(toSlug(next)); }} required minLength={2} maxLength={120} placeholder="Ex.: Acme Tecnologia" /></div>
    <div><label className="field-label" htmlFor="slug">Identificador do espaço</label><div className="flex items-center rounded-[9px] border border-[#dce4e2] bg-white focus-within:border-[#74a89a]"><span className="pl-3 text-xs text-slate-400">henderson /</span><input className="h-[44px] min-w-0 flex-1 border-0 bg-transparent px-2 text-sm outline-none" id="slug" name="slug" value={slug} onChange={(event) => { setSlugTouched(true); setSlug(event.target.value.toLowerCase()); }} required minLength={3} maxLength={48} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></div><p className="mt-1.5 text-[11px] text-slate-400">Letras minúsculas, números e hífens; não pode repetir outro espaço.</p></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div><label className="field-label" htmlFor="country">País</label><select className="field" id="country" name="country" defaultValue="BR"><option value="BR">Brasil</option><option value="US">Estados Unidos</option><option value="MX">México</option><option value="ES">Espanha</option><option value="AR">Argentina</option><option value="PT">Portugal</option></select></div>
      <div><label className="field-label" htmlFor="currency">Moeda-base</label><select className="field" id="currency" name="currency" defaultValue="BRL"><option value="BRL">BRL — Real brasileiro</option><option value="USD">USD — Dólar americano</option><option value="EUR">EUR — Euro</option><option value="MXN">MXN — Peso mexicano</option><option value="ARS">ARS — Peso argentino</option></select></div>
      <div><label className="field-label" htmlFor="locale">Idioma</label><select className="field" id="locale" name="locale" defaultValue="pt-BR"><option value="pt-BR">Português (Brasil)</option><option value="en">English</option><option value="es">Español</option></select></div>
      <div><label className="field-label" htmlFor="timezone">Fuso horário</label><select className="field" id="timezone" name="timezone" defaultValue="America/Sao_Paulo"><option value="America/Sao_Paulo">São Paulo (UTC−03:00)</option><option value="America/Mexico_City">Cidade do México</option><option value="America/New_York">Nova York</option><option value="Europe/Madrid">Madri</option><option value="UTC">UTC</option></select></div>
    </div>
    {state?.error && <p role="alert" className="form-error">{state.error}</p>}
    <SubmitButton />
  </form>;
}
