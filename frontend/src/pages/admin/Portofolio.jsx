import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Star, Eye } from "lucide-react";
import api from "@/lib/api";
import { PageHeader } from "@/components/dash/Shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROJECT_TYPES } from "@/lib/ui";

const CATEGORIES = PROJECT_TYPES.map((t) => t.label);

export default function AdminPortfolio() {
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Portrait", url: "", media_type: "photo" });

  const load = () => api.get("/admin/portfolio").then((r) => setItems(r.data.items));
  useEffect(() => { load().catch(() => setItems([])); }, []);

  const patch = async (item, updates) => {
    await api.patch(`/admin/portfolio/${item.item_id}`, updates);
    await load();
  };

  const remove = async (item) => {
    await api.delete(`/admin/portfolio/${item.item_id}`);
    toast.success("Karya dihapus dari portofolio");
    await load();
  };

  const add = async () => {
    if (!form.title.trim() || !form.url.trim()) return toast.error("Judul dan URL wajib diisi");
    await api.post("/admin/portfolio", form);
    toast.success("Karya ditambahkan");
    setOpen(false);
    setForm({ title: "", category: "Portrait", url: "", media_type: "photo" });
    await load();
  };

  if (!items) return <div className="py-24 text-center font-meta text-xs text-neutral-600 animate-pulse">Memuat…</div>;

  return (
    <div data-testid="admin-portfolio-page">
      <PageHeader index="KURASI" title="Portofolio Publik" sub="Pilih karya yang tampil di homepage. Media klien tidak akan tampil publik tanpa Anda pindahkan ke sini.">
        <Button data-testid="add-portfolio-button" onClick={() => setOpen(true)} className="h-11 rounded-none bg-white px-6 font-meta text-[9px] text-black hover:bg-neutral-200">
          <Plus size={14} className="mr-2" /> Tambah Karya
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <div key={item.item_id} data-testid={`portfolio-item-${i}`} className="group border border-white/10 bg-[#111316]">
            <div className="relative aspect-[4/3]">
              <img src={item.url} alt={item.title} className={`h-full w-full object-cover transition-all duration-500 ${item.visible ? "" : "opacity-30 grayscale"}`} />
              <div className="absolute right-3 top-3 flex gap-2">
                <button data-testid={`portfolio-featured-${i}`} title="Tampilkan di Featured Works"
                  onClick={() => patch(item, { featured: !item.featured })}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-sm transition-colors ${item.featured ? "border-amber-300 bg-amber-300 text-black" : "border-white/30 bg-black/40 text-white hover:border-white"}`}>
                  <Star size={13} fill={item.featured ? "currentColor" : "none"} />
                </button>
                <button data-testid={`portfolio-visible-${i}`} title="Tampil publik"
                  onClick={() => patch(item, { visible: !item.visible })}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-sm transition-colors ${item.visible ? "border-white bg-white text-black" : "border-white/30 bg-black/40 text-white"}`}>
                  <Eye size={13} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-display text-lg italic text-white">{item.title}</p>
                <p className="font-meta text-[8px] text-neutral-500">{item.category}{item.featured ? " · FEATURED" : ""}{item.visible ? "" : " · TERSEMBUNYI"}</p>
              </div>
              <button data-testid={`portfolio-delete-${i}`} onClick={() => remove(item)} className="shrink-0 text-neutral-600 transition-colors hover:text-red-400">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md border border-white/10 bg-[#111316] p-8" onClick={(e) => e.stopPropagation()} data-testid="add-portfolio-dialog">
            <h3 className="font-display text-2xl italic text-white">Karya baru</h3>
            <div className="mt-6 space-y-5">
              <div><p className="mb-2 font-meta text-[9px] text-neutral-500">JUDUL</p>
                <Input data-testid="portfolio-new-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-11 rounded-none border-white/20 bg-[#08090A] text-sm" /></div>
              <div><p className="mb-2 font-meta text-[9px] text-neutral-500">URL FOTO</p>
                <Input data-testid="portfolio-new-url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" className="h-11 rounded-none border-white/20 bg-[#08090A] text-sm" /></div>
              <div><p className="mb-2 font-meta text-[9px] text-neutral-500">KATEGORI</p>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger data-testid="portfolio-new-category" className="w-full rounded-none border-white/20 bg-[#08090A] text-sm text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-none border-white/10 bg-[#111316] text-white">
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select></div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setOpen(false)} className="h-10 rounded-none border-white/20 bg-transparent px-5 font-meta text-[9px] text-neutral-300 hover:bg-white/10 hover:text-white">Batal</Button>
                <Button data-testid="save-portfolio-button" onClick={add} className="h-10 rounded-none bg-white px-6 font-meta text-[9px] text-black hover:bg-neutral-200">Simpan</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
