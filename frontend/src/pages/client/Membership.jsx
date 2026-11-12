import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Clock3, Crown, ShieldCheck, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { fmtDate, fmtDateTime } from "@/lib/ui";

const features = [
  ["Harga", "Gratis", "Rp30.000 / 30 hari"],
  ["Personal Cloud", "500 MB", "1 GB"],
  ["Login Google & dashboard privat", true, true],
  ["Booking foto & video", true, true],
  ["Galeri proyek, pilihan & favorit", true, true],
  ["Revisi foto unik per proyek", "25 foto", "100 foto"],
  ["Catatan revisi per foto", true, true],
  ["Anotasi foto", false, true],
  ["Perbandingan before / after", false, true],
  ["Review video dasar", true, true],
  ["Komentar video bertimestamp", false, true],
  ["Riwayat versi revisi", "2 versi terbaru*", "Semua versi tersedia*"],
  ["Unduh hasil final", true, true],
  ["Bulk download ZIP", false, true],
  ["Album pribadi", "Maks. 3", "Tidak dibatasi"],
  ["Link berbagi aktif", "1 link", "Maks. 20 link"],
  ["Password album", false, true],
  ["Tanggal kedaluwarsa link", "Terbatas", true],
  ["Statistik storage", "Dasar", "Lengkap"],
  ["Notifikasi in-app", true, true],
  ["Notifikasi email tambahan", "Terbatas", true],
  ["Dukungan", "Standar", "Prioritas"],
];
const statusLabels = { pending: "Menunggu verifikasi", approved: "Disetujui", rejected: "Ditolak" };

function FeatureValue({ value }) {
  if (typeof value === "boolean") return value ? <Check size={16} className="mx-auto text-amber-300" aria-label="Tersedia" /> : <X size={16} className="mx-auto text-neutral-600" aria-label="Tidak tersedia" />;
  return <span>{value}</span>;
}

export default function Membership() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const load = async () => { const res = await api.get("/membership"); setData(res.data); setError(""); };
  useEffect(() => { load().catch(() => setError("Status membership belum dapat dimuat.")); }, []);
  const pending = data?.payments?.find((p) => p.status === "pending");
  const submit = async (event) => {
    event.preventDefault();
    if (!file) return toast.error("Pilih bukti pembayaran terlebih dahulu.");
    if (file.size > 3 * 1024 * 1024) return toast.error("Ukuran bukti maksimal 3 MB.");
    setBusy(true);
    try {
      const form = new FormData(); form.append("proof", file);
      await api.post("/membership/payments", form);
      setFile(null); setOpen(false); await load();
      toast.success("Bukti terkirim. Admin akan memverifikasinya.");
    } catch (err) { toast.error(err.response?.data?.detail || "Bukti belum dapat dikirim."); }
    finally { setBusy(false); }
  };
  return (
    <div className="mx-auto max-w-6xl pb-12" data-testid="membership-page">
      <div className="flex flex-wrap items-center justify-between gap-5 border-b border-white/10 pb-8">
        <div><p className="font-meta text-[9px] tracking-[0.22em] text-amber-300/70">GHLIB / MEMBERSHIP</p>
          <h1 className="mt-3 font-display text-4xl text-white sm:text-5xl">Ruang untuk <span className="italic text-amber-200">cerita Anda.</span></h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-400">Pilih ruang dan pengalaman yang sesuai untuk setiap karya bersama kami.</p></div>
        <div className="border border-white/10 bg-white/[0.03] px-5 py-3 text-xs text-neutral-400">PAKET SAAT INI <span className="ml-3 text-amber-200">{data ? data.plan.toUpperCase() : "—"}</span>{data?.plan === "pro" && <span className="block pt-2">Aktif sampai {fmtDate(data.expires_at)}</span>}</div>
      </div>
      {error && <div role="alert" className="mt-6 text-sm text-red-300">{error} <button className="underline" onClick={() => load().catch(() => setError("Status membership belum dapat dimuat."))}>Coba lagi</button></div>}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="relative overflow-hidden border border-white/10 bg-[#111316] p-7 sm:p-9"><p className="font-meta text-[10px] tracking-widest text-neutral-500">01 / THE ESSENTIALS</p><h2 className="mt-6 font-display text-4xl text-white">Free</h2><p className="mt-3 text-sm text-neutral-400">Semua yang Anda butuhkan untuk memulai.</p><p className="mt-8 font-display text-4xl text-white">Rp0 <span className="font-sans text-xs text-neutral-500">/ selama akun aktif</span></p><div className="mt-8 space-y-3 text-sm text-neutral-400"><p>500 MB Personal Cloud</p><p>25 foto unik per proyek</p><p>Galeri privat & hasil final</p></div></section>
        <section className="relative overflow-hidden border border-amber-200/30 bg-gradient-to-br from-[#26231c] via-[#171713] to-[#101111] p-7 sm:p-9"><div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-amber-300/10 blur-3xl" /><div className="relative"><div className="flex items-center justify-between"><p className="font-meta text-[10px] tracking-widest text-amber-200/70">02 / THE FULL EXPERIENCE</p><Sparkles size={18} className="text-amber-200" /></div><h2 className="mt-6 font-display text-4xl text-amber-100">Pro <span className="text-xl italic text-amber-200/60">Monthly</span></h2><p className="mt-3 text-sm text-neutral-400">Lebih banyak ruang untuk berkarya.</p><p className="mt-8 font-display text-4xl text-white">Rp30.000 <span className="font-sans text-xs text-neutral-500">/ 30 hari</span></p><div className="mt-8 space-y-3 text-sm text-neutral-300"><p>1 GB Personal Cloud</p><p>100 foto unik per proyek</p><p>Alat review & berbagi lebih lengkap</p></div><button disabled={!data || !!pending} onClick={() => setOpen(true)} className="mt-8 flex w-full items-center justify-between bg-amber-200 px-5 py-4 text-sm font-medium text-black transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Menunggu verifikasi" : data?.plan === "pro" ? "Perpanjang Pro" : "Pilih Pro"}<ArrowUpRight size={18} /></button></div></section>
      </div>
      <div className="mt-5 border border-amber-200/15 bg-amber-200/[0.04] p-5 text-sm leading-6 text-neutral-400"><strong className="text-amber-100">Fitur dalam pengembangan.</strong> Perbandingan di bawah mengikuti rencana membership. Personal Cloud, album pribadi, anotasi, before/after, komentar video, dan bulk download masih dalam pengembangan. Perbandingan ini menunjukkan rencana paket; pembelian Pro belum membuka fitur-fitur tersebut.</div>
      <section className="mt-16"><div className="flex items-end justify-between gap-5"><div><p className="font-meta text-[9px] tracking-widest text-neutral-500">PAKET / PERBANDINGAN</p><h2 className="mt-3 font-display text-3xl text-white">Setiap detail, <span className="italic text-neutral-400">dibandingkan.</span></h2></div><Crown className="hidden text-amber-200/50 sm:block" /></div>
        <div className="mt-7 overflow-x-auto border border-white/10"><table className="w-full min-w-[580px] text-left text-sm"><thead><tr className="border-b border-white/10 bg-white/[0.03]"><th scope="col" className="p-5 font-normal text-neutral-500">Fitur</th><th scope="col" className="w-1/4 p-5 text-center font-normal text-neutral-400">Free</th><th scope="col" className="w-1/4 bg-amber-200/[0.04] p-5 text-center font-normal text-amber-200">Pro</th></tr></thead><tbody>{features.map(([name, free, pro]) => <tr key={name} className="border-b border-white/5 last:border-0"><th scope="row" className="p-5 font-normal text-neutral-300">{name}</th><td className="p-5 text-center text-xs text-neutral-400"><FeatureValue value={free} /></td><td className="bg-amber-200/[0.025] p-5 text-center text-xs text-neutral-200"><FeatureValue value={pro} /></td></tr>)}</tbody></table></div>
        <p className="mt-4 text-xs leading-6 text-neutral-500">* Riwayat revisi bergantung pada versi file yang masih tersimpan. Batas revisi menghitung foto unik per proyek; putaran revisi mengikuti kontrak. Kuota cloud berlaku untuk seluruh library, bukan per bulan. Album Pro tetap mengikuti batas 1 GB.</p></section>
      <section className="mt-14"><div className="flex items-center gap-3"><Clock3 size={16} className="text-amber-200" /><h2 className="font-display text-2xl text-white">Riwayat pembayaran</h2></div>{!data ? <p className="mt-5 text-sm text-neutral-500">{error ? "Tidak dapat memuat riwayat." : "Memuat…"}</p> : data.payments.length === 0 ? <p className="mt-5 text-sm text-neutral-500">Belum ada pembayaran.</p> : <div className="mt-5 divide-y divide-white/10 border border-white/10">{data.payments.map((payment) => <div key={payment.payment_id} className="flex flex-wrap justify-between gap-3 p-5 text-sm"><div><p className="text-white">Pro Monthly · Rp30.000</p><p className="mt-1 text-xs text-neutral-500">{fmtDateTime(payment.submitted_at)}</p>{payment.rejection_reason && <p className="mt-2 text-xs text-red-300">{payment.rejection_reason}</p>}</div><span className="text-xs text-amber-200">{statusLabels[payment.status]}</span></div>)}</div>}</section>
      {open && <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-4" onClick={() => setOpen(false)}><div role="dialog" aria-modal="true" aria-labelledby="payment-title" className="my-auto w-full max-w-lg border border-white/15 bg-[#111316] p-6 sm:p-8" onClick={(e) => e.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="font-meta text-[9px] text-amber-200">PRO MONTHLY / QRIS</p><h2 id="payment-title" className="mt-3 font-display text-3xl text-white">Selesaikan pembayaran</h2></div><button aria-label="Tutup" onClick={() => setOpen(false)}><X size={20} /></button></div><p className="mt-4 text-sm leading-6 text-neutral-400">Pindai QRIS, masukkan nominal <strong className="text-white">Rp30.000</strong>, lalu unggah bukti pembayaran. Pro aktif setelah admin memverifikasi pembayaran.</p><img src="/qris-membership.jpeg" alt="Kode QRIS ghlib.production untuk pembayaran" className="mx-auto mt-5 max-h-[38vh] max-w-full object-contain" /><form onSubmit={submit} className="mt-5"><label htmlFor="proof" className="flex cursor-pointer items-center gap-3 border border-dashed border-white/20 p-4 text-sm text-neutral-300"><Upload size={18} />{file ? file.name : "Pilih bukti pembayaran · JPG / PNG, maks. 3 MB"}</label><input id="proof" type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} /><button disabled={busy || !file} className="mt-4 w-full bg-amber-200 px-5 py-4 text-sm text-black disabled:opacity-50">{busy ? "Mengirim…" : "Kirim bukti pembayaran"}</button></form><p className="mt-4 flex items-start gap-2 text-xs leading-5 text-neutral-500"><ShieldCheck size={16} className="shrink-0" />Bukti hanya dapat dilihat oleh admin. Pembayaran ditinjau secara manual.</p></div></div>}
    </div>
  );
}
