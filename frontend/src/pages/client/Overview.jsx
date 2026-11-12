import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { StatCard, StatusBadge, EmptyState } from "@/components/dash/Shared";
import { fmtDate, fmtDateTime } from "@/lib/ui";

export default function Overview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError(false);
    api.get("/me/overview")
      .then((r) => { if (active) setData(r.data); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [attempt]);

  if (error) return (
    <div role="alert" className="py-24 text-center text-sm text-neutral-400">
      <p>Ringkasan belum dapat dimuat. Periksa koneksi Anda dan coba lagi.</p>
      <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-4 underline text-white">Coba lagi</button>
    </div>
  );
  if (!data) return <div className="py-24 text-center font-meta text-xs text-neutral-600 animate-pulse">Memuat ringkasan…</div>;

  const awaiting = data.projects.filter((p) => p.status === "proofing");

  return (
    <div data-testid="client-overview">
      <p className="font-meta text-[9px] text-neutral-600">Ringkasan</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight text-white sm:text-5xl">
        Selamat datang <span className="italic text-neutral-400">kembali</span>
      </h1>

      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard testid="stat-active-projects" label="Proyek Aktif" value={data.stats.active_projects} />
        <StatCard testid="stat-galleries-awaiting" label="Galeri Menunggu Seleksi" value={data.stats.galleries_awaiting} />
        <StatCard testid="stat-revisions-open" label="Revisi Berjalan" value={data.stats.revisions_open} />
        <StatCard testid="stat-finals-available" label="Hasil Akhir" value={data.stats.finals_available} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="border border-white/10 bg-[#111316]">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <h2 className="font-meta text-[10px] text-neutral-400">Galeri Menunggu Aksi</h2>
            <Link to="/dashboard/projects" data-testid="overview-see-projects" className="font-meta text-[9px] text-neutral-500 hover:text-white">Semua Proyek →</Link>
          </div>
          <div className="divide-y divide-white/5">
            {awaiting.length === 0 && <div className="px-6 py-10"><EmptyState title="Tidak ada galeri" hint="Galeri proofing yang menunggu seleksi akan muncul di sini." /></div>}
            {awaiting.map((p) => (
              <Link key={p.project_id} to={`/dashboard/projects/${p.project_id}`} data-testid={`overview-gallery-${p.project_id}`}
                className="flex items-center justify-between px-6 py-5 transition-colors hover:bg-white/[0.03]">
                <div>
                  <p className="font-display text-lg italic text-white">{p.title}</p>
                  <p className="mt-1 text-xs text-neutral-500">Batas: {fmtDate(p.due_date)}</p>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))}
          </div>
        </section>

        <section className="border border-white/10 bg-[#111316]">
          <div className="border-b border-white/10 px-6 py-4">
            <h2 className="font-meta text-[10px] text-neutral-400">Notifikasi Terbaru</h2>
          </div>
          <div className="divide-y divide-white/5">
            {data.recent_notifications.length === 0 && <div className="px-6 py-10"><EmptyState title="Belum ada notifikasi" hint="Aktivitas proyek Anda akan muncul di sini." /></div>}
            {data.recent_notifications.map((n) => (
              <Link key={n.notification_id} to="/dashboard/notifications" data-testid={`overview-notification-${n.notification_id}`}
                className={`block px-6 py-5 transition-colors hover:bg-white/[0.03] ${!n.read_at ? "bg-white/[0.02]" : ""}`}>
                <p className="text-sm text-white">{n.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{n.body}</p>
                <p className="mt-2 font-meta text-[9px] text-neutral-600">{fmtDateTime(n.created_at)}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {data.upcoming_sessions.length > 0 && (
        <section className="mt-8 border border-white/10 bg-[#111316]">
          <div className="border-b border-white/10 px-6 py-4">
            <h2 className="font-meta text-[10px] text-neutral-400">Sesi Mendatang</h2>
          </div>
          <div className="divide-y divide-white/5">
            {data.upcoming_sessions.map((s) => (
              <div key={s.session_id} className="flex items-center justify-between px-6 py-5">
                <div>
                  <p className="text-sm text-white">{s.service_type} — {fmtDate(s.requested_date)}</p>
                  <p className="mt-1 text-xs text-neutral-500">{s.location || "Lokasi menyusul"}</p>
                </div>
                <StatusBadge status={s.status} kind="session" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
