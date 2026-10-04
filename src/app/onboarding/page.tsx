import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  let ownerProvisioningError = false;
  if (user.email?.toLowerCase() === "zildahenderson9@gmail.com") {
    const { data: claimed } = await supabase.rpc("claim_platform_owner");
    if (claimed) redirect("/platform-admin");
    ownerProvisioningError = true;
  }
  const { data: memberships } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).eq("status", "active").limit(1);
  if (memberships?.length) redirect("/app");

  return (
    <main className="min-h-screen bg-[#f5f7f6] px-5 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="brand-lockup"><span className="brand-mark">HC</span><span>Henderson Cloud</span></div>
        <div className="mt-12 max-w-xl">
          <p className="eyebrow">Comece pelo seu espaço</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em]">Configure sua organização</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">O primeiro espaço será criado com você como responsável. A equipe, os papéis e as permissões ficam isolados por organização desde o início.</p>
        </div>
        <div className="card mt-8 p-6 sm:p-8">
          {ownerProvisioningError ? <div className="form-error">Não foi possível preparar o workspace Henderson Cloud para esta conta. Atualize a página uma vez; se o problema continuar, verifique a configuração do Supabase.</div> : <OnboardingForm />}
        </div>
      </div>
    </main>
  );
}
