import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Search, Plus } from "lucide-react";
import api from "@/lib/api";
import { PageHeader, EmptyState } from "@/components/dash/Shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fmtDateTime } from "@/lib/ui";

export default function AdminClients() {
  const [clients, setClients] = useState(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });

  const load = () => api.get("/admin/clients").then((r) => setClients(r.data.clients));
  useEffect(() => { load().catch(() => setClients([])); }, []);

  const create = async () => {
    if (!form.name.trim() || !form.email.trim()) return toast.error("Nama dan email wajib diisi");
    try {
      await api.post("/admin/clients", form);
      toast.success("Klien ditambahkan");
      setOpen(false);
      setForm({ name: "", email: "", phone: "", notes: "" });
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal menambah klien");
    }
  };

  const filtered = (clients || []).filter((c) => (c.name + c.email).toLowerCase().includes(q.toLowerCase()));

  return (
    <div data-testid="admin-clients-page">
      <PageHeader index="MANAJEMEN" title="Klien" sub="Kelola daftar klien dan hubungkan akun Google mereka.">
        <Button data-testid="add-client-button" onClick={() => setOpen(true)} className="h-11 rounded-none bg-white px-6 font-meta text-[9px] text-black hover:bg-neutral-200">
          <Plus size={14} className="mr-2" /> Tambah Klien
        </Button>
      </PageHeader>

      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" />
        <Input data-testid="client-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau email…"
          className="h-11 rounded-none border-white/20 bg-[#111316] pl-10 text-sm text-white placeholder:text-neutral-600" />
      </div>

      {!clients ? (
        <div className="py-24 text-center font-meta text-xs text-neutral-600 animate-pulse">Memuat…</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Belum ada klien" hint="Tambahkan klien dengan nama dan email — bila email sudah terdaftar lewat Google, akunnya otomatis terhubung." />
      ) : (
        <div className="overflow-x-auto border border-white/10 bg-[#111316]">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-white/10">
                {["Nama", "Email", "Telepon", "Proyek", "Akun", "Aksi"].map((h) => (
                  <th key={h} className="px-5 py-4 font-meta text-[9px] font-normal text-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.client_id} data-testid={`client-row-${i}`} className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]">
                  <td className="px-5 py-4 text-sm text-white">{c.name}</td>
                  <td className="px-5 py-4 text-sm text-neutral-400">{c.email}</td>
                  <td className="px-5 py-4 text-sm text-neutral-400">{c.phone || "-"}</td>
                  <td className="px-5 py-4 text-sm text-neutral-300">{c.project_count}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full border px-3 py-1 font-meta text-[8px] ${c.registered ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/5 text-neutral-500"}`}>
                      {c.registered ? "TERHUBUNG" : "BELUM DAFTAR"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Button data-testid={`client-create-project-${i}`} size="sm" variant="outline"
                      onClick={() => navigate("/admin/projects", { state: { openNew: true, clientId: c.client_id } })}
                      className="h-8 rounded-none border-white/20 bg-transparent px-4 font-meta text-[8px] text-white hover:bg-white hover:text-black">
                      Buat Proyek
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md border border-white/10 bg-[#111316] p-8" onClick={(e) => e.stopPropagation()} data-testid="add-client-dialog">
            <h3 className="font-display text-2xl italic text-white">Klien baru</h3>
            <div className="mt-6 space-y-5">
              <div><p className="mb-2 font-meta text-[9px] text-neutral-500">NAMA</p>
                <Input data-testid="new-client-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-none border-white/20 bg-[#08090A] text-sm" /></div>
              <div><p className="mb-2 font-meta text-[9px] text-neutral-500">EMAIL</p>
                <Input data-testid="new-client-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 rounded-none border-white/20 bg-[#08090A] text-sm" /></div>
              <div><p className="mb-2 font-meta text-[9px] text-neutral-500">TELEPON</p>
                <Input data-testid="new-client-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11 rounded-none border-white/20 bg-[#08090A] text-sm" /></div>
              <div><p className="mb-2 font-meta text-[9px] text-neutral-500">CATATAN</p>
                <Textarea data-testid="new-client-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-[70px] resize-none rounded-none border-white/20 bg-[#08090A] text-sm" /></div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setOpen(false)} className="h-10 rounded-none border-white/20 bg-transparent px-5 font-meta text-[9px] text-neutral-300 hover:bg-white/10 hover:text-white">Batal</Button>
                <Button data-testid="save-client-button" onClick={create} className="h-10 rounded-none bg-white px-6 font-meta text-[9px] text-black hover:bg-neutral-200">Simpan</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
