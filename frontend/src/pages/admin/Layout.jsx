import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, FolderKanban, Inbox, CalendarDays, Images, Settings, CreditCard, ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Ringkasan", icon: LayoutDashboard, end: true, testid: "admin-nav-overview" },
  { to: "/admin/membership", label: "Pembayaran Pro", icon: CreditCard, testid: "admin-nav-membership" },
  { to: "/admin/clients", label: "Klien", icon: Users, testid: "admin-nav-clients" },
  { to: "/admin/projects", label: "Proyek", icon: FolderKanban, testid: "admin-nav-projects" },
  { to: "/admin/revisions", label: "Revisi", icon: Inbox, testid: "admin-nav-revisions" },
  { to: "/admin/sessions", label: "Sesi", icon: CalendarDays, testid: "admin-nav-sessions" },
  { to: "/admin/portfolio", label: "Portofolio", icon: Images, testid: "admin-nav-portfolio" },
  { to: "/admin/settings", label: "Pengaturan", icon: Settings, testid: "admin-nav-settings" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#08090A] text-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-[#0D0E10] md:flex">
        <Link to="/" className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <LogoMark className="h-6 w-6 text-white" />
          <span className="font-display text-xl italic">ghlib</span>
          <ShieldCheck size={13} className="ml-auto text-amber-300" />
        </Link>
        <nav className="flex-1 space-y-1 px-3 py-6">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              data-testid={n.testid}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 border-l-2 px-4 py-3 font-meta text-[10px] transition-colors duration-200",
                  isActive ? "border-white text-white" : "border-transparent text-neutral-500 hover:text-white"
                )
              }
            >
              <n.icon size={15} />
              {n.label}
            </NavLink>
          ))}
          <Link to="/" data-testid="admin-nav-back-site" className="flex items-center gap-3 border-l-2 border-transparent px-4 py-3 font-meta text-[10px] text-neutral-500 transition-colors hover:text-white">
            <ArrowLeft size={15} /> Lihat Situs
          </Link>
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            {user?.picture ? (
              <img src={user.picture} alt="" className="h-9 w-9 rounded-full border border-white/20" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs">{user?.name?.[0]}</div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white">{user?.name}</p>
              <p className="truncate font-meta text-[8px] text-amber-300">ADMIN / STUDIO</p>
            </div>
            <button data-testid="admin-logout-button" onClick={logout} className="text-neutral-500 transition-colors hover:text-white">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 overflow-x-auto border-b border-white/10 bg-[#08090A]/90 px-4 backdrop-blur-xl md:hidden">
          <Link to="/" className="shrink-0"><LogoMark className="h-6 w-6 text-white" /></Link>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} data-testid={`mobile-${n.testid}`}
              className={({ isActive }) => cn("shrink-0 font-meta text-[9px]", isActive ? "text-white" : "text-neutral-500")}>
              {n.label}
            </NavLink>
          ))}
          <button data-testid="mobile-admin-logout" onClick={logout} className="ml-auto shrink-0 text-neutral-500"><LogOut size={16} /></button>
        </header>
        <main className="mx-auto max-w-[1300px] px-6 py-10 lg:px-10 lg:py-14">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
