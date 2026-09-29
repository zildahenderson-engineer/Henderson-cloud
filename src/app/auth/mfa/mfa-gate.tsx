"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/app/actions";
import { KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";

type Factor = { id: string; friendly_name?: string; status: string };

export function MfaGate({ nextPath, factors }: { nextPath: string; factors: Factor[] }) {
  const [factorId, setFactorId] = useState(factors.find((factor) => factor.status === "verified")?.id ?? "");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const verifiedFactors = factors.filter((factor) => factor.status === "verified");

  async function startEnrollment() {
    setBusy(true); setError("");
    try {
      const supabase = createClient();
      for (const pending of factors.filter((factor) => factor.status !== "verified")) {
        await supabase.auth.mfa.unenroll({ factorId: pending.id });
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Henderson Cloud autenticador" });
      if (enrollError || !data?.totp) { setError("Não foi possível iniciar o cadastro de MFA. Tente novamente ou contate o administrador."); return; }
      setFactorId(data.id); setQr(data.totp.qr_code); setSecret(data.totp.secret); setEnrolling(true);
    } catch { setError("O serviço de autenticação não respondeu."); }
    finally { setBusy(false); }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const supabase = createClient();
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError || !challenge) { setError("Não foi possível iniciar a verificação MFA."); return; }
      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: code.replace(/\s/g, "") });
      if (verifyError) { setError("Código inválido ou expirado. Confira o aplicativo autenticador e tente novamente."); return; }
      await supabase.auth.refreshSession();
      window.location.assign(nextPath);
    } catch { setError("O serviço de autenticação não respondeu."); }
    finally { setBusy(false); }
  }

  return <main className="auth-main min-h-screen">
    <section className="auth-card">
      <div className="brand-lockup"><span className="brand-mark">HC</span><span>Henderson Cloud</span></div>
      <span className="empty-icon mt-8"><ShieldCheck size={18} /></span>
      <p className="eyebrow mt-5">Segurança opcional</p>
      <h1 className="mt-2 text-[25px] font-semibold tracking-[-.045em]">Ative um autenticador</h1>
      <p className="mt-2 text-[13px] leading-6 text-slate-500">Você pode usar um aplicativo autenticador (TOTP) para adicionar uma camada extra de proteção. O login normal funciona com e-mail confirmado e senha.</p>
      {error && <p role="alert" className="form-error mt-5">{error}</p>}
      {verifiedFactors.length > 0 && !enrolling ? <form onSubmit={verify} className="mt-6 grid gap-4">
        <p className="text-[12px] font-semibold text-slate-700">Confirme com {verifiedFactors[0]?.friendly_name || "seu autenticador"}</p>
        <label className="field-label" htmlFor="mfa-code">Código de seis dígitos</label>
        <input className="field" id="mfa-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required minLength={6} maxLength={6} />
        <button className="primary-button w-full" type="submit" disabled={busy || code.length !== 6}>{busy ? <LoaderCircle size={15} className="animate-spin" /> : <ShieldCheck size={15} />} Verificar e continuar</button>
      </form> : qr ? <form onSubmit={verify} className="mt-5 grid gap-4">
        <p className="text-[12px] font-semibold">Escaneie o QR com seu autenticador</p>
        <Image unoptimized width={160} height={160} src={qr} alt="QR code de enrollment MFA" className="h-40 w-40 rounded border border-slate-200 bg-white p-2" />
        <p className="text-[11px] leading-5 text-slate-500">Chave manual: <code className="break-all">{secret}</code></p>
        <label className="field-label" htmlFor="setup-mfa-code">Informe o código gerado</label>
        <input className="field" id="setup-mfa-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required minLength={6} maxLength={6} />
        <button className="primary-button w-full" type="submit" disabled={busy || code.length !== 6}>{busy ? <LoaderCircle size={15} className="animate-spin" /> : <KeyRound size={15} />} Confirmar MFA e continuar</button>
      </form> : <button className="primary-button mt-6 w-full" type="button" onClick={() => void startEnrollment()} disabled={busy}>{busy ? <LoaderCircle size={15} className="animate-spin" /> : <KeyRound size={15} />} Configurar autenticador</button>}
      <form action={signOut} className="mt-4 text-center"><button className="text-[11px] text-slate-500 underline-offset-4 hover:underline" type="submit">Sair da conta</button></form>
    </section>
  </main>;
}
