"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const credentialsSchema = z.object({
  email: z.email("Informe um e-mail válido.").max(254),
  password: z.string().min(12, "Use uma senha com pelo menos 12 caracteres.").max(128),
});

type Mode = "sign-in" | "sign-up" | "reset";

export function AuthForm({ configured, initialError = "" }: { configured: boolean; initialError?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const [success, setSuccess] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");

    if (!configured) {
      setError("O Supabase ainda não está conectado. Configure as variáveis indicadas no arquivo .env.example para ativar autenticação e banco de dados.");
      return;
    }
    if (mode !== "reset") {
      const parsed = credentialsSchema.safeParse({ email, password });
      if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Revise os dados informados."); return; }
    } else if (!z.email().safeParse(email).success) {
      setError("Informe um e-mail válido."); return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
      const redirectOrigin = configuredOrigin || window.location.origin;
      if (mode === "sign-in") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) { setError("Não foi possível entrar. Confira o e-mail e a senha ou recupere seu acesso."); return; }
        router.replace(email === "zildahenderson9@gmail.com" ? "/platform-admin" : "/");
        router.refresh();
      } else if (mode === "sign-up") {
        const { data, error: authError } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${redirectOrigin}/auth/callback?next=/onboarding` },
        });
        if (authError) { setError("Não foi possível criar a conta. Verifique os dados ou tente novamente mais tarde."); return; }
        if (data.session) { router.replace("/onboarding"); router.refresh(); }
        else setSuccess("Enviamos um link de confirmação para seu e-mail. Confirme o endereço para continuar.");
      } else {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${redirectOrigin}/auth/callback?next=/auth/update-password`,
        });
        if (authError) { setError("Não foi possível iniciar a recuperação. Verifique o e-mail e tente novamente."); return; }
        setSuccess("Se houver uma conta para esse endereço, você receberá um link seguro para redefinir a senha.");
      }
    } catch {
      setError("O serviço de autenticação não respondeu. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  const button = mode === "sign-in" ? "Entrar" : mode === "sign-up" ? "Criar conta" : "Enviar link de recuperação";

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-5" noValidate>
      <div>
        <label className="field-label" htmlFor="email">E-mail de trabalho</label>
        <input className="field" id="email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="voce@empresa.com" />
      </div>
      {mode !== "reset" && <div>
        <label className="field-label" htmlFor="password">Senha</label>
        <input className="field" id="password" name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} required minLength={12} maxLength={128} placeholder="Pelo menos 12 caracteres" />
        <p className="mt-2 text-[11px] leading-5 text-slate-500">Use uma frase-senha longa e exclusiva.</p>
      </div>}
      {error && <p role="alert" className="form-error">{error}</p>}
      {success && <p role="status" className="form-success">{success}</p>}
      <button className="primary-button w-full" type="submit" disabled={busy}>
        {busy ? <LoaderCircle size={16} className="animate-spin" /> : <>{button}<ArrowRight size={15} /></>}
      </button>
      <div className="flex flex-wrap justify-between gap-2 text-[12px] text-slate-500">
        {mode === "sign-in" ? <>
          <button type="button" onClick={() => { setMode("reset"); setError(""); setSuccess(""); }} className="underline-offset-4 hover:text-slate-800 hover:underline">Esqueci minha senha</button>
          <button type="button" onClick={() => { setMode("sign-up"); setError(""); setSuccess(""); }} className="font-semibold text-emerald-800 hover:underline">Criar uma conta</button>
        </> : <button type="button" onClick={() => { setMode("sign-in"); setError(""); setSuccess(""); }} className="font-semibold text-emerald-800 hover:underline">Voltar para entrar</button>}
      </div>
    </form>
  );
}
