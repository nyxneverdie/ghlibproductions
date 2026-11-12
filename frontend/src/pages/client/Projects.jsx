import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { StatusBadge, PageHeader, EmptyState } from "@/components/dash/Shared";
import { fmtDate, typeLabel } from "@/lib/ui";

export default function Projects() {
  const [projects, setProjects] = useState(null);

  useEffect(() => {
    api.get("/me/projects").then((r) => setProjects(r.data.projects)).catch(() => setProjects([]));
  }, []);

  if (!projects) return <div className="py-24 text-center font-meta text-xs text-neutral-600 animate-pulse">Memuat proyek…</div>;

  return (
    <div data-testid="client-projects-page">
      <PageHeader index="PORTAL KLIEN" title="Proyek Saya" sub="Semua sesi dan proyek yang dibagikan studio kepada Anda." />
      {projects.length === 0 ? (
        <EmptyState title="Belum ada proyek" hint="Proyek dibuat oleh studio dan akan muncul di sini setelah terhubung dengan akun Anda." />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {projects.map((p, i) => (
            <Link key={p.project_id} to={`/dashboard/projects/${p.project_id}`} data-testid={`project-card-${i}`}
              className="group border border-white/10 bg-[#111316] transition-colors duration-300 hover:border-white/30">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <span className="font-meta text-[9px] text-neutral-500">{typeLabel(p.project_type).toUpperCase()}</span>
                <StatusBadge status={p.status} />
              </div>
              <div className="px-6 py-6">
                <h2 className="font-display text-2xl italic tracking-tight text-white transition-transform duration-300 group-hover:translate-x-1">{p.title}</h2>
                <div className="mt-6 grid grid-cols-3 gap-4 text-xs text-neutral-500">
                  <div><p className="font-meta text-[9px] text-neutral-600">SESI</p><p className="mt-1 text-neutral-300">{fmtDate(p.shoot_date)}</p></div>
                  <div><p className="font-meta text-[9px] text-neutral-600">MEDIA</p><p className="mt-1 text-neutral-300">{p.photo_count} file</p></div>
                  <div><p className="font-meta text-[9px] text-neutral-600">BATAS</p><p className="mt-1 text-neutral-300">{fmtDate(p.due_date)}</p></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
