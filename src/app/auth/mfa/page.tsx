import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MfaGate } from "./mfa-gate";

export const dynamic = "force-dynamic";

function safeNext(value: string | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/auth/mfa") ? value : "/app";
}

export default async function MfaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const nextPath = safeNext((await searchParams).next);
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const isPlatformOwner = user.email?.toLowerCase() === "zildahenderson9@gmail.com";
  const effectiveNextPath = isPlatformOwner ? "/" : nextPath;
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel === "aal2") redirect(effectiveNextPath);
  const { data: factorData } = await supabase.auth.mfa.listFactors();
  const factors = (factorData?.totp ?? []).map(({ id, friendly_name, status }) => ({ id, friendly_name, status }));
  return <MfaGate nextPath={effectiveNextPath} factors={factors} />;
}
