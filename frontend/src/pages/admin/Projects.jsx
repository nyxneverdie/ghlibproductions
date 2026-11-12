import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import api from "@/lib/api";
import { PageHeader, StatusBadge, EmptyState } from "@/components/dash/Shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtDate, typeLabel, PROJECT_TYPES, STATUS_PROJECT } from "@/lib/ui";

const EMPTY = { title: "", client_id: "", project_type: "portrait", description: "", selection_limit: 20, shoot_date: "", due_date: "" };

export default function AdminProjects() {
  const [projects, setProjects] = useState(null);
  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const navigate = useNavigate();
  const location = useLocation();

  const load = () => api.get("/admin/projects").then((r) => setProjects(r.data.projects));
  useEffect(() => { load().catch(() => setProjects([])); }, []);

  useEffect(() => {
    api.get("/admin/clients").then((r) => setClients(r.data.clients));
    if (location.state?.openNew) {
      setForm({ ...EMPTY, client_id: location.state.clientId || "" });
      setOpen(true);
      navigate("/admin/projects", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const create = async () => {
    if (!form.title.trim() || !form.client_id) return toast.error("Judul dan klien wajib diisi");
    try {
      await api.post("/admin/projects", { ...form, selection_limit: Number(form.selection_limit) || 0 });
      toast.success("Proyek dibuat");
      setOpen(false);
      setForm(EMPTY);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal membuat proyek");
    }
  };

  return (
    <div data-testid="admin-projects-page">
      <PageHeader index="MANAJEMEN" title="Proyek" sub="Buat proyek per klien, atur kuota seleksi, dan kelola galeri.">
        <Button data-testid="add-project-button" onClick={() => setOpen(true)} className="h-11 rounded-none bg-white px-6 font-meta text-[9px] text-black hover:bg-neutral-200">
          <Plus size={14} className="mr-2" /> Proyek Baru
        </Button>
      </PageHeader>

      {!projects ? (
        <div className="py-24 text-center font-meta text-xs text-neutral-600 animate-pulse">Memuat…</div>
      ) : projects.length === 0 ? (
        <EmptyState title="Belum ada proyek" hint="Buat proyek untuk klien, lalu unggah media dan publikasikan galeri proofing." />
      ) : (
        <div className="overflow-x-auto border border-white/10 bg-[#111316]">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-white/10">
                {["Proyek", "Klien", "Jenis", "Sesi", "Media", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-4 font-meta text-[9px] font-normal text-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p, i) => (
                <tr key={p.project_id} data-testid={`admin-project-row-${i}`}
                  className="cursor-pointer border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]" onClick={() => navigate(`/admin/projects/${p.project_id}`)}>
                  <td className="px-5 py-4"><span className="font-display text-lg italic text-white">{p.title}</span></td>
                  <td className="px-5 py-4 text-sm text-neutral-400">{p.client_name}</td>
                  <td className="px-5 py-4 text-sm text-neutral-400">{typeLabel(p.project_type)}</td>
                  <td className="px-5 py-4 text-sm text-neutral-400">{fmtDate(p.shoot_date)}</td>
                  <td className="px-5 py-4 text-sm text-neutral-300">{p.asset_count}</td>
                  <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-4 font-meta text-[9px] text-neutral-500">BUKA →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="my-8 w-full max-w-lg border border-white/10 bg-[#111316] p-8" onClick={(e) => e.stopPropagation()} data-testid="new-project-dialog">
            <h3 className="font-display text-2xl italic text-white">Proyek baru</h3>
            <div className="mt-6 grid grid-cols-2 gap-5">
              <div className="col-span-2"><p className="mb-2 font-meta text-[9px] text-neutral-500">JUDUL PROYEK</p>
                <Input data-testid="new-project-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-11 rounded-none border-white/20 bg-[#08090A] text-sm" /></div>
              <div className="col-span-2"><p className="mb-2 font-meta text-[9px] text-neutral-500">KLIEN</p>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger data-testid="new-project-client" className="w-full rounded-none border-white/20 bg-[#08090A] text-sm text-white"><SelectValue placeholder="Pilih klien" /></SelectTrigger>
                  <SelectContent className="rounded-none border-white/10 bg-[#111316] text-white">
                    {clients.map((c) => <SelectItem key={c.client_id} value={c.client_id}>{c.name} — {c.email}</SelectItem>)}
                  </SelectContent>
                </Select></div>
              <div className="col-span-2"><p className="mb-2 font-meta text-[9px] text-neutral-500">JENIS LAYANAN</p>
                <Select value={form.project_type} onValueChange={(v) => setForm({ ...form, project_type: v })}>
                  <SelectTrigger data-testid="new-project-type" className="w-full rounded-none border-white/20 bg-[#08090A] text-sm text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-none border-white/10 bg-[#111316] text-white">
                    {PROJECT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select></div>
              <div><p className="mb-2 font-meta text-[9px] text-neutral-500">TANGGAL SESI</p>
                <Input data-testid="new-project-shoot-date" type="date" value={form.shoot_date} onChange={(e) => setForm({ ...form, shoot_date: e.target.value })} className="h-11 rounded-none border-white/20 bg-[#08090A] text-sm" /></div>
              <div><p className="mb-2 font-meta text-[9px] text-neutral-500">BATAS WAKTU</p>
                <Input data-testid="new-project-due-date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="h-11 rounded-none border-white/20 bg-[#08090A] text-sm" /></div>
              <div><p className="mb-2 font-meta text-[9px] text-neutral-500">KUOTA SELEKSI (0 = TANPA BATAS)</p>
                <Input data-testid="new-project-limit" type="number" min="0" value={form.selection_limit} onChange={(e) => setForm({ ...form, selection_limit: e.target.value })} className="h-11 rounded-none border-white/20 bg-[#08090A] text-sm" /></div>
              <div className="col-span-2"><p className="mb-2 font-meta text-[9px] text-neutral-500">DESKRIPSI</p>
                <Textarea data-testid="new-project-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[80px] resize-none rounded-none border-white/20 bg-[#08090A] text-sm" /></div>
              <div className="col-span-2 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setOpen(false)} className="h-10 rounded-none border-white/20 bg-transparent px-5 font-meta text-[9px] text-neutral-300 hover:bg-white/10 hover:text-white">Batal</Button>
                <Button data-testid="save-project-button" onClick={create} className="h-10 rounded-none bg-white px-6 font-meta text-[9px] text-black hover:bg-neutral-200">Simpan Proyek</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
