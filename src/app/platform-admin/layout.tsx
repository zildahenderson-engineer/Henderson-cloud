import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { signOut } from "@/app/app/actions";
import { requirePlatformOwner } from "./access";

export const dynamic = "force-dynamic";

export default async function PlatformAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requirePlatformOwner();
  return <div className="app-shell">
    <aside className="sidebar">
      <Link href="/platform-admin" className="brand-lockup"><span className="brand-mark">HC</span><span>Henderson Cloud</span></Link>
      <div className="mt-7 rounded-lg border border-[#d7e7e0] bg-[#f1f8f4] px-3 py-3">
        <p className="flex items-center gap-2 text-[11px] font-bold text-[#145b52]"><ShieldCheck size={14} /> Platform Owner</p>
        <p className="mt-1 text-[10px] leading-4 text-slate-500">Controle global da plataforma</p>
      </div>
      <nav className="sidebar-nav" aria-label="Administração da plataforma">
        <p className="nav-label">Control plane</p>
        <Link href="/platform-admin" className="nav-link active"><ShieldCheck size={16} /><span>Visão geral</span></Link>
        <div className="mt-5 rounded-lg border border-[#f0e5ce] bg-[#fffbf2] px-3 py-3 text-[10px] leading-5 text-[#735629]">Ações administrativas são protegidas por autorização server-side e registradas em auditoria. O MFA permanece opcional nas configurações de segurança.</div>
      </nav>
      <div className="sidebar-foot"><Link href="/app" className="nav-link"><span>← Voltar ao workspace</span></Link><form action={signOut}><button className="nav-link w-full border-0 bg-transparent text-left" type="submit">Sair da conta</button></form></div>
    </aside>
    <div className="main-area"><header className="topbar"><div className="text-[13px] font-semibold text-slate-700">Administração da plataforma</div><span className="pill"><ShieldCheck size={12} /> Login por e-mail ativo</span></header><main className="content">{children}</main></div>
  </div>;
}
