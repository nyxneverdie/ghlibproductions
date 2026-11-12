import { useEffect, useState } from "react";
import api from "@/lib/api";
import { StatCard, EmptyState } from "@/components/dash/Shared";
import { fmtDateTime } from "@/lib/ui";

export default function AdminOverview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) return <div className="py-24 text-center font-meta text-xs text-neutral-600 animate-pulse">Memuat statistik…</div>;

  return (
    <div data-testid="admin-overview">
      <p className="font-meta text-[9px] text-neutral-600">Dasbor Studio</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight text-white sm:text-5xl">Ringkasan <span className="italic text-neutral-400">studio</span></h1>

      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard testid="admin-stat-clients" label="Total Klien" value={stats.total_clients} />
        <StatCard testid="admin-stat-active" label="Proyek Aktif" value={stats.active_projects} />
        <StatCard testid="admin-stat-sessions" label="Permintaan Sesi Baru" value={stats.pending_sessions} />
        <StatCard testid="admin-stat-galleries" label="Galeri Menunggu Seleksi" value={stats.galleries_awaiting_selection} />
        <StatCard testid="admin-stat-revisions" label="Revisi Belum Selesai" value={stats.open_revisions} />
        <StatCard testid="admin-stat-approvals" label="Menunggu Persetujuan" value={stats.deliverables_awaiting_approval} />
        <StatCard testid="admin-stat-completed" label="Proyek Selesai" value={stats.completed_projects} />
      </div>

      <section className="mt-8 border border-white/10 bg-[#111316]">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="font-meta text-[10px] text-neutral-400">Aktivitas Terbaru</h2>
        </div>
        {stats.recent_activity.length === 0 ? (
          <div className="px-6 py-10"><EmptyState title="Belum ada aktivitas" hint="Setiap tindakan penting akan tercatat di sini." /></div>
        ) : (
          <div className="divide-y divide-white/5">
            {stats.recent_activity.map((l, i) => (
              <div key={l.log_id || i} data-testid={`admin-activity-${i}`} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm text-neutral-200">{l.action.replace(/_/g, " ")}{l.metadata?.title ? ` — ${l.metadata.title}` : ""}</p>
                  <p className="mt-1 text-xs text-neutral-600">oleh {l.actor_name}</p>
                </div>
                <span className="font-meta text-[9px] text-neutral-600">{fmtDateTime(l.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
