import { redirect } from "next/navigation";
import { getAuthenticatedEntryPath } from "@/lib/entry-routing";

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string; error_code?: string }> }) {
  const params = await searchParams;
  if (params.error === "access_denied" || params.error_code === "otp_expired") {
    redirect("/login?error=confirmation_expired");
  }
  redirect((await getAuthenticatedEntryPath()) ?? "/login");
}
