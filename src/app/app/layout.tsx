import { redirect } from "next/navigation";
import { AppShell } from "./app-shell";
import { getWorkspaceContext } from "@/lib/workspace";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!isSupabaseConfigured()) redirect("/login");
  const context = await getWorkspaceContext();
  if (!context) redirect("/onboarding");
  return <AppShell context={context} title="Workspace">{children}</AppShell>;
}
