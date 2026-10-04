import { redirect } from "next/navigation";
import { AppShell } from "./app-shell";
import { getWorkspaceContext } from "@/lib/workspace";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email?.toLowerCase() === "zildahenderson9@gmail.com") redirect("/platform-admin");
  const context = await getWorkspaceContext();
  if (!context) redirect("/onboarding");
  return <AppShell context={context} title="Workspace">{children}</AppShell>;
}
