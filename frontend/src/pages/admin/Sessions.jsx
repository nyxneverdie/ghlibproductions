import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { PageHeader, StatusBadge, EmptyState } from "@/components/dash/Shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fmtDate, fmtDateTime } from "@/lib/ui";

export default function AdminSessions() {
  const [sessions, setSessions] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [resched, setResched] = useState(null);
  const [newDate, setNewDate] = useState("");

  const load = () => api.get("/admin/sessions", { timeout: 25000 }).then((r) => { setSessions(r.data.sessions); setLoadError(false); });
  useEffect(() => { load().catch(() => setLoadError(true)); }, []);

  const act = async (id, status, proposed_date = "") => {
    try {
      await api.patch(`/admin/sessions/${id}`, { status, proposed_date });
      toast.success("Status sesi diperbarui");
      setResched(null);
      await load();
    } catch (e) {
      toast.error("Gagal memperbarui sesi");
    }
  };

  const convert = async (id) => {
    try {
      await api.post(`/admin/sessions/${id}/convert`);
      toast.success("Sesi disetujui & dikonversi menjadi proyek");
      await load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal konversi");
    }
  };

  if (loadError && !sessions) return <div role="alert" className="py-24 text-center text-sm text-neutral-400">Sesi belum dapat dimuat. <button onClick={() => { setLoadError(false); load().catch(() => setLoadError(true)); }} className="text-white underline">Coba lagi</button></div>;
  if (!sessions) return <div className="py-24 text-center font-meta text-xs text-neutral-600 animate-pulse">Memuat…</div>;

  return (
    <div data-testid="admin-sessions-page">
      <PageHeader index="WORKFLOW" title="Sesi &amp; Jadwal" sub="Tinjau permintaan sesi: setujui, tolak, atau usulkan jadwal baru." />
      {sessions.length === 0 ? (
        <EmptyState title="Belum ada permintaan sesi" hint="Permintaan dari halaman booking akan muncul di sini." />
      ) : (
        <div className="overflow-x-auto border border-white/10 bg-[#111316]">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-white/10">
                {["Nama", "Kontak", "Layanan", "Tanggal", "Lokasi", "Status", "Aksi"].map((h) => (
                  <th key={h} className="px-5 py-4 font-meta text-[9px] font-normal text-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={s.session_id} data-testid={`session-row-${i}`} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-5 py-4"><span className="text-sm text-white">{s.name}</span><p className="mt-1 text-[10px] text-neutral-600">{fmtDateTime(s.created_at)}</p></td>
                  <td className="px-5 py-4 text-sm text-neutral-400">{s.email}{s.phone ? <span className="block text-xs text-neutral-600">{s.phone}</span> : null}</td>
                  <td className="px-5 py-4 text-sm text-neutral-300">{s.service_type}</td>
                  <td className="px-5 py-4 text-sm text-neutral-300">{fmtDate(s.requested_date)}{s.requested_time ? <span className="block text-xs text-neutral-600">{s.requested_time}</span> : null}</td>
                  <td className="px-5 py-4 text-sm text-neutral-400">{s.location || "-"}</td>
                  <td className="px-5 py-4"><StatusBadge status={s.status} kind="session" /></td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {s.status === "pending" && (
                        <>
                          <Button data-testid={`session-approve-${i}`} size="sm" onClick={() => act(s.session_id, "approved")} className="h-8 rounded-none bg-white px-3 font-meta text-[8px] text-black hover:bg-neutral-200">Setujui</Button>
                          <Button data-testid={`session-reject-${i}`} size="sm" variant="outline" onClick={() => act(s.session_id, "rejected")} className="h-8 rounded-none border-white/20 bg-transparent px-3 font-meta text-[8px] text-neutral-300 hover:bg-white/10 hover:text-white">Tolak</Button>
                          <Button data-testid={`session-resched-${i}`} size="sm" variant="outline" onClick={() => { setResched(s); setNewDate(s.requested_date || ""); }} className="h-8 rounded-none border-white/20 bg-transparent px-3 font-meta text-[8px] text-neutral-300 hover:bg-white/10 hover:text-white">Tawarkan Tgl</Button>
                        </>
                      )}
                      {s.status === "approved" && (
                        <Button data-testid={`session-convert-${i}`} size="sm" variant="outline" onClick={() => convert(s.session_id)} className="h-8 rounded-none border-amber-300/40 bg-transparent px-3 font-meta text-[8px] text-amber-300 hover:bg-amber-300 hover:text-black">Jadikan Proyek</Button>
                      )}
                      {s.status === "rejected" && (
                        <Button data-testid={`session-reopen-${i}`} size="sm" variant="outline" onClick={() => act(s.session_id, "pending")} className="h-8 rounded-none border-white/20 bg-transparent px-3 font-meta text-[8px] text-neutral-400 hover:bg-white/10 hover:text-white">Buka Ulang</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resched && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setResched(null)}>
          <div className="w-full max-w-sm border border-white/10 bg-[#111316] p-8" onClick={(e) => e.stopPropagation()} data-testid="reschedule-dialog">
            <h3 className="font-display text-2xl italic text-white">Usulkan jadwal baru</h3>
            <p className="mt-2 text-xs text-neutral-500">{resched.name} — {resched.service_type}</p>
            <p className="mb-4 mt-6 font-meta text-[9px] text-neutral-500">TANGGAL PENGGANTI</p>
            <Input data-testid="reschedule-date-input" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-11 rounded-none border-white/20 bg-[#08090A] text-sm" />
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setResched(null)} className="h-10 rounded-none border-white/20 bg-transparent px-5 font-meta text-[9px] text-neutral-300 hover:bg-white/10 hover:text-white">Batal</Button>
              <Button data-testid="reschedule-confirm-button" onClick={() => act(resched.session_id, "rescheduled", newDate)} className="h-10 rounded-none bg-white px-6 font-meta text-[9px] text-black hover:bg-neutral-200">Kirim Penawaran</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
