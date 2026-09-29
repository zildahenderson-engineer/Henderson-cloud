"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";

const leadSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do lead.").max(160),
  email: z.string().trim().email("Informe um e-mail válido.").max(320).optional().or(z.literal("")),
  company: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  source: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(5000).optional(),
});

export type LeadActionState = { ok: boolean; message: string };

export async function createLead(_previous: LeadActionState, formData: FormData): Promise<LeadActionState> {
  const workspace = await getWorkspaceContext();
  if (!workspace) return { ok: false, message: "Sua sessão não está vinculada a uma organização." };
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Revise os dados do lead." };

  const supabase = await createClient();
  const { error } = await supabase.from("crm_leads").insert({
    organization_id: workspace.organizationId,
    owner_user_id: workspace.userId,
    name: parsed.data.name,
    email: parsed.data.email || null,
    company: parsed.data.company || null,
    phone: parsed.data.phone || null,
    source: parsed.data.source || null,
    notes: parsed.data.notes || null,
  });
  if (error) return { ok: false, message: error.code === "42501" ? "Você não tem permissão para criar leads." : "Não foi possível criar o lead." };
  revalidatePath("/app/crm");
  revalidatePath("/app");
  return { ok: true, message: "Lead criado com sucesso." };
}

export async function deleteLead(formData: FormData): Promise<LeadActionState> {
  const workspace = await getWorkspaceContext();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!workspace || !id.success) return { ok: false, message: "Não foi possível remover este lead." };
  const supabase = await createClient();
  const { error } = await supabase.from("crm_leads").delete().eq("id", id.data).eq("organization_id", workspace.organizationId);
  if (error) return { ok: false, message: error.code === "42501" ? "Você não tem permissão para remover leads." : "Não foi possível remover o lead." };
  revalidatePath("/app/crm");
  revalidatePath("/app");
  return { ok: true, message: "Lead removido." };
}
