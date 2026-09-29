"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { organizationSchema } from "@/lib/validation";

export type OrganizationState = { error?: string; success?: string } | null;

export async function updateOrganization(_previous: OrganizationState, formData: FormData): Promise<OrganizationState> {
  const id = String(formData.get("id") ?? "");
  const parsed = organizationSchema.safeParse({
    name: formData.get("name"), slug: formData.get("slug"), country: formData.get("country"),
    locale: formData.get("locale"), timezone: formData.get("timezone"), currency: formData.get("currency"),
  });
  if (!id || !parsed.success) return { error: parsed.success ? "Organização inválida." : parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  const { data: allowed, error: permissionError } = await supabase.rpc("has_org_permission", {
    p_organization_id: id, p_permission_key: "organization.update",
  });
  if (permissionError || !allowed) return { error: "Seu papel não permite alterar esta organização." };
  const { data: updated, error } = await supabase.from("organizations").update({
    name: parsed.data.name, slug: parsed.data.slug, country_code: parsed.data.country,
    locale: parsed.data.locale, timezone: parsed.data.timezone, currency: parsed.data.currency,
  }).eq("id", id).select("id").maybeSingle();
  if (error || !updated) {
    if (error?.code === "23505") return { error: "Esse identificador já está em uso." };
    if (error?.code === "42501") return { error: "Seu papel não permite alterar as configurações desta organização." };
    return { error: "Não foi possível atualizar a organização. Confira os dados e tente novamente." };
  }
  revalidatePath("/app");
  revalidatePath("/app/organization");
  return { success: "Configurações salvas." };
}
