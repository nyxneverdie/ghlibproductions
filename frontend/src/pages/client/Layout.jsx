import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderKanban, Bell, CalendarPlus, Crown, ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Ringkasan", icon: LayoutDashboard, end: true, testid: "side-nav-overview" },
  { to: "/dashboard/membership", label: "Membership", icon: Crown, testid: "side-nav-membership" },
  { to: "/dashboard/projects", label: "Proyek Saya", icon: FolderKanban, testid: "side-nav-projects" },
  { to: "/dashboard/notifications", label: "Notifikasi", icon: Bell, testid: "side-nav-notifications" },
  { to: "/dashboard/book", label: "Booking Sesi", icon: CalendarPlus, testid: "side-nav-book" },
];

export default function ClientLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#08090A] text-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-[#0D0E10] md:flex">
        <Link to="/" className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <LogoMark className="h-6 w-6 text-white" />
          <span className="font-display text-xl italic">ghlib</span>
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
          <Link to="/" data-testid="side-nav-back-site" className="flex items-center gap-3 border-l-2 border-transparent px-4 py-3 font-meta text-[10px] text-neutral-500 transition-colors hover:text-white">
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
              <p className="truncate text-[10px] text-neutral-500">{user?.email}</p>
            </div>
            <button data-testid="client-logout-button" onClick={logout} className="text-neutral-500 transition-colors hover:text-white">
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
          <button data-testid="mobile-client-logout" onClick={logout} className="ml-auto shrink-0 text-neutral-500"><LogOut size={16} /></button>
        </header>
        <main className="mx-auto max-w-[1200px] px-6 py-10 lg:px-10 lg:py-14">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
