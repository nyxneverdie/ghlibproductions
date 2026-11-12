import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get("/profile/me");
      setUser(data);
      return data;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async () => {
    const { data } = await api.post("/auth/sign-in/social", {
      provider: "google",
      callbackURL: `${window.location.origin}/login`,
      errorCallbackURL: `${window.location.origin}/login?error=oauth_failed`,
    });
    if (!data.url) throw new Error("Google login tidak tersedia.");
    window.location.assign(data.url);
  };

  const loginAdmin = async (email, password) => {
    await api.post("/auth/sign-in/email", { email, password });
    const currentUser = await checkAuth();
    if (!currentUser || currentUser.role !== "admin") {
      await api.post("/auth/sign-out");
      setUser(null);
      throw new Error("Akun ini tidak memiliki akses admin.");
    }
    navigate("/admin", { replace: true });
  };

  const logout = async () => {
    await api.post("/auth/sign-out");
    setUser(null);
    navigate("/");
  };

  return <AuthContext.Provider value={{ user, loading, login, loginAdmin, logout, checkAuth }}>{children}</AuthContext.Provider>;
}
