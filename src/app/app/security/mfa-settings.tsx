"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { KeyRound, LoaderCircle, ShieldCheck, Smartphone, Trash2 } from "lucide-react";

type Factor = { id: string; friendly_name?: string; status: string; factor_type: string; created_at: string };

export function MfaSettings() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadFactors() {
    const supabase = createClient();
    const { data, error: factorError } = await supabase.auth.mfa.listFactors();
    if (factorError) { setError("Não foi possível consultar os fatores de autenticação."); return; }
    setFactors([...(data.totp ?? []), ...(data.phone ?? [])] as Factor[]);
  }
  useEffect(() => {
    let active = true;
    void createClient().auth.mfa.listFactors().then(({ data, error: factorError }) => {
      if (!active) return;
      if (factorError) { setError("Não foi possível consultar os fatores de autenticação."); return; }
      setFactors([...(data.totp ?? []), ...(data.phone ?? [])] as Factor[]);
    });
    return () => { active = false; };
  }, []);

  async function beginEnrollment() {
    setBusy(true); setError(""); setMessage("");
    try {
      const supabase = createClient();
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Henderson Cloud autenticador" });
      if (enrollError || !data?.id || !data.totp) { setError("Não foi possível iniciar o cadastro de MFA. Confira as configurações de Auth no Supabase."); return; }
      setFactorId(data.id); setQr(data.totp.qr_code); setSecret(data.totp.secret);
    } catch { setError("O serviço de autenticação não respondeu."); }
    finally { setBusy(false); }
  }

  async function verifyEnrollment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const supabase = createClient();
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError || !challenge) { setError("Não foi possível validar o desafio MFA."); return; }
      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: code.replace(/\s/g, "") });
      if (verifyError) { setError("Código inválido ou expirado. Confira o aplicativo autenticador e tente novamente."); return; }
      setQr(""); setSecret(""); setFactorId(""); setCode(""); setMessage("MFA ativado para esta conta."); await loadFactors();
    } catch { setError("O serviço de autenticação não respondeu."); }
    finally { setBusy(false); }
  }

  async function removeFactor(id: string) {
    if (!window.confirm("Remover este fator MFA? Isso reduz a proteção da conta.")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const supabase = createClient();
      const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: id });
      if (removeError) { setError("Não foi possível remover o fator. Entre novamente e tente outra vez."); return; }
      setMessage("Fator removido."); await loadFactors();
    } catch { setError("O serviço de autenticação não respondeu."); }
    finally { setBusy(false); }
  }

  const verified = factors.filter((factor) => factor.status === "verified");
  return <div>
    <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="empty-icon"><KeyRound size={17} /></span><div><h3 className="text-[13px] font-semibold">Autenticação em dois fatores</h3><p className="mt-1 text-[11px] text-slate-400">TOTP usando um aplicativo autenticador compatível.</p></div></div><span className="pill">{verified.length ? "Ativo" : "Não configurado"}</span></div>
    {error && <p role="alert" className="form-error mt-4">{error}</p>}{message && <p role="status" className="form-success mt-4">{message}</p>}
    {qr ? <form onSubmit={verifyEnrollment} className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-[12px] font-semibold">1. Escaneie o QR code</p><Image unoptimized width={160} height={160} className="my-4 h-40 w-40 rounded border border-slate-200 bg-white p-2" src={qr} alt="QR code de cadastro MFA" /><p className="text-[11px] text-slate-500">Se necessário, use esta chave manual: <code className="break-all">{secret}</code></p>
      <label className="field-label mt-4" htmlFor="totp-code">2. Informe o código de seis dígitos</label><div className="flex gap-2"><input className="field max-w-[180px]" id="totp-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required minLength={6} maxLength={6} /><button className="primary-button" type="submit" disabled={busy || code.length !== 6}>{busy ? <LoaderCircle size={15} className="animate-spin" /> : <ShieldCheck size={15} />} Verificar</button></div>
    </form> : verified.length ? <div className="mt-4 grid gap-2">{verified.map((factor) => <div key={factor.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-3"><span className="flex items-center gap-2 text-[12px] text-slate-600"><Smartphone size={15} className="text-slate-400" />{factor.friendly_name || "Aplicativo autenticador"}</span><button className="secondary-button !h-8 !min-h-0 !px-2.5 text-[11px] text-rose-700" type="button" disabled={busy} onClick={() => void removeFactor(factor.id)}><Trash2 size={13} /> Remover</button></div>)}</div> : <button className="secondary-button mt-5" type="button" onClick={() => void beginEnrollment()} disabled={busy}>{busy ? <LoaderCircle size={15} className="animate-spin" /> : <KeyRound size={15} />} Ativar MFA</button>}
    <p className="mt-4 text-[10px] leading-5 text-slate-400">O MFA é opcional e pode ser ativado individualmente na área Segurança.</p>
  </div>;
}
