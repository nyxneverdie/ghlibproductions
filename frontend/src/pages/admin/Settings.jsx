import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { PageHeader } from "@/components/dash/Shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const FIELDS = [
  { key: "studio_name", label: "NAMA STUDIO" },
  { key: "tagline", label: "TAGLINE" },
  { key: "location", label: "LOKASI" },
  { key: "email", label: "EMAIL KONTAK" },
  { key: "phone", label: "TELEPON" },
  { key: "instagram", label: "INSTAGRAM URL" },
  { key: "youtube", label: "YOUTUBE URL" },
];

export default function AdminSettings() {
  const [profile, setProfile] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/admin/settings").then((r) => setProfile(r.data.profile)).catch(() => {});
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      await api.patch("/admin/settings", profile);
      toast.success("Pengaturan disimpan — perubahan tampil di homepage publik");
    } catch (e) {
      toast.error("Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  };

  if (!profile) return <div className="py-24 text-center font-meta text-xs text-neutral-600 animate-pulse">Memuat…</div>;

  return (
    <div data-testid="admin-settings-page">
      <PageHeader index="PENGATURAN" title="Profil Studio" sub="Branding, kontak, dan info yang tampil pada halaman publik." />
      <div className="grid grid-cols-1 gap-5 border border-white/10 bg-[#111316] p-8 md:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className={f.key === "tagline" ? "md:col-span-2" : ""}>
            <p className="mb-2 font-meta text-[9px] text-neutral-500">{f.label}</p>
            <Input data-testid={`settings-${f.key}`} value={profile[f.key] || ""}
              onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
              className="h-11 rounded-none border-white/20 bg-[#08090A] text-sm text-white" />
          </div>
        ))}
        <div className="md:col-span-2">
          <p className="mb-2 font-meta text-[9px] text-neutral-500">BIO / TENTANG</p>
          <Textarea data-testid="settings-bio" value={profile.bio || ""}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            className="min-h-[110px] resize-none rounded-none border-white/20 bg-[#08090A] text-sm text-white" />
        </div>
        <div className="md:col-span-2">
          <Button data-testid="settings-save-button" onClick={save} disabled={busy}
            className="h-12 rounded-none bg-white px-10 font-meta text-[10px] text-black hover:bg-neutral-200">
            {busy ? "Menyimpan…" : "Simpan Pengaturan"}
          </Button>
        </div>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-neutral-600">
        Integrasi Google Drive untuk arsip master file akan ditambahkan pada fase berikutnya —
        penyimpanan media saat ini memakai placeholder URL.
      </p>
    </div>
  );
}
