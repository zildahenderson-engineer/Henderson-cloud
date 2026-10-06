"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";

export type OperationActionState = { ok: boolean; message: string };
const emptyText = z.string().trim().optional().or(z.literal(""));

const financeSchema = z.object({
  type: z.enum(["income", "expense"]),
  description: z.string().trim().min(2, "Informe uma descrição.").max(180),
  category: emptyText.pipe(z.string().max(80)),
  amount: z.coerce.number().positive("Informe um valor maior que zero.").max(999999999),
  due_date: z.string().date("Informe uma data válida.").optional().or(z.literal("")),
  status: z.enum(["pending", "paid", "canceled"]),
});

const projectSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do projeto.").max(160),
  description: emptyText.pipe(z.string().max(5000)),
  status: z.enum(["planning", "active", "on_hold", "done"]),
  start_date: z.string().date("Informe uma data válida.").optional().or(z.literal("")),
  due_date: z.string().date("Informe uma data válida.").optional().or(z.literal("")),
});

const documentSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do documento.").max(180),
  description: emptyText.pipe(z.string().max(5000)),
  content: emptyText.pipe(z.string().max(20000)),
  status: z.enum(["draft", "published", "archived"]),
});

function permissionMessage(error: { code?: string } | null, fallback: string) {
  return error?.code === "42501" ? "Você não tem permissão para esta ação." : fallback;
}

export async function createFinanceTransaction(_previous: OperationActionState, formData: FormData): Promise<OperationActionState> {
  const workspace = await getWorkspaceContext();
  if (!workspace) return { ok: false, message: "Sua sessão não está vinculada a uma organização." };
  const parsed = financeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Revise os dados financeiros." };
  const supabase = await createClient();
  const { error } = await supabase.from("finance_transactions").insert({
    organization_id: workspace.organizationId,
    created_by: workspace.userId,
    type: parsed.data.type,
    description: parsed.data.description,
    category: parsed.data.category || null,
    amount: parsed.data.amount,
    due_date: parsed.data.due_date || null,
    status: parsed.data.status,
  });
  if (error) return { ok: false, message: permissionMessage(error, "Não foi possível registrar o lançamento.") };
  revalidatePath("/app/financeiro");
  revalidatePath("/app");
  return { ok: true, message: "Lançamento financeiro registrado." };
}

export async function deleteFinanceTransaction(formData: FormData): Promise<OperationActionState> {
  const workspace = await getWorkspaceContext();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!workspace || !id.success) return { ok: false, message: "Não foi possível remover o lançamento." };
  const supabase = await createClient();
  const { error } = await supabase.from("finance_transactions").delete().eq("id", id.data).eq("organization_id", workspace.organizationId);
  if (error) return { ok: false, message: permissionMessage(error, "Não foi possível remover o lançamento.") };
  revalidatePath("/app/financeiro");
  revalidatePath("/app");
  return { ok: true, message: "Lançamento removido." };
}

export async function createProject(_previous: OperationActionState, formData: FormData): Promise<OperationActionState> {
  const workspace = await getWorkspaceContext();
  if (!workspace) return { ok: false, message: "Sua sessão não está vinculada a uma organização." };
  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Revise os dados do projeto." };
  const supabase = await createClient();
  const { error } = await supabase.from("projects").insert({
    organization_id: workspace.organizationId,
    created_by: workspace.userId,
    owner_user_id: workspace.userId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    status: parsed.data.status,
    start_date: parsed.data.start_date || null,
    due_date: parsed.data.due_date || null,
  });
  if (error) return { ok: false, message: permissionMessage(error, "Não foi possível criar o projeto.") };
  revalidatePath("/app/projetos");
  revalidatePath("/app");
  return { ok: true, message: "Projeto criado com sucesso." };
}

export async function deleteProject(formData: FormData): Promise<OperationActionState> {
  const workspace = await getWorkspaceContext();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!workspace || !id.success) return { ok: false, message: "Não foi possível remover o projeto." };
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id.data).eq("organization_id", workspace.organizationId);
  if (error) return { ok: false, message: permissionMessage(error, "Não foi possível remover o projeto.") };
  revalidatePath("/app/projetos");
  revalidatePath("/app");
  return { ok: true, message: "Projeto removido." };
}

export async function createDocument(_previous: OperationActionState, formData: FormData): Promise<OperationActionState> {
  const workspace = await getWorkspaceContext();
  if (!workspace) return { ok: false, message: "Sua sessão não está vinculada a uma organização." };
  const parsed = documentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Revise os dados do documento." };
  const supabase = await createClient();
  const { error } = await supabase.from("documents").insert({
    organization_id: workspace.organizationId,
    created_by: workspace.userId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    content: parsed.data.content || null,
    status: parsed.data.status,
  });
  if (error) return { ok: false, message: permissionMessage(error, "Não foi possível criar o documento.") };
  revalidatePath("/app/documentos");
  revalidatePath("/app");
  return { ok: true, message: "Documento criado com sucesso." };
}

export async function deleteDocument(formData: FormData): Promise<OperationActionState> {
  const workspace = await getWorkspaceContext();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!workspace || !id.success) return { ok: false, message: "Não foi possível remover o documento." };
  const supabase = await createClient();
  const { error } = await supabase.from("documents").delete().eq("id", id.data).eq("organization_id", workspace.organizationId);
  if (error) return { ok: false, message: permissionMessage(error, "Não foi possível remover o documento.") };
  revalidatePath("/app/documentos");
  revalidatePath("/app");
  return { ok: true, message: "Documento removido." };
}
