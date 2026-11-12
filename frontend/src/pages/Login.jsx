import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState(() =>
    new URLSearchParams(window.location.search).has("error") ? "Gagal masuk dengan Google. Coba lagi." : ""
  );
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
  }, [user, loading, navigate]);

  const handleLogin = async () => {
    setLoginError("");
    setLoginLoading(true);
    try {
      await login();
    } catch (err) {
      setLoginError(err?.response?.data?.message || err?.response?.data?.detail || err?.message || "Gagal masuk. Coba lagi.");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen bg-[#08090A] text-white grain">
      <div className="relative hidden w-1/2 overflow-hidden border-r border-white/10 lg:block">
        <img
          src="https://images.unsplash.com/photo-1619213117400-cd7f8e40381f?crop=entropy&cs=srgb&fm=jpg&q=85"
          alt="Studio"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="font-display italic text-4xl leading-tight">"Setiap frame adalah<br />cerita yang menunggu."</p>
          <p className="mt-4 font-meta text-[10px] text-neutral-400">ghlibproduction — studio fotografi & film</p>
        </div>
      </div>

      <div className="flex w-full flex-col items-start justify-center px-8 sm:px-16 lg:w-1/2 lg:px-24">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <Logo className="mb-16" />
          <p className="font-meta text-[10px] text-neutral-500">Portal Klien</p>
          <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">
            Masuk ke ruang<br /><span className="italic">kerja Anda</span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-neutral-400">
            Akses galeri proofing, pilih foto, ajukan revisi, dan unduh hasil akhir —
            semua dalam satu dashboard pribadi.
          </p>

          <Button
            data-testid="google-login-button"
            onClick={handleLogin}
            disabled={loginLoading}
            variant="outline"
            className="mt-10 h-14 w-full max-w-md gap-3 rounded-none border-white/20 bg-transparent text-base text-white hover:bg-white hover:text-black transition-colors duration-300 disabled:opacity-50"
          >
            <GoogleIcon />
            {loginLoading ? "Menghubungkan…" : "Masuk dengan Google"}
          </Button>
          {loginError && (
            <p className="mt-3 text-xs text-red-400">{loginError}</p>
          )}
          <p className="mt-4 text-xs leading-relaxed text-neutral-500">
            Baca <Link to="/kebijakan-privasi" className="underline hover:text-white">Kebijakan Privasi</Link> dan <Link to="/ketentuan-layanan" className="underline hover:text-white">Ketentuan Layanan</Link> kami.
          </p>
          <p className="mt-6 text-xs leading-relaxed text-neutral-600">
            Belum punya akses? Akun klien dibuat oleh studio. Daftar dengan Google untuk
            menghubungkan akun Anda bila sudah diundang, atau ajukan booking tanpa akun dari{" "}
            <a href="/book" className="underline text-neutral-400 hover:text-white">halaman booking</a>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.6a4.8 4.8 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.6Z" fill="#4285F4" />
      <path d="M12 22.5c2.7 0 5-.9 6.6-2.5l-3.3-2.6c-.9.6-2 1-3.3 1a5.8 5.8 0 0 1-5.5-4H3.2v2.7A10 10 0 0 0 12 22.5Z" fill="#34A853" />
      <path d="M6.5 14.4a6 6 0 0 1 0-3.8V7.9H3.2a10 10 0 0 0 0 8.2l3.3-2.7Z" fill="#FBBC05" />
      <path d="M12 5.7c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.2 7.9l3.3 2.7a5.8 5.8 0 0 1 5.5-4Z" fill="#EA4335" />
    </svg>
  );
}
