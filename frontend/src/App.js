import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";

const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Legal = lazy(() => import("@/pages/Legal"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const ClientLayout = lazy(() => import("@/pages/client/Layout"));
const Membership = lazy(() => import("@/pages/client/Membership"));
const AdminMembership = lazy(() => import("@/pages/admin/Membership"));
const ClientOverview = lazy(() => import("@/pages/client/Overview"));
const ClientProjects = lazy(() => import("@/pages/client/Projects"));
const ClientProjectDetail = lazy(() => import("@/pages/client/ProjectDetail"));
const ClientNotifications = lazy(() => import("@/pages/client/Notifications"));
const ClientBook = lazy(() => import("@/pages/client/BookSession"));
const AdminLayout = lazy(() => import("@/pages/admin/Layout"));
const AdminOverview = lazy(() => import("@/pages/admin/Overview"));
const AdminClients = lazy(() => import("@/pages/admin/Clients"));
const AdminProjects = lazy(() => import("@/pages/admin/Projects"));
const AdminProjectDetail = lazy(() => import("@/pages/admin/ProjectDetail"));
const AdminRevisions = lazy(() => import("@/pages/admin/Revisions"));
const AdminSessions = lazy(() => import("@/pages/admin/Sessions"));
const AdminPortfolio = lazy(() => import("@/pages/admin/Portofolio"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));

function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#08090A]">
      <div className="font-meta text-xs text-neutral-500 animate-pulse">Memuat…</div>
    </div>
  );
}

function AppRouter() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/kebijakan-privasi" element={<Legal type="privacy" />} />
        <Route path="/ketentuan-layanan" element={<Legal type="terms" />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/book" element={<ClientBook />} />

        <Route path="/dashboard" element={<ProtectedRoute><ClientLayout /></ProtectedRoute>}>
          <Route index element={<ClientOverview />} />
          <Route path="membership" element={<Membership />} />
          <Route path="projects" element={<ClientProjects />} />
          <Route path="projects/:projectId" element={<ClientProjectDetail />} />
          <Route path="notifications" element={<ClientNotifications />} />
          <Route path="book" element={<ClientBook />} />
        </Route>

        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminOverview />} />
          <Route path="membership" element={<AdminMembership />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="projects/:projectId" element={<AdminProjectDetail />} />
          <Route path="revisions" element={<AdminRevisions />} />
          <Route path="sessions" element={<AdminSessions />} />
          <Route path="portfolio" element={<AdminPortfolio />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-[#08090A] text-neutral-400">
          Terjadi kesalahan. Muat ulang halaman.
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
      <Toaster theme="dark" position="bottom-right" />
    </ErrorBoundary>
  );
}
