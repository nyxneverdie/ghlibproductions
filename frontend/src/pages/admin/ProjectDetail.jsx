import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, ChevronUp, ChevronDown, Check } from "lucide-react";
import api from "@/lib/api";
import { PageHeader, StatusBadge } from "@/components/dash/Shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtDate, typeLabel, STATUS_PROJECT, STATUS_ASSET } from "@/lib/ui";

const STAGES = [
  { value: "proofing", label: "Proofing" },
  { value: "final", label: "Hasil Akhir" },
];

export default function AdminProjectDetail() {
  const { projectId } = useParams();
  const [data, setData] = useState(null);
  const [selections, setSelections] = useState([]);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("samples");
  const [picked, setPicked] = useState([]);
  const [samples, setSamples] = useState([]);
  const [urlForm, setUrlForm] = useState({ title: "", url: "", media_type: "photo" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [d, s] = await Promise.all([
      api.get(`/admin/projects/${projectId}`),
      api.get(`/admin/projects/${projectId}/selections`),
    ]);
    setData(d.data);
    setSelections(s.data.selections);
  }, [projectId]);

  useEffect(() => {
    load().catch(() => toast.error("Gagal memuat proyek"));
    api.get("/admin/sample-media").then((r) => setSamples(r.data.samples)).catch(() => {});
  }, [load]);

  if (!data) return <div className="py-24 text-center font-meta text-xs text-neutral-600 animate-pulse">Memuat…</div>;

  const { project, client, assets } = data;
  const proofing = assets.filter((a) => a.stage === "proofing");
  const finals = assets.filter((a) => a.stage === "final");

  const addPicked = async () => {
    if (picked.length === 0) return toast.error("Pilih minimal satu media contoh");
    setBusy(true);
    try {
      for (const s of samples.filter((x) => picked.includes(x.url))) {
        await api.post(`/admin/projects/${projectId}/assets`, { title: s.title, url: s.url, media_type: s.media_type, stage: "proofing" });
      }
      toast.success(`${picked.length} media ditambahkan`);
      setOpen(false);
      setPicked([]);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const addUrl = async () => {
    if (!urlForm.title.trim() || !urlForm.url.trim()) return toast.error("Isi judul dan URL media");
    await api.post(`/admin/projects/${projectId}/assets`, { ...urlForm, stage: "proofing" });
    toast.success("Media ditambahkan");
    setUrlForm({ title: "", url: "", media_type: "photo" });
    setOpen(false);
    await load();
  };

  const setStage = async (asset, stage) => {
    await api.patch(`/admin/assets/${asset.asset_id}`, { stage });
    await load();
  };

  const move = async (asset, dir) => {
    const list = assets.filter((a) => a.stage === asset.stage);
    const idx = list.findIndex((a) => a.asset_id === asset.asset_id);
    const swap = list[idx + dir];
    if (!swap) return;
    await Promise.all([
      api.patch(`/admin/assets/${asset.asset_id}`, { order: swap.order }),
      api.patch(`/admin/assets/${swap.asset_id}`, { order: asset.order }),
    ]);
    await load();
  };

  const remove = async (asset) => {
    await api.delete(`/admin/assets/${asset.asset_id}`);
    toast.success("Media dihapus");
    await load();
  };

  const publish = async (stage) => {
    try {
      const { data: r } = await api.post(`/admin/projects/${projectId}/publish`, { stage });
      toast.success(`${stage === "proofing" ? "Galeri proofing" : "Hasil akhir"} dipublikasikan (${r.count} media). Klien telah dinotifikasi.`);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal mempublikasikan");
    }
  };

  const changeStatus = async (status) => {
    await api.patch(`/admin/projects/${projectId}`, { status });
    await load();
  };

  return (
    <div data-testid="admin-project-detail">
      <Link to="/admin/projects" className="font-meta text-[9px] text-neutral-500 hover:text-white">← Semua Proyek</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="font-display text-4xl tracking-tight text-white sm:text-5xl">{project.title}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="mt-3 text-sm text-neutral-500">
            Klien: <span className="text-neutral-300">{client?.name || "-"}</span> · {typeLabel(project.project_type)} · Sesi {fmtDate(project.shoot_date)} · Kuota seleksi {project.selection_limit || "tanpa batas"}
          </p>
        </div>
        <div className="w-56">
          <p className="mb-2 font-meta text-[9px] text-neutral-500">STATUS PROYEK</p>
          <Select value={project.status} onValueChange={changeStatus}>
            <SelectTrigger data-testid="admin-project-status-select" className="w-full rounded-none border-white/20 bg-[#111316] text-sm text-white"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-none border-white/10 bg-[#111316] text-white">
              {Object.entries(STATUS_PROJECT).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-wrap items-center justify-between gap-4 border border-white/10 bg-[#111316] px-5 py-4">
          <div>
            <p className="font-meta text-[9px] text-neutral-500">PUBLIKASI</p>
            <p className="mt-1 text-xs text-neutral-400">Kirim galeri proofing atau hasil akhir ke klien (dengan notifikasi).</p>
          </div>
          <div className="flex gap-3">
            <Button data-testid="publish-proofing-button" onClick={() => publish("proofing")} className="h-10 rounded-none border border-white/20 bg-transparent px-4 font-meta text-[8px] text-white hover:bg-white hover:text-black">Publikasikan Proofing</Button>
            <Button data-testid="publish-final-button" onClick={() => publish("final")} className="h-10 rounded-none bg-white px-4 font-meta text-[8px] text-black hover:bg-neutral-200">Publikasikan Final</Button>
          </div>
        </div>
        <div className="border border-white/10 bg-[#111316] px-5 py-4">
          <p className="font-meta text-[9px] text-neutral-500">SELEKSI KLIEN</p>
          <p className="mt-1 text-sm text-neutral-300" data-testid="admin-selection-count">
            {selections.length} foto dipilih{project.selection_limit ? ` dari kuota ${project.selection_limit}` : ""}
          </p>
          {selections.length > 0 && <button type="button" className="mt-3 text-xs text-white underline" onClick={async () => {
            const names = selections.map((item) => item.asset?.original_filename || item.asset?.title).filter(Boolean);
            if (!names.length) return toast.error("Nama file belum tersedia.");
            try { await navigator.clipboard.writeText(names.join("\n")); toast.success("Nama file pilihan disalin."); }
            catch { toast.error("Nama file tidak dapat disalin pada browser ini."); }
          }}>Salin nama file pilihan</button>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selections.slice(0, 8).map((s, i) => (
              <img key={s.selection_id || i} src={s.asset?.url} title={`${s.asset?.title}${s.note ? ` — ${s.note}` : ""}`} alt="" className="h-9 w-9 border border-white/10 object-cover" />
            ))}
            {selections.length === 0 && <span className="text-xs text-neutral-600">Belum ada seleksi masuk.</span>}
          </div>
        </div>
      </div>

      <div className="mt-6 border border-white/10 bg-[#111316] p-5">
        <label htmlFor="revision-limit" className="font-meta text-[9px] text-neutral-500">PENGECUALIAN BATAS FOTO REVISI</label>
        <p className="mt-2 text-xs text-neutral-500">Kosongkan untuk memakai batas membership (Free 25 / Pro 100 foto unik). Pengaturan ini tidak mengubah kuota seleksi.</p>
        <div className="mt-3 flex max-w-xs gap-2">
          <Input id="revision-limit" type="number" min="1" key={`${project.project_id}:${project.revision_limit}`} defaultValue={project.revision_limit || ""} placeholder="Batas membership" className="h-10 rounded-none border-white/20 bg-[#08090A] text-white" />
          <Button className="h-10 rounded-none bg-white px-5 text-xs text-black hover:bg-neutral-200" onClick={async () => {
            const value = document.getElementById("revision-limit").value;
            if (value && (!Number.isInteger(Number(value)) || Number(value) < 1)) return toast.error("Masukkan bilangan positif.");
            try { await api.patch(`/admin/projects/${projectId}`, { revision_limit: value ? Number(value) : null }); await load(); toast.success("Batas revisi disimpan."); }
            catch { toast.error("Batas revisi belum dapat disimpan."); }
          }}>Simpan</Button>
        </div>
      </div>
      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-2xl italic text-white">Media Manager</h2>
        <Button data-testid="add-media-button" onClick={() => setOpen(true)} className="h-10 rounded-none bg-white px-5 font-meta text-[9px] text-black hover:bg-neutral-200">
          <Plus size={14} className="mr-2" /> Tambah Media
        </Button>
      </div>

      {assets.length === 0 && (
        <p className="mt-6 border border-dashed border-white/15 px-8 py-14 text-center text-sm text-neutral-600">
          Belum ada media. Tambahkan dari koleksi contoh atau URL untuk melanjutkan.
        </p>
      )}

      {["proofing", "final"].map((stage) => {
        const list = stage === "proofing" ? proofing : finals;
        if (list.length === 0) return null;
        return (
          <div key={stage} className="mt-8">
            <p className="mb-4 font-meta text-[9px] text-neutral-500">TAHAP: {stage === "proofing" ? "PROOFING" : "HASIL AKHIR"} ({list.length})</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
              {list.map((a, i) => (
                <div key={a.asset_id} data-testid={`admin-asset-${stage}-${i}`} className="group border border-white/10 bg-[#111316]">
                  <div className="relative aspect-[3/4]">
                    <img src={a.url} alt={a.title} className="h-full w-full object-cover" />
                    <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 font-meta text-[7px] text-white">{STATUS_ASSET[a.status] || a.status}</span>
                    {selections.some((s) => s.asset_id === a.asset_id) && (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-black"><Check size={13} /></span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-xs text-white">{a.title}</p>
                    <div className="mt-2 flex items-center justify-between gap-1">
                      <Select value={a.stage} onValueChange={(v) => setStage(a, v)}>
                        <SelectTrigger data-testid={`asset-stage-select-${i}`} className="h-7 flex-1 rounded-none border-white/15 bg-[#08090A] px-2 text-[10px] text-neutral-300"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-none border-white/10 bg-[#111316] text-white">
                          {STAGES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <button data-testid={`asset-up-${i}`} onClick={() => move(a, -1)} className="p-1 text-neutral-500 hover:text-white"><ChevronUp size={13} /></button>
                      <button data-testid={`asset-down-${i}`} onClick={() => move(a, 1)} className="p-1 text-neutral-500 hover:text-white"><ChevronDown size={13} /></button>
                      <button data-testid={`asset-delete-${i}`} onClick={() => remove(a)} className="p-1 text-neutral-500 hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-3xl border border-white/10 bg-[#111316] p-8" onClick={(e) => e.stopPropagation()} data-testid="add-media-dialog">
            <h3 className="font-display text-2xl italic text-white">Tambah media</h3>
            <p className="mt-2 text-xs text-neutral-500">Placeholder penyimpanan: pilih dari koleksi contoh atau tempel URL foto/video.</p>
            <div className="mt-6 flex gap-6 border-b border-white/10">
              {["samples", "url"].map((t) => (
                <button key={t} data-testid={`media-tab-${t}`} onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 pb-3 font-meta text-[9px] ${tab === t ? "border-white text-white" : "border-transparent text-neutral-500"}`}>
                  {t === "samples" ? "KOLEKSI CONTOH" : "URL"}
                </button>
              ))}
            </div>

            {tab === "samples" ? (
              <>
                <div className="mt-6 grid max-h-[46vh] grid-cols-3 gap-3 overflow-y-auto pr-1 md:grid-cols-4">
                  {samples.map((s, i) => (
                    <button key={s.url} data-testid={`sample-media-${i}`}
                      onClick={() => setPicked(picked.includes(s.url) ? picked.filter((p) => p !== s.url) : [...picked, s.url])}
                      className={`relative aspect-[3/4] overflow-hidden border transition-all duration-200 ${picked.includes(s.url) ? "border-white ring-1 ring-white" : "border-white/10 hover:border-white/40"}`}>
                      <img src={s.url} alt={s.title} className="h-full w-full object-cover" />
                      {picked.includes(s.url) && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-black"><Check size={13} /></span>}
                      <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-[9px] text-white">{s.title}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setOpen(false)} className="h-10 rounded-none border-white/20 bg-transparent px-5 font-meta text-[9px] text-neutral-300 hover:bg-white/10 hover:text-white">Batal</Button>
                  <Button data-testid="add-picked-media-button" onClick={addPicked} disabled={busy} className="h-10 rounded-none bg-white px-6 font-meta text-[9px] text-black hover:bg-neutral-200">
                    {busy ? "Menambahkan…" : `Tambahkan (${picked.length})`}
                  </Button>
                </div>
              </>
            ) : (
              <div className="mt-6 space-y-5">
                <div><p className="mb-2 font-meta text-[9px] text-neutral-500">JUDUL</p>
                  <Input data-testid="media-url-title" value={urlForm.title} onChange={(e) => setUrlForm({ ...urlForm, title: e.target.value })} className="h-11 rounded-none border-white/20 bg-[#08090A] text-sm" /></div>
                <div><p className="mb-2 font-meta text-[9px] text-neutral-500">URL MEDIA</p>
                  <Input data-testid="media-url-input" value={urlForm.url} onChange={(e) => setUrlForm({ ...urlForm, url: e.target.value })} placeholder="https://…" className="h-11 rounded-none border-white/20 bg-[#08090A] text-sm" /></div>
                <div><p className="mb-2 font-meta text-[9px] text-neutral-500">JENIS</p>
                  <Select value={urlForm.media_type} onValueChange={(v) => setUrlForm({ ...urlForm, media_type: v })}>
                    <SelectTrigger data-testid="media-url-type" className="w-full rounded-none border-white/20 bg-[#08090A] text-sm text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-none border-white/10 bg-[#111316] text-white">
                      <SelectItem value="photo">Foto</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select></div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setOpen(false)} className="h-10 rounded-none border-white/20 bg-transparent px-5 font-meta text-[9px] text-neutral-300 hover:bg-white/10 hover:text-white">Batal</Button>
                  <Button data-testid="add-url-media-button" onClick={addUrl} className="h-10 rounded-none bg-white px-6 font-meta text-[9px] text-black hover:bg-neutral-200">Tambahkan</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
