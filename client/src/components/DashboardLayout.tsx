import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, FolderKanban, ShieldAlert, Workflow, FileLock2, Settings2, LogOut, Menu, RadioTower } from "lucide-react";
import { useLocation } from "wouter";

const items = [
  { label: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Research projects", path: "/projects", icon: FolderKanban },
  { label: "Findings", path: "/findings", icon: ShieldAlert },
  { label: "Workflows", path: "/workflows", icon: Workflow },
  { label: "Evidence vault", path: "/evidence", icon: FileLock2 },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const [location, setLocation] = useLocation();
  return <nav className="space-y-1">
    {items.map(item => {
      const active = location === item.path || (item.path !== "/" && location.startsWith(item.path));
      return <button key={item.path} onClick={() => { setLocation(item.path); onNavigate?.(); }} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 ${active ? "bg-amber-300/10 text-amber-200 shadow-[inset_2px_0_0_#e4ae51]" : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"}`}>
        <item.icon className={`h-4 w-4 ${active ? "text-amber-300" : "text-zinc-600 group-hover:text-zinc-300"}`} />{item.label}
      </button>;
    })}
  </nav>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, logout } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#080808] p-8 text-zinc-500">Initializing secure workspace…</div>;
  if (!user) return <div className="min-h-screen bg-[#080808] text-zinc-100 flex items-center justify-center p-6"><div className="max-w-md text-center"><div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10"><RadioTower className="h-7 w-7 text-amber-300" /></div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">MR.KIPLAY RESEARCH</p><h1 className="mb-3 text-4xl font-black tracking-tight">Enter the secure workspace.</h1><p className="mb-8 text-sm leading-6 text-zinc-500">Authenticated access is required to manage authorized research projects, findings, evidence, and audit history.</p><Button onClick={() => startLogin()} className="h-11 w-full bg-amber-300 text-black hover:bg-amber-200">Sign in securely</Button></div></div>;
  return <div className="min-h-screen bg-[#080808] text-zinc-100 lg:flex">
    <aside className="hidden w-64 shrink-0 border-r border-white/[0.06] bg-[#0b0b0b] p-5 lg:block"><Brand /><div className="mt-10"><p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600">Workspace</p><Nav /></div><div className="mt-10 rounded-2xl border border-amber-300/10 bg-amber-300/[0.03] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/70">Research mode</p><p className="mt-2 text-xs leading-5 text-zinc-500">Authorized observation only. Every action is recorded.</p></div><div className="mt-auto pt-24"><UserMenu user={user} logout={logout} /></div></aside>
    <div className="min-w-0 flex-1"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#080808]/85 px-4 backdrop-blur-xl lg:px-8"><div className="flex items-center gap-3"><Sheet><SheetTrigger asChild><Button variant="ghost" size="icon" className="text-zinc-400 lg:hidden"><Menu /></Button></SheetTrigger><SheetContent side="left" className="w-72 border-white/[0.06] bg-[#0b0b0b] text-zinc-100"><Brand /><div className="mt-10"><p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600">Workspace</p><Nav /></div></SheetContent></Sheet><div className="lg:hidden"><Brand compact /></div><div className="hidden items-center gap-2 text-xs text-zinc-600 lg:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" /> Secure session / Audit enabled</div></div><div className="flex items-center gap-4"><div className="hidden text-right sm:block"><p className="text-xs font-semibold text-zinc-300">{user.name || "Researcher"}</p><p className="text-[10px] uppercase tracking-widest text-zinc-600">{user.role}</p></div><Avatar className="h-9 w-9 border border-amber-300/20"><AvatarFallback className="bg-amber-300/10 text-xs text-amber-200">{(user.name || "R").charAt(0).toUpperCase()}</AvatarFallback></Avatar></div></header><main className="p-4 sm:p-6 lg:p-8">{children}</main></div>
  </div>;
}
function Brand({ compact = false }: { compact?: boolean }) { return <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-200 to-amber-600 text-sm font-black text-black shadow-[0_0_24px_rgba(228,174,81,.2)]">MK</div>{!compact && <div><p className="text-sm font-black tracking-[0.16em] text-zinc-100">MR.KIPLAY</p><p className="text-[9px] uppercase tracking-[0.26em] text-zinc-600">Research platform</p></div>}</div>; }
function UserMenu({ user, logout }: { user: { name?: string | null; email?: string | null }; logout: () => void }) { return <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4"><div className="min-w-0"><p className="truncate text-xs font-medium text-zinc-300">{user.name || "Researcher"}</p><p className="truncate text-[10px] text-zinc-600">{user.email}</p></div><button onClick={logout} className="text-zinc-600 transition hover:text-red-300" title="Sign out"><LogOut className="h-4 w-4" /></button></div>; }
