import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { LogoMark } from "@/components/Logo";

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const sessionId = window.location.hash.split("session_id=")[1]?.split("&")[0];
    if (!sessionId) {
      setError("Sesi tidak ditemukan");
      return;
    }
    (async () => {
      try {
        const { data } = await api.post("/auth/session", { session_id: sessionId });
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate(data.user.role === "admin" ? "/admin" : "/dashboard", { replace: true, state: { user: data.user } });
      } catch (e) {
        setError(e.response?.data?.detail || "Gagal masuk. Silakan coba lagi.");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    })();
  }, [navigate]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-[#08090A]">
      <LogoMark className="h-10 w-10 text-white animate-pulse" />
      {error ? (
        <div className="text-center" data-testid="auth-callback-error">
          <p className="text-sm text-red-400">{error}</p>
          <a href="/login" className="mt-3 inline-block font-meta text-xs text-neutral-400 underline">Kembali ke halaman masuk</a>
        </div>
      ) : (
        <p className="font-meta text-xs text-neutral-500">Menyiapkan sesi Anda…</p>
      )}
    </div>
  );
}
