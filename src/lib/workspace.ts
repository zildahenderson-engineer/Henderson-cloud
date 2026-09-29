import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type WorkspaceContext = {
  userId: string;
  email: string;
  displayName: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  locale: string;
  currency: string;
  timezone: string;
  memberId: string;
  roleName: string;
  roleCode: string;
};

export async function getWorkspaceContext(): Promise<WorkspaceContext | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data: membership, error: memberError } = await supabase
    .from("organization_members")
    .select("id, organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (memberError || !membership) return null;

  const [{ data: organization }, { data: profile }, { data: memberRole }] = await Promise.all([
    supabase.from("organizations").select("id, name, slug, locale, currency, timezone").eq("id", membership.organization_id).maybeSingle(),
    supabase.from("user_profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
    supabase.from("member_roles").select("role_id").eq("member_id", membership.id).limit(1).maybeSingle(),
  ]);
  if (!organization) return null;

  let roleName = "Membro";
  let roleCode = "member";
  if (memberRole?.role_id) {
    const { data: role } = await supabase.from("roles").select("name, code").eq("id", memberRole.role_id).maybeSingle();
    if (role) { roleName = role.name; roleCode = role.code; }
  }
  return {
    userId: user.id,
    email: user.email ?? "",
    displayName: profile?.display_name?.trim() || user.email?.split("@")[0] || "Usuário",
    organizationId: organization.id,
    organizationName: organization.name,
    organizationSlug: organization.slug,
    locale: organization.locale,
    currency: organization.currency,
    timezone: organization.timezone,
    memberId: membership.id,
    roleName,
    roleCode,
  };
}

export async function requireWorkspace() {
  const workspace = await getWorkspaceContext();
  if (!workspace) redirect("/onboarding");
  return workspace;
}
