import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Logo, LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROJECT_TYPES } from "@/lib/ui";

export default function BookSession() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const requestId = useRef(null);

  useEffect(() => {
    api.get("/public/home").then((r) => setServices(r.data.services || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      api.get("/profile/me").then((r) => {
        setName(r.data.name);
        setEmail(r.data.email);
      });
    }
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    if (!service) return toast.error("Pilih jenis layanan terlebih dahulu");
    setBusy(true);
    try {
      if (!requestId.current) requestId.current = window.crypto.randomUUID();
      const payload = { service_type: service, requested_date: date, requested_time: time, location, notes, request_id: requestId.current };
      if (user) {
        await api.post("/me/bookings", payload, { timeout: 25000 });
      } else {
        if (!name.trim() || !email.trim()) return toast.error("Isi nama dan email Anda");
        await api.post("/public/bookings", { ...payload, name, email, phone }, { timeout: 25000 });
      }
      requestId.current = null;
      toast.success("Permintaan sesi terkirim. Studio akan menghubungi Anda.");
      setService(""); setDate(""); setTime(""); setLocation(""); setNotes("");
    } catch (err) {
      toast.error(err.code === "ECONNABORTED" || !err.response ? "Status pengiriman belum dapat dipastikan. Tekan kirim lagi untuk memeriksa tanpa membuat booking ganda." : (err.response?.data?.detail || "Gagal mengirim permintaan"));
    } finally {
      setBusy(false);
    }
  };

  const field = "h-12 rounded-none border-white/20 bg-[#111316] text-white placeholder:text-neutral-600 focus-visible:ring-white/30";
  const label = "mb-2 block font-meta text-[9px] text-neutral-500";

  return (
    <div className="min-h-screen bg-[#08090A] text-white">
      {!user && (
        <header className="border-b border-white/10">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
            <Link to="/" data-testid="book-logo-link"><Logo /></Link>
            <Link to="/login" data-testid="book-login-link" className="font-meta text-[10px] text-neutral-400 hover:text-white">Portal Klien</Link>
          </div>
        </header>
      )}

      <div className="mx-auto max-w-4xl px-6 py-16 lg:py-24" data-testid="booking-page">
        <p className="font-meta text-[10px] text-neutral-500">Booking Sesi</p>
        <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl lg:text-6xl">
          Ceritakan <span className="italic text-neutral-400">momen Anda</span>
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-neutral-400">
          Isi formulir di bawah — studio akan meninjau, lalu menyetujui, menolak, atau mengusulkan
          jadwal alternatif. Status akan diperbarui di dashboard Anda {user ? "" : "setelah akun terhubung"}.
        </p>

        <form onSubmit={submit} data-testid="booking-form" className="mt-12 grid grid-cols-1 gap-6 border border-white/10 bg-[#0D0E10] p-8 md:grid-cols-2 md:p-10">
          {!user && (
            <>
              <div><label className={label}>NAMA LENGKAP</label>
                <Input data-testid="booking-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda" className={field} /></div>
              <div><label className={label}>EMAIL</label>
                <Input data-testid="booking-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@anda.com" className={field} /></div>
              <div className="md:col-span-2"><label className={label}>NOMOR WHATSAPP</label>
                <Input data-testid="booking-phone-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+62…" className={field} /></div>
            </>
          )}
          <div className="md:col-span-2">
            <label className={label}>JENIS LAYANAN</label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger data-testid="booking-service-select" className={`w-full ${field}`}>
                <SelectValue placeholder="Pilih layanan" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-white/10 bg-[#111316] text-white">
                {(services.length ? services.map((s) => s.name) : PROJECT_TYPES.map((t) => t.label)).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={label}>TANGGAL DIINGINKAN</label>
            <Input data-testid="booking-date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>WAKTU</label>
            <Input data-testid="booking-time-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} className={field} />
          </div>
          <div className="md:col-span-2">
            <label className={label}>LOKASI</label>
            <Input data-testid="booking-location-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Studio / alamat / outdoor" className={field} />
          </div>
          <div className="md:col-span-2">
            <label className={label}>KEBUTUHAN ANDA</label>
            <Textarea data-testid="booking-notes-input" value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Ceritakan konsep, jumlah orang, referensi, atau hal lain…" className="min-h-[110px] resize-none rounded-none border-white/20 bg-[#111316] text-white placeholder:text-neutral-600" />
          </div>
          <div className="md:col-span-2">
            <Button data-testid="booking-submit-button" type="submit" disabled={busy}
              className="h-14 w-full rounded-none bg-white font-meta text-[10px] text-black transition-transform duration-300 hover:scale-[1.01] hover:bg-neutral-200 md:w-auto md:px-16">
              {busy ? "Mengirim…" : "Kirim Permintaan Sesi"}
            </Button>
          </div>
        </form>

        {!user && (
          <p className="mt-8 text-center text-xs text-neutral-600">
            Sudah jadi klien? <Link to="/login" className="text-neutral-400 underline hover:text-white">Masuk ke portal</Link> untuk booking langsung dari dashboard.
          </p>
        )}
      </div>

      {user && (
        <div className="border-t border-white/10 py-8 text-center">
          <LogoMark className="mx-auto h-6 w-6 text-neutral-700" />
        </div>
      )}
    </div>
  );
}
