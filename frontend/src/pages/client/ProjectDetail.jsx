import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Check, StickyNote, Film } from "lucide-react";
import api from "@/lib/api";
import { StatusBadge, EmptyState } from "@/components/dash/Shared";
import Lightbox from "@/components/marketing/Lightbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtDate, fmtDateTime, typeLabel, STATUS_ASSET } from "@/lib/ui";

const FILTERS = [
  { value: "all", label: "Semua" },
  { value: "selected", label: "Terpilih" },
  { value: "unselected", label: "Belum Dipilih" },
  { value: "note", label: "Bercatatan" },
];

export default function ProjectDetail() {
  const { projectId } = useParams();
  const [base, setBase] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [proofing, setProofing] = useState([]);
  const [finals, setFinals] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isPro, setIsPro] = useState(false);
  const [versionAsset, setVersionAsset] = useState(null);
  const [versions, setVersions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [lb, setLb] = useState(null);
  const [finalLb, setFinalLb] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [b, pa, fa, rv, lg] = await Promise.all([
      api.get(`/me/projects/${projectId}`),
      api.get(`/me/projects/${projectId}/assets?stage=proofing`),
      api.get(`/me/projects/${projectId}/assets?stage=final`),
      api.get(`/me/projects/${projectId}/revisions`),
      api.get(`/me/projects/${projectId}/activity`),
    ]);
    setLoadError(false);
    setBase(b.data);
    setProofing(pa.data.assets);
    setFinals(fa.data.assets);
    setRevisions(rv.data.revisions);
    setLogs(lg.data.logs);
  }, [projectId]);

  useEffect(() => {
    load().catch(() => setLoadError(true));
    api.get("/membership").then((r) => setIsPro(r.data.plan === "pro")).catch(() => setIsPro(false));
  }, [load]);

  if (loadError && !base) return <div role="alert" className="py-24 text-center text-sm text-neutral-400">Proyek belum dapat dimuat. <button className="text-white underline" onClick={() => { setLoadError(false); load().catch(() => setLoadError(true)); }}>Coba lagi</button></div>;
  if (!base) return <div className="py-24 text-center font-meta text-xs text-neutral-600 animate-pulse">Memuat proyek…</div>;

  const { project, selections } = base;
  const selectedMap = new Map(selections.map((s) => [s.asset_id, s]));
  const selectedCount = selections.length;
  const limit = project.selection_limit || 0;
  const locked = project.status !== "proofing";

  const filtered = proofing.filter((a) => {
    if (filter === "selected") return selectedMap.has(a.asset_id);
    if (filter === "unselected") return !selectedMap.has(a.asset_id);
    if (filter === "note") return selectedMap.get(a.asset_id)?.note;
    return true;
  });

  const toggleSelect = async (asset) => {
    if (locked) return;
    if (selectedMap.has(asset.asset_id)) {
      try {
        await api.delete(`/me/projects/${projectId}/select/${asset.asset_id}`);
        await load();
      } catch (e) {
        toast.error(e.response?.data?.detail || "Gagal membatalkan pilihan");
      }
    } else {
      if (limit && selectedCount >= limit) {
        toast.error(`Kuota seleksi tercapai (${limit} foto)`);
        return;
      }
      try {
        await api.post(`/me/projects/${projectId}/select`, { asset_id: asset.asset_id, note: "" });
        await load();
      } catch (e) {
        toast.error(e.response?.data?.detail || "Gagal memilih");
      }
    }
  };

  const saveNote = async () => {
    const asset = lb != null ? filtered[lb] : null;
    if (!asset) return;
    try {
      await api.post(`/me/projects/${projectId}/select`, { asset_id: asset.asset_id, note: noteDraft });
      await load();
      toast.success("Catatan tersimpan — foto ikut terpilih");
      setLb(null);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal menyimpan catatan");
    }
  };

  const submitSelections = async () => {
    setBusy(true);
    try {
      await api.post(`/me/projects/${projectId}/submit-selections`);
      toast.success(`${selectedCount} pilihan terkirim ke studio`);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal mengirim seleksi");
    } finally {
      setBusy(false);
    }
  };

  const openLb = (i) => {
    setLb(i);
    const a = filtered[i];
    setNoteDraft(selectedMap.get(a.asset_id)?.note || "");
  };

  return (
    <div data-testid="client-project-detail">
      <Link to="/dashboard/projects" className="font-meta text-[9px] text-neutral-500 hover:text-white">← Semua Proyek</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="font-display text-4xl tracking-tight text-white sm:text-5xl">{project.title}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="mt-3 text-sm text-neutral-500">
            {typeLabel(project.project_type)} · Sesi {fmtDate(project.shoot_date)} · Batas {fmtDate(project.due_date)}
          </p>
        </div>
        {project.description && <p className="max-w-md text-sm leading-relaxed text-neutral-400">{project.description}</p>}
      </div>

      <Tabs defaultValue="proofing" className="mt-10">
        <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-white/10 bg-transparent p-0">
          <TabsTrigger data-testid="tab-proofing" value="proofing" className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-1 font-meta text-[10px] text-neutral-500 data-[state=active]:border-white data-[state=active]:text-white">Proofing ({proofing.length})</TabsTrigger>
          <TabsTrigger data-testid="tab-revisions" value="revisions" className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-1 font-meta text-[10px] text-neutral-500 data-[state=active]:border-white data-[state=active]:text-white">Revisi ({revisions.length})</TabsTrigger>
          <TabsTrigger data-testid="tab-finals" value="finals" className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-1 font-meta text-[10px] text-neutral-500 data-[state=active]:border-white data-[state=active]:text-white">Hasil Akhir ({finals.length})</TabsTrigger>
          <TabsTrigger data-testid="tab-activity" value="activity" className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-1 font-meta text-[10px] text-neutral-500 data-[state=active]:border-white data-[state=active]:text-white">Aktivitas</TabsTrigger>
        </TabsList>

        {/* PROOFING */}
        <TabsContent value="proofing" className="mt-8">
          {proofing.length === 0 ? (
            <EmptyState title="Galeri belum tersedia" hint="Foto proofing akan muncul di sini setelah studio mempublikasikan galeri." />
          ) : (
            <>
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border border-white/10 bg-[#111316] px-5 py-4">
                <div className="flex items-center gap-4">
                  <span data-testid="selection-counter" className="font-display text-2xl italic text-white">
                    {selectedCount}{limit ? ` / ${limit}` : ""} <span className="text-sm not-italic text-neutral-500">terpilih</span>
                  </span>
                  {locked && <span className="font-meta text-[9px] text-amber-300">SELEKSI TERKIRIM — TERKUNCI</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {FILTERS.map((f) => (
                    <button key={f.value} data-testid={`proof-filter-${f.value}`} onClick={() => setFilter(f.value)}
                      className={`rounded-full border px-4 py-2 font-meta text-[9px] transition-colors ${filter === f.value ? "border-white bg-white text-black" : "border-white/20 text-neutral-400 hover:text-white"}`}>
                      {f.label}
                    </button>
                  ))}
                  {!locked && (
                    <Button data-testid="submit-selections-button" onClick={submitSelections} disabled={busy || selectedCount === 0}
                      className="h-9 rounded-none bg-white px-6 font-meta text-[9px] text-black hover:bg-neutral-200">
                      Kirim Seleksi
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {filtered.map((a, i) => {
                  const sel = selectedMap.get(a.asset_id);
                  return (
                    <div key={a.asset_id} data-testid={`proof-card-${i}`} className="group relative aspect-[3/4] overflow-hidden border border-white/10">
                      <img src={a.url} alt={a.title} loading="lazy" className="h-full w-full cursor-pointer object-cover transition-transform duration-500 group-hover:scale-[1.03]" onClick={() => openLb(i)} />
                      {a.media_type === "video" && <Film className="absolute left-3 top-3 h-4 w-4 text-white" />}
                      <button
                        data-testid={`proof-select-${i}`}
                        onClick={() => toggleSelect(a)}
                        className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-200 ${sel ? "border-white bg-white text-black" : "border-white/40 bg-black/30 text-white hover:border-white"}`}
                      >
                        <Check size={15} />
                      </button>
                      {sel?.note && (
                        <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 font-meta text-[8px] text-amber-300 backdrop-blur-sm">
                          <StickyNote size={10} /> CATATAN
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        {/* REVISIONS */}
        <TabsContent value="revisions" className="mt-8">
          <RevisionsTab projectId={projectId} revisions={revisions} reload={load} isPro={isPro} canInteract />
        </TabsContent>

        {/* FINALS */}
        <TabsContent value="finals" className="mt-8">
          {finals.length === 0 ? (
            <EmptyState title="Hasil akhir belum tersedia" hint="File final akan muncul di sini setelah studio mengirim hasil." />
          ) : (
            <>
              {project.status === "final_delivered" && (
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border border-white/10 bg-[#111316] px-5 py-4">
                  <p className="text-sm text-neutral-300">Puas dengan hasilnya? Setujui untuk menyelesaikan proyek.</p>
                  <ApproveDeliveryButton projectId={projectId} reload={load} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {finals.map((a, i) => (
                  <div key={a.asset_id} data-testid={`final-card-${i}`} className="group overflow-hidden border border-white/10 bg-[#111316]">
                    <div className="relative aspect-[3/4]">
                      {a.media_type === "video" ? <video src={a.url} preload="metadata" muted className="h-full w-full cursor-pointer object-cover" onClick={() => setFinalLb(i)} /> : <img src={a.url} alt={a.title} loading="lazy" className="h-full w-full cursor-pointer object-cover" onClick={() => setFinalLb(i)} />}
                      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 font-meta text-[8px] text-white backdrop-blur-sm">V{a.version}</span>
                    </div>
                    <button type="button" className="w-full border-b border-white/10 px-4 py-2 text-left text-xs text-neutral-400 hover:text-white" onClick={async () => {
                      try { const result = await api.get(`/me/assets/${a.asset_id}/versions`); setVersions(result.data.versions); setVersionAsset(a); }
                      catch { toast.error("Riwayat versi belum dapat dimuat."); }
                    }}>Riwayat versi{isPro ? " & perbandingan" : ""}</button>
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white">{a.title}</p>
                        <p className="font-meta text-[8px] text-neutral-500">{STATUS_ASSET[a.status] || a.status}</p>
                      </div>
                      <a href={a.url} target="_blank" rel="noreferrer" download data-testid={`final-download-${i}`}
                        className="rounded-full border border-white/20 px-4 py-2 font-meta text-[8px] text-white transition-colors hover:bg-white hover:text-black">
                        Unduh
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              {finalLb !== null && finals[finalLb] && (
                <Lightbox items={finals} index={finalLb} onClose={() => setFinalLb(null)}
                  onNav={(d) => setFinalLb((finalLb + d + finals.length) % finals.length)} />
              )}
            </>
          )}
        </TabsContent>

        {/* ACTIVITY */}
        <TabsContent value="activity" className="mt-8">
          {logs.length === 0 ? (
            <EmptyState title="Belum ada aktivitas" hint="Riwayat perubahan status proyek akan tercatat di sini." />
          ) : (
            <div className="border border-white/10 bg-[#111316]">
              {logs.map((l, i) => (
                <div key={l.log_id || i} data-testid={`activity-row-${i}`} className="flex items-center justify-between border-b border-white/5 px-6 py-4 last:border-0">
                  <div>
                    <p className="text-sm text-neutral-200">{l.action.replace(/_/g, " ")}</p>
                    <p className="mt-1 text-xs text-neutral-600">oleh {l.actor_name}</p>
                  </div>
                  <span className="font-meta text-[9px] text-neutral-600">{fmtDateTime(l.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {versionAsset && <div className="fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto bg-black/80 p-4" onClick={() => setVersionAsset(null)}><div role="dialog" aria-modal="true" aria-label="Riwayat versi" className="my-auto w-full max-w-3xl border border-white/10 bg-[#111316] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><h2 className="font-display text-2xl text-white">Riwayat versi · {versionAsset.title}</h2><button onClick={() => setVersionAsset(null)} aria-label="Tutup" className="text-xl">×</button></div>
        {versions.length === 0 ? <p className="mt-5 text-sm text-neutral-500">Belum ada riwayat versi tersimpan.</p> : <div className="mt-5 grid gap-4 sm:grid-cols-2">{versions.slice(0, isPro ? versions.length : 2).map((v) => <div key={v.version_id} className="border border-white/10 p-3"><p className="mb-2 text-xs text-neutral-400">Versi {v.version_number} · {fmtDateTime(v.created_at)}</p>{versionAsset.media_type === "video" ? <video controls src={v.url} className="max-h-72 w-full" /> : <img src={v.url} alt={`Versi ${v.version_number}`} className="max-h-72 w-full object-contain" />}<p className="mt-2 text-xs text-neutral-500">{v.version_notes}</p></div>)}</div>}
        {!isPro && <p className="mt-5 text-xs text-neutral-500">Free menampilkan maksimal 2 versi terbaru. Perbandingan lengkap tersedia di Pro.</p>}
      </div></div>}

      {/* Proofing lightbox with note footer */}
      {lb !== null && filtered[lb] && (
        <Lightbox
          items={filtered}
          index={lb}
          onClose={() => setLb(null)}
          onNav={(d) => openLb((lb + d + filtered.length) % filtered.length)}
          footer={
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <p className="font-meta text-[9px] text-neutral-500 mb-2">CATATAN UNTUK FOTO INI</p>
                <Textarea data-testid="proof-note-input" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Contoh: buat warnanya lebih hangat…" className="min-h-[70px] resize-none rounded-none border-white/20 bg-[#111316] text-sm" />
              </div>
              <div className="flex gap-3">
                <Button data-testid="proof-save-note-button" onClick={saveNote} className="h-11 rounded-none bg-white px-6 font-meta text-[9px] text-black hover:bg-neutral-200">
                  Simpan &amp; Pilih
                </Button>
                {selectedMap.has(filtered[lb].asset_id) && !locked && (
                  <Button data-testid="proof-deselect-button" variant="outline" onClick={() => { toggleSelect(filtered[lb]); setLb(null); }}
                    className="h-11 rounded-none border-white/20 bg-transparent px-6 font-meta text-[9px] text-neutral-300 hover:bg-white/10 hover:text-white">
                    Batal Pilih
                  </Button>
                )}
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}

function ApproveDeliveryButton({ projectId, reload }) {
  const [busy, setBusy] = useState(false);
  const approve = async () => {
    setBusy(true);
    try {
      await api.post(`/me/projects/${projectId}/approve-delivery`);
      toast.success("Proyek disetujui sebagai selesai. Terima kasih!");
      await reload();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal menyetujui");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button data-testid="approve-delivery-button" onClick={approve} disabled={busy} className="h-10 rounded-none bg-white px-6 font-meta text-[9px] text-black hover:bg-neutral-200">
      Setujui Hasil Akhir
    </Button>
  );
}

export function RevisionsTab({ projectId, revisions, reload, isPro = false, canInteract = false }) {
  const [open, setOpen] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});

  const sendReply = async (revId) => {
    const body = replyDrafts[revId];
    if (!body?.trim()) return;
    await api.post(`/me/revisions/${revId}/comments`, { body });
    setReplyDrafts({ ...replyDrafts, [revId]: "" });
    await reload();
  };

  const approveRev = async (revId) => {
    await api.post(`/me/revisions/${revId}/approve`);
    toast.success("Revisi disetujui");
    await reload();
  };

  if (revisions.length === 0 && !open) {
    return (
      <div>
        <NewRevisionDialog projectId={projectId} revisions={revisions} reload={reload} open={open} setOpen={setOpen} isPro={isPro} />
        <EmptyState title="Belum ada revisi" hint="Ajukan revisi jika ada foto yang perlu disesuaikan — catatan akan menempel pada foto terkait." />
      </div>
    );
  }

  return (
    <div>
      <NewRevisionDialog projectId={projectId} revisions={revisions} reload={reload} open={open} setOpen={setOpen} isPro={isPro} />
      <div className="space-y-6">
        {revisions.map((r, i) => (
          <div key={r.revision_id} data-testid={`revision-thread-${i}`} className="border border-white/10 bg-[#111316]">
            <div className="flex flex-wrap items-center gap-4 border-b border-white/10 px-6 py-4">
              {r.asset && <img src={r.asset.url} alt="" className="h-14 w-14 border border-white/10 object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white">{r.asset?.title || "Media"}</p>
                <p className="mt-1 text-xs text-neutral-500">{r.request_text}</p>
                {r.video_seconds != null && <p className="mt-1 text-xs text-amber-300">Waktu video: {Math.floor(r.video_seconds / 60)}:{String(Math.floor(r.video_seconds % 60)).padStart(2, "0")}</p>}
                {r.annotation_x != null && <p className="mt-1 text-xs text-amber-300">Titik anotasi: {Math.round(r.annotation_x * 100)}%, {Math.round(r.annotation_y * 100)}%</p>}
              </div>
              <StatusBadge status={r.status} kind="revision" />
              {r.status === "in_progress" && (
                <Button data-testid={`revision-approve-${i}`} size="sm" onClick={() => approveRev(r.revision_id)}
                  className="h-9 rounded-none bg-white px-4 font-meta text-[9px] text-black hover:bg-neutral-200">
                  Setujui Hasil
                </Button>
              )}
            </div>
            <div className="divide-y divide-white/5">
              {r.comments.map((c, j) => (
                <div key={c.comment_id || j} className="flex gap-4 px-6 py-4">
                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${c.author_role === "admin" ? "bg-amber-300" : "bg-neutral-500"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-neutral-300">{c.body}</p>
                    <p className="mt-1 font-meta text-[8px] text-neutral-600">{c.author_name} · {fmtDateTime(c.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 border-t border-white/10 p-4">
              <input data-testid={`revision-reply-input-${i}`} value={replyDrafts[r.revision_id] || ""}
                onChange={(e) => setReplyDrafts({ ...replyDrafts, [r.revision_id]: e.target.value })}
                placeholder="Tulis balasan…"
                className="h-10 flex-1 rounded-none border border-white/20 bg-[#08090A] px-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-white/40" />
              <Button data-testid={`revision-reply-send-${i}`} size="sm" variant="outline" onClick={() => sendReply(r.revision_id)}
                className="h-10 rounded-none border-white/20 bg-transparent px-5 font-meta text-[9px] text-white hover:bg-white hover:text-black">
                Kirim
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewRevisionDialog({ projectId, revisions, reload, open, setOpen, isPro }) {
  const [assets, setAssets] = useState([]);
  const [assetId, setAssetId] = useState("");
  const [text, setText] = useState("");
  const [point, setPoint] = useState(null);
  const [videoTime, setVideoTime] = useState(0);
  const [useTimestamp, setUseTimestamp] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      Promise.all([
        api.get(`/me/projects/${projectId}/assets?stage=final`),
        api.get(`/me/projects/${projectId}/assets?stage=proofing`),
      ]).then(([final, proof]) => setAssets([...final.data.assets, ...proof.data.assets]))
        .catch(() => toast.error("Daftar media belum dapat dimuat."));
    }
  }, [open, projectId]);

  const submit = async () => {
    if (!assetId || !text.trim()) return;
    setBusy(true);
    try {
      await api.post(`/me/assets/${assetId}/revisions`, { request_text: text, annotation_x: point?.x ?? null, annotation_y: point?.y ?? null, video_seconds: useTimestamp ? videoTime : null });
      toast.success("Permintaan revisi terkirim");
      setOpen(false);
      setText("");
      setAssetId(""); setPoint(null); setUseTimestamp(false); setVideoTime(0);
      await reload();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal mengirim revisi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button data-testid="new-revision-button" onClick={() => setOpen(true)}
        className="mb-8 h-10 rounded-none border border-white/20 bg-transparent px-6 font-meta text-[9px] text-white hover:bg-white hover:text-black">
        Ajukan Revisi Baru
      </Button>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto border border-white/10 bg-[#111316] p-8" onClick={(e) => e.stopPropagation()} data-testid="new-revision-dialog">
            <h3 className="font-display text-2xl italic text-white">Revisi baru</h3>
            <p className="mt-2 text-xs text-neutral-500">Catatan revisi menempel pada satu media, bukan seluruh proyek.</p>
            <div className="mt-6 space-y-5">
              <div>
                <p className="mb-2 font-meta text-[9px] text-neutral-500">MEDIA</p>
                <Select value={assetId} onValueChange={(value) => { setAssetId(value); setPoint(null); setUseTimestamp(false); }}>
                  <SelectTrigger data-testid="revision-asset-select" className="w-full rounded-none border-white/20 bg-[#08090A] text-white">
                    <SelectValue placeholder="Pilih foto/video" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-white/10 bg-[#111316] text-white">
                    {assets.map((a) => (
                      <SelectItem key={a.asset_id} value={a.asset_id}>{a.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isPro && assetId && (() => {
                const asset = assets.find((item) => item.asset_id === assetId);
                if (!asset) return null;
                return asset.media_type === "video" ? <div><p className="mb-2 text-xs text-neutral-400">Putar video dan tandai waktu yang ingin dikomentari.</p><video controls src={asset.url} onTimeUpdate={(e) => { if (!useTimestamp) setVideoTime(e.currentTarget.currentTime); }} className="max-h-52 w-full" /><label className="mt-2 flex items-center gap-2 text-xs text-neutral-400"><input type="checkbox" checked={useTimestamp} onChange={(e) => setUseTimestamp(e.target.checked)} /> Sertakan waktu {Math.floor(videoTime / 60)}:{String(Math.floor(videoTime % 60)).padStart(2, "0")}</label></div> : <div><p className="mb-2 text-xs text-neutral-400">Ketuk area foto untuk menandai revisi (opsional).</p><button type="button" className="relative block w-full" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPoint({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }); }}><img src={asset.url} alt="Pilih area foto yang ingin direvisi" className="w-full" />{point && <span className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-amber-400" style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }} />}</button></div>;
              })()}
              <div>
                <p className="mb-2 font-meta text-[9px] text-neutral-500">CATATAN REVISI</p>
                <Textarea data-testid="revision-text-input" value={text} onChange={(e) => setText(e.target.value)}
                  placeholder="Contoh: perbaiki eksposur, hapus objek pengganggu di latar…" className="min-h-[100px] resize-none rounded-none border-white/20 bg-[#08090A] text-sm" />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setOpen(false)} className="h-10 rounded-none border-white/20 bg-transparent px-5 font-meta text-[9px] text-neutral-300 hover:bg-white/10 hover:text-white">Batal</Button>
                <Button data-testid="revision-submit-button" onClick={submit} disabled={busy || !assetId || !text.trim()}
                  className="h-10 rounded-none bg-white px-6 font-meta text-[9px] text-black hover:bg-neutral-200">Kirim Revisi</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
