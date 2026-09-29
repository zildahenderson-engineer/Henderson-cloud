import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PlatformOverview = {
  tenant_count: number;
  user_count: number;
  active_members: number;
  lead_count: number;
  audit_count: number;
  tenants: Array<{ id: string; name: string; slug: string; locale: string; currency: string; created_at: string; members: number; leads: number }>;
  recent_audit: Array<{ id: number; organization_id: string; action: string; resource_type: string; resource_id: string | null; occurred_at: string }>;
};

export async function requirePlatformOwner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: claim, error: claimError } = await supabase.rpc("claim_platform_owner");
  if (claimError || !claim) redirect("/login?error=platform_admin");
  const { data, error } = await supabase.rpc("platform_overview");
  if (error || !data) redirect("/login?error=platform_admin");
  return data as PlatformOverview;
}
