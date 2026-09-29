"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Activity, Building2, BriefcaseBusiness, ChevronDown, ClipboardList, LayoutDashboard, LockKeyhole, LogOut, Menu, ShieldCheck, Users, X } from "lucide-react";
import { signOut } from "./actions";
import type { WorkspaceContext } from "@/lib/workspace";

const primaryLinks = [
  { href: "/app", label: "Visão geral", icon: LayoutDashboard },
  { href: "/app/organization", label: "Organização", icon: Building2 },
  { href: "/app/team", label: "Equipe e acessos", icon: Users },
  { href: "/app/crm", label: "CRM e vendas", icon: BriefcaseBusiness },
  { href: "/app/security", label: "Segurança", icon: LockKeyhole },
  { href: "/app/audit", label: "Auditoria", icon: ClipboardList },
];
const upcoming = ["Financeiro", "Projetos", "Documentos", "Automações", "AI Hub"];

function Sidebar({ context, onNavigate }: { context: WorkspaceContext; onNavigate?: () => void }) {
  const pathname = usePathname();
  return <aside className="sidebar">
    <Link href="/app" className="brand-lockup" onClick={onNavigate}><span className="brand-mark">HC</span><span>Henderson Cloud</span></Link>
    <div className="mt-7 rounded-lg border border-[#edf0ef] bg-[#fafcfc] px-3 py-2.5">
      <p className="truncate text-[11px] font-semibold text-slate-700">{context.organizationName}</p>
      <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400"><span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />{context.roleName}</p>
    </div>
    <nav className="sidebar-nav" aria-label="Navegação principal">
      <p className="nav-label">Workspace</p>
      {primaryLinks.filter(({ href }) => href !== "/app/audit" || ["owner", "admin", "manager"].includes(context.roleCode)).map(({ href, label, icon: Icon }) => {
        const active = href === "/app" ? pathname === href : pathname.startsWith(href);
        return <Link key={href} href={href} className={`nav-link ${active ? "active" : ""}`} onClick={onNavigate}><Icon size={16} strokeWidth={1.8} /><span>{label}</span></Link>;
      })}
      <p className="nav-label mt-6">Em construção</p>
      {upcoming.map((label) => <div key={label} className="flex min-h-[38px] items-center justify-between px-[11px] text-[12px] text-slate-400"><span>{label}</span><span className="text-[9px] font-medium uppercase tracking-wide">Fase 2+</span></div>)}
    </nav>
    <div className="sidebar-foot">
      {context.email.toLowerCase() === "zildahenderson9@gmail.com" && <Link href="/platform-admin" className="nav-link"><ShieldCheck size={15} /><span>Administração Henderson Cloud</span></Link>}
      <Link href="/app/organization" className="nav-link"><Activity size={15} /><span>Configurações</span></Link>
      <form action={signOut}><button className="nav-link w-full border-0 bg-transparent text-left" type="submit"><LogOut size={15} /><span>Sair da conta</span></button></form>
    </div>
  </aside>;
}

export function AppShell({ context, children, title }: { context: WorkspaceContext; children: React.ReactNode; title: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="app-shell">
    <Sidebar context={context} />
    {menuOpen && <div className="fixed inset-0 z-50 bg-slate-950/30 md:hidden" onClick={() => setMenuOpen(false)}>
      <div className="h-full w-[min(300px,85vw)] bg-white shadow-xl" onClick={(e) => e.stopPropagation()}><div className="flex justify-end p-3"><button className="secondary-button" type="button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}><X size={16} /></button></div><div className="mobile-sidebar"><Sidebar context={context} onNavigate={() => setMenuOpen(false)} /></div></div>
    </div>}
    <div className="main-area">
      <header className="topbar">
        <div className="flex min-w-0 items-center gap-3"><button className="mobile-menu secondary-button !h-9 !min-h-0 !w-9 !p-0" type="button" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}><Menu size={17} /></button><div className="truncate text-[13px] font-semibold text-slate-700">{title}</div></div>
        <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-[11px] font-semibold text-slate-700">{context.displayName}</p><p className="mt-0.5 text-[10px] text-slate-400">{context.email}</p></div><div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8f1ed] text-[12px] font-bold text-[#286050]">{context.displayName.slice(0, 1).toUpperCase()}</div><ChevronDown size={14} className="text-slate-400" /></div>
      </header>
      <main className="content">{children}</main>
    </div>
  </div>;
}
