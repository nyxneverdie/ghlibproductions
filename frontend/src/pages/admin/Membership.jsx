import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { fmtDateTime } from "@/lib/ui";
import { PageHeader, EmptyState } from "@/components/dash/Shared";

const labels = { pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" };
export default function AdminMembership() {
  const [payments, setPayments] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [proofUrl, setProofUrl] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => { const res = await api.get("/admin/membership/payments"); setPayments(res.data.payments); setError(""); };
  useEffect(() => { load().catch(() => setError("Daftar pembayaran belum dapat dimuat.")); }, []);
  useEffect(() => {
    if (!selected) return undefined;
    let cancelled = false; let url;
    setProofUrl("");
    api.get(`/admin/membership/payments/${selected.payment_id}/proof`, { responseType: "blob" }).then((res) => {
      if (!cancelled) { url = URL.createObjectURL(res.data); setProofUrl(url); }
    }).catch(() => { if (!cancelled) toast.error("Bukti pembayaran tidak dapat dimuat."); });
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [selected]);
  const review = async (decision) => {
    if (decision === "reject" && !reason.trim()) return toast.error("Isi alasan penolakan terlebih dahulu.");
    setBusy(true);
    try {
      await api.post(`/admin/membership/payments/${selected.payment_id}/review`, { decision, reason });
      toast.success(decision === "approve" ? "Pembayaran disetujui dan Pro diaktifkan." : "Pembayaran ditolak.");
      setSelected(null); setReason(""); await load();
    } catch (err) { toast.error(err.response?.data?.detail || "Pembayaran belum dapat ditinjau."); }
    finally { setBusy(false); }
  };
  return <div data-testid="admin-membership-page">
    <PageHeader index="MEMBERSHIP / VERIFIKASI MANUAL" title="Pembayaran Pro" sub="Cocokkan bukti dengan transaksi QRIS sebelum menyetujui. Setiap persetujuan menambahkan 30 hari Pro.">
      <button onClick={() => load().catch(() => setError("Daftar pembayaran belum dapat dimuat."))} className="flex items-center gap-2 border border-white/15 px-4 py-3 text-xs text-neutral-300 hover:bg-white/5"><RefreshCw size={14} /> Muat ulang</button>
    </PageHeader>
    {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : !payments ? <p className="py-16 text-center text-xs text-neutral-500">Memuat pembayaran…</p> : payments.length === 0 ? <EmptyState title="Belum ada pembayaran" hint="Bukti yang dikirim klien akan muncul di sini." /> : <div className="overflow-x-auto border border-white/10"><table className="w-full min-w-[780px] text-left text-sm"><thead className="border-b border-white/10 bg-white/[0.03] text-xs text-neutral-500"><tr>{["Klien", "Dikirim", "Jumlah", "Status", "Aksi"].map((h) => <th key={h} className="p-5 font-normal">{h}</th>)}</tr></thead><tbody>{payments.map((payment) => <tr key={payment.payment_id} className="border-b border-white/5 last:border-0"><td className="p-5 text-white">{payment.name}<span className="mt-1 block text-xs text-neutral-500">{payment.email}</span></td><td className="p-5 text-neutral-400">{fmtDateTime(payment.submitted_at)}</td><td className="p-5 text-neutral-300">Rp30.000</td><td className="p-5 text-amber-200">{labels[payment.status]}</td><td className="p-5"><button onClick={() => { setSelected(payment); setReason(""); }} className="border border-white/20 px-4 py-2 text-xs text-white hover:bg-white/10">{payment.status === "pending" ? "Tinjau" : "Lihat"}</button></td></tr>)}</tbody></table></div>}
    {selected && <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-4" onClick={() => setSelected(null)}><div role="dialog" aria-modal="true" aria-labelledby="review-title" className="my-auto w-full max-w-2xl border border-white/15 bg-[#111316] p-6 sm:p-8" onClick={(e) => e.stopPropagation()}><div className="flex justify-between gap-4"><div><p className="font-meta text-[9px] text-amber-200">VERIFIKASI PEMBAYARAN</p><h2 id="review-title" className="mt-2 font-display text-3xl text-white">{selected.name}</h2><p className="mt-2 text-xs text-neutral-500">{selected.email} · {fmtDateTime(selected.submitted_at)}</p></div><button onClick={() => setSelected(null)} aria-label="Tutup" className="text-xl text-neutral-400">×</button></div><p className="mt-5 text-sm text-neutral-400">Pastikan transaksi Rp30.000 benar-benar diterima sebelum menyetujui bukti ini.</p>{proofUrl ? <a href={proofUrl} target="_blank" rel="noreferrer" className="mt-4 block"><img src={proofUrl} alt="Bukti pembayaran yang diunggah klien" className="max-h-[45vh] w-full object-contain" /><span className="mt-2 block text-xs text-neutral-500">Buka ukuran penuh ↗</span></a> : <p className="py-12 text-center text-xs text-neutral-500">Memuat bukti…</p>}{selected.status === "pending" ? <><label htmlFor="reason" className="mt-5 block text-xs text-neutral-400">Alasan penolakan (wajib jika menolak)</label><textarea id="reason" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 min-h-[80px] w-full border border-white/15 bg-black/30 p-3 text-sm text-white" /><div className="mt-4 flex flex-wrap justify-end gap-3"><button disabled={busy} onClick={() => review("reject")} className="border border-red-300/30 px-5 py-3 text-xs text-red-300 disabled:opacity-50">Tolak</button><button disabled={busy || !proofUrl} onClick={() => review("approve")} className="bg-amber-200 px-5 py-3 text-xs text-black disabled:opacity-50">{busy ? "Menyimpan…" : "Setujui & aktifkan Pro"}</button></div></> : <p className="mt-5 text-sm text-neutral-400">Status: {labels[selected.status]}{selected.rejection_reason ? ` — ${selected.rejection_reason}` : ""}</p>}</div></div>}
  </div>;
}
