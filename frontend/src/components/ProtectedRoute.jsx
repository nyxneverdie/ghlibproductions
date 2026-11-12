import { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checked, setChecked] = useState(location.state?.user ? true : null);

  useEffect(() => {
    if (location.state?.user) {
      setChecked(true);
      return;
    }
    if (loading) return;
    setChecked(user ? true : false);
  }, [user, loading, location.state]);

  if (loading || checked === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#08090A]">
        <div className="font-meta text-xs text-neutral-500 animate-pulse">Memeriksa sesi…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}
