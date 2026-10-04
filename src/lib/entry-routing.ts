import { createClient } from "@/lib/supabase/server";

const PLATFORM_OWNER_EMAIL = "zildahenderson9@gmail.com";

export async function getAuthenticatedEntryPath() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  if (user.email?.toLowerCase() === PLATFORM_OWNER_EMAIL) {
    return "/platform-admin";
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  return membership ? "/app" : "/onboarding";
}
