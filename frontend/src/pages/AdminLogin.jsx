import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";

export default function AdminLogin() {
  const { user, loading, loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user?.role === "admin") navigate("/admin", { replace: true });
  }, [loading, user, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await loginAdmin(email, password);
    } catch {
      setError("Tidak dapat masuk. Periksa email dan password, lalu coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08090A] px-6 py-16 text-white grain">
      <div className="w-full max-w-md">
        <Link to="/" aria-label="Kembali ke beranda"><Logo className="mb-14" /></Link>
        <p className="font-meta text-[10px] text-neutral-500">Portal Admin</p>
        <h1 className="mt-4 font-display text-4xl">Masuk sebagai <span className="italic">admin</span></h1>
        <p className="mt-5 text-sm text-neutral-400">Gunakan akun admin untuk mengelola studio.</p>
        <form onSubmit={submit} className="mt-10 space-y-5">
          <div><label htmlFor="admin-email" className="mb-2 block text-sm text-neutral-300">Email</label>
            <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full border border-white/20 bg-transparent px-4 text-white outline-none focus:border-white" /></div>
          <div><label htmlFor="admin-password" className="mb-2 block text-sm text-neutral-300">Password</label>
            <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full border border-white/20 bg-transparent px-4 text-white outline-none focus:border-white" /></div>
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={submitting} className="h-12 w-full bg-white text-sm text-black transition-opacity hover:opacity-80 disabled:opacity-50">{submitting ? "Memeriksa…" : "Masuk"}</button>
        </form>
        <Link to="/" className="mt-7 inline-block text-xs text-neutral-400 hover:text-white">← Kembali ke beranda</Link>
      </div>
    </main>
  );
}
