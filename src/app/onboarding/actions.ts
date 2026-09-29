"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { organizationSchema, toSlug } from "@/lib/validation";

export type OnboardingState = { error?: string } | null;

export async function createWorkspace(_previous: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const parsed = organizationSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    country: formData.get("country") || "BR",
    locale: formData.get("locale") || "pt-BR",
    timezone: formData.get("timezone") || "America/Sao_Paulo",
    currency: formData.get("currency") || "BRL",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os dados." };
  if (!isSupabaseConfigured()) return { error: "Supabase ainda não está configurado neste ambiente." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Sua sessão expirou. Entre novamente para continuar." };

  const { error } = await supabase.rpc("create_organization", {
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
    p_country: parsed.data.country,
    p_locale: parsed.data.locale,
    p_timezone: parsed.data.timezone,
    p_currency: parsed.data.currency,
  });
  if (error) {
    if (error.code === "23505") return { error: "Este identificador já está em uso. Escolha outro." };
    return { error: "Não foi possível criar o espaço. Tente novamente ou contate o administrador." };
  }
  redirect("/app");
}

export async function suggestedSlug(name: string) {
  return toSlug(name);
}
