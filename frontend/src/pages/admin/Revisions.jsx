import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { PageHeader, StatusBadge, EmptyState } from "@/components/dash/Shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fmtDateTime } from "@/lib/ui";

export default function AdminRevisions() {
  const [revisions, setRevisions] = useState(null);
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState("");
  const [version, setVersion] = useState({ url: "", notes: "" });

  const load = () => api.get("/admin/revisions").then((r) => setRevisions(r.data.revisions));
  useEffect(() => { load().catch(() => setRevisions([])); }, []);

  const reply_ = async () => {
    if (!reply.trim()) return;
    await api.post(`/admin/revisions/${active.revision_id}/comments`, { body: reply });
    setReply("");
    toast.success("Balasan terkirim ke klien");
    await load();
    const fresh = await api.get("/admin/revisions");
    setActive(fresh.data.revisions.find((r) => r.revision_id === active.revision_id) || active);
  };

  const setStatus = async (status) => {
    await api.patch(`/admin/revisions/${active.revision_id}`, { status });
    await load();
    setActive({ ...active, status });
    toast.success(status === "resolved" ? "Revisi ditandai selesai" : "Status revisi diperbarui");
  };

  const uploadVersion = async () => {
    if (!version.url.trim()) return toast.error("Tempel URL versi baru");
    await api.post(`/admin/assets/${active.asset.asset_id}/versions`, version);
    toast.success("Versi baru terkirim — klien dinotifikasi");
    setVersion({ url: "", notes: "" });
    await load();
    setActive(null);
  };

  if (!revisions) return <div className="py-24 text-center font-meta text-xs text-neutral-600 animate-pulse">Memuat…</div>;

  return (
    <div data-testid="admin-revisions-page">
      <PageHeader index="WORKFLOW" title="Inbox Revisi" sub="Semua permintaan revisi dari klien, dalam satu halaman." />
      {revisions.length === 0 ? (
        <EmptyState title="Inbox bersih" hint="Permintaan revisi klien akan muncul di sini." />
      ) : (
        <div className="overflow-x-auto border border-white/10 bg-[#111316]">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-white/10">
                {["Klien", "Proyek", "Media", "Catatan Revisi", "Tanggal", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-4 font-meta text-[9px] font-normal text-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {revisions.map((r, i) => (
                <tr key={r.revision_id} data-testid={`admin-revision-row-${i}`} className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]">
                  <td className="px-5 py-4 text-sm text-white">{r.client_name}</td>
                  <td className="px-5 py-4 text-sm text-neutral-400">{r.project_title}</td>
                  <td className="px-5 py-4">
                    {r.asset && <img src={r.asset.url} alt="" className="h-10 w-10 border border-white/10 object-cover" />}
                  </td>
                  <td className="max-w-[260px] px-5 py-4"><p className="truncate text-sm text-neutral-300">{r.request_text}</p></td>
                  <td className="px-5 py-4 text-xs text-neutral-500">{fmtDateTime(r.created_at)}</td>
                  <td className="px-5 py-4"><StatusBadge status={r.status} kind="revision" /></td>
                  <td className="px-5 py-4">
                    <Button data-testid={`open-revision-${i}`} size="sm" variant="outline" onClick={() => setActive(r)}
                      className="h-8 rounded-none border-white/20 bg-transparent px-4 font-meta text-[8px] text-white hover:bg-white hover:text-black">Buka</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setActive(null)}>
          <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto border border-white/10 bg-[#111316] p-8" onClick={(e) => e.stopPropagation()} data-testid="revision-detail-dialog">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {active.asset && <img src={active.asset.url} alt="" className="h-16 w-16 border border-white/10 object-cover" />}
                <div>
                  <h3 className="font-display text-2xl italic text-white">{active.asset?.title}</h3>
                  <p className="mt-1 text-xs text-neutral-500">{active.client_name} · {active.project_title}</p>
                </div>
              </div>
              <StatusBadge status={active.status} kind="revision" />
            </div>

            {active.asset && active.annotation_x != null && <div className="relative mx-auto mt-5 w-fit max-w-full"><img src={active.asset.url} alt="Foto dengan titik revisi" className="max-h-80 max-w-full" /><span className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-amber-400" style={{ left: `${active.annotation_x * 100}%`, top: `${active.annotation_y * 100}%` }} /></div>}
            {active.asset && active.video_seconds != null && <div className="mt-5"><p className="mb-2 text-xs text-amber-300">Waktu revisi: {Math.floor(active.video_seconds / 60)}:{String(Math.floor(active.video_seconds % 60)).padStart(2, "0")}</p><video controls src={`${active.asset.url.split("#")[0]}#t=${Math.floor(active.video_seconds)}`} className="max-h-72 w-full" /></div>}
            <p className="mt-6 border-l-2 border-amber-300/60 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-neutral-200">{active.request_text}</p>

            <div className="mt-6 space-y-3">
              {active.comments.map((c, j) => (
                <div key={c.comment_id || j} className="flex gap-3">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${c.author_role === "admin" ? "bg-amber-300" : "bg-neutral-500"}`} />
                  <div>
                    <p className="text-sm text-neutral-200">{c.body}</p>
                    <p className="mt-1 font-meta text-[8px] text-neutral-600">{c.author_name} · {fmtDateTime(c.created_at)}</p>
                  </div>
                </div>
              ))}
              {active.comments.length === 0 && <p className="text-xs text-neutral-600">Belum ada balasan.</p>}
            </div>

            <div className="mt-6 flex gap-3">
              <Input data-testid="admin-reply-input" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Balas klien…"
                className="h-11 flex-1 rounded-none border-white/20 bg-[#08090A] text-sm" />
              <Button data-testid="admin-reply-send" onClick={reply_} className="h-11 rounded-none bg-white px-5 font-meta text-[9px] text-black hover:bg-neutral-200">Kirim</Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button data-testid="revision-mark-progress" variant="outline" onClick={() => setStatus("in_progress")} className="h-10 rounded-none border-white/20 bg-transparent px-4 font-meta text-[8px] text-white hover:bg-white hover:text-black">Tandai Diproses</Button>
              <Button data-testid="revision-mark-resolved" variant="outline" onClick={() => setStatus("resolved")} className="h-10 rounded-none border-white/20 bg-transparent px-4 font-meta text-[8px] text-white hover:bg-white hover:text-black">Tandai Selesai</Button>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="font-meta text-[9px] text-neutral-500">UNGGAH VERSI BARU</p>
              <div className="mt-4 space-y-4">
                <Input data-testid="new-version-url" value={version.url} onChange={(e) => setVersion({ ...version, url: e.target.value })} placeholder="URL hasil editan versi baru…" className="h-11 rounded-none border-white/20 bg-[#08090A] text-sm" />
                <Input data-testid="new-version-notes" value={version.notes} onChange={(e) => setVersion({ ...version, notes: e.target.value })} placeholder="Catatan versi (opsional)" className="h-11 rounded-none border-white/20 bg-[#08090A] text-sm" />
                <Button data-testid="upload-new-version-button" onClick={uploadVersion} className="h-10 w-full rounded-none bg-white font-meta text-[9px] text-black hover:bg-neutral-200">Kirim Versi Baru ke Klien</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
