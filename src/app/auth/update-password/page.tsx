"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (!z.string().min(12).max(128).safeParse(password).success) { setError("Use uma senha com pelo menos 12 caracteres."); return; }
    if (password !== confirmation) { setError("As senhas não coincidem."); return; }
    setBusy(true);
    try {
      const { error: updateError } = await createClient().auth.updateUser({ password });
      if (updateError) { setError("Não foi possível atualizar a senha. Solicite um novo link de recuperação."); return; }
      setSuccess("Senha atualizada. Redirecionando para sua organização…");
      window.setTimeout(() => { router.replace("/onboarding"); router.refresh(); }, 700);
    } catch { setError("O serviço de autenticação não respondeu. Tente novamente."); }
    finally { setBusy(false); }
  }

  return <main className="auth-main min-h-screen">
    <section className="auth-card">
      <div className="brand-lockup"><span className="brand-mark">HC</span><span>Henderson Cloud</span></div>
      <p className="eyebrow mt-7">Recuperação de acesso</p>
      <h1 className="mt-2 text-[25px] font-semibold tracking-[-.045em]">Defina uma nova senha</h1>
      <p className="mt-2 text-[13px] leading-6 text-slate-500">Escolha uma senha longa e exclusiva para sua conta.</p>
      <form onSubmit={submit} className="mt-7 grid gap-5">
        <div><label className="field-label" htmlFor="password">Nova senha</label><input className="field" id="password" name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></div>
        <div><label className="field-label" htmlFor="confirmation">Repita a nova senha</label><input className="field" id="confirmation" name="confirmation" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></div>
        {error && <p role="alert" className="form-error">{error}</p>}{success && <p role="status" className="form-success">{success}</p>}
        <button className="primary-button w-full" type="submit" disabled={busy}>{busy ? <LoaderCircle size={15} className="animate-spin" /> : <>Salvar nova senha <ArrowRight size={15} /></>}</button>
      </form>
    </section>
  </main>;
}
