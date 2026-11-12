import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { scrollToTarget } from "@/lib/lenis";

const LINKS = [
  { label: "Karya", href: "#karya" },
  { label: "Film", href: "#film" },
  { label: "Tentang", href: "#tentang" },
  { label: "Layanan", href: "#layanan" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const go = (href) => {
    setOpen(false);
    if (window.location.pathname !== "/") {
      navigate("/" + "#" + href.slice(1));
      setTimeout(() => scrollToTarget(href), 400);
    } else {
      scrollToTarget(href);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 lg:px-12">
        <Link to="/" data-testid="nav-logo" className="text-white">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-10 lg:flex">
          {LINKS.map((l) => (
            <button
              key={l.href}
              data-testid={`nav-link-${l.label.toLowerCase()}`}
              onClick={() => go(l.href)}
              className="font-meta text-[10px] text-neutral-400 transition-colors duration-300 hover:text-white"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/login"}
            data-testid="nav-portal-button"
            className="font-meta text-[10px] text-neutral-300 transition-colors duration-300 hover:text-white"
          >
            {user ? "Dashboard" : "Portal Klien"}
          </Link>
          <Link to="/admin/login" data-testid="nav-admin-login"
            className="font-meta text-[10px] text-neutral-300 transition-colors duration-300 hover:text-white">
            Login Admin
          </Link>
          <Link
            to="/book"
            data-testid="nav-booking-button"
            className="rounded-full bg-white px-5 py-2.5 font-meta text-[10px] text-black transition-transform duration-300 hover:scale-[1.04]"
          >
            Booking Sesi
          </Link>
        </div>

        <button className="text-white lg:hidden" data-testid="nav-menu-toggle" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 bg-[#08090A] lg:hidden"
          >
            <div className="flex flex-col gap-5 px-6 py-8">
              {LINKS.map((l) => (
                <button key={l.href} onClick={() => go(l.href)} className="font-display text-3xl text-left text-white">
                  {l.label}
                </button>
              ))}
              <div className="mt-4 flex gap-3">
                <Link to={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/login"} data-testid="nav-mobile-portal"
                  className="flex-1 border border-white/20 py-3 text-center font-meta text-[10px] text-white">
                  {user ? "Dashboard" : "Portal Klien"}
                </Link>
                <Link to="/admin/login" data-testid="nav-mobile-admin-login"
                  className="flex-1 border border-white/20 py-3 text-center font-meta text-[10px] text-white">
                  Login Admin
                </Link>
                <Link to="/book" data-testid="nav-mobile-booking"
                  className="flex-1 bg-white py-3 text-center font-meta text-[10px] text-black">
                  Booking
                </Link>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
