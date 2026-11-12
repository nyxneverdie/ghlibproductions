import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { PageHeader, EmptyState } from "@/components/dash/Shared";
import { Button } from "@/components/ui/button";
import { fmtDateTime } from "@/lib/ui";

export default function Notifications() {
  const [items, setItems] = useState(null);
  const navigate = useNavigate();

  const load = () => api.get("/me/notifications").then((r) => setItems(r.data.notifications));
  useEffect(() => { load().catch(() => setItems([])); }, []);

  const open = async (n) => {
    if (!n.read_at) {
      await api.post(`/me/notifications/${n.notification_id}/read`);
    }
    if (n.target_url?.startsWith("/dashboard")) navigate(n.target_url);
    else load();
  };

  const readAll = async () => {
    await api.post("/me/notifications/read-all");
    load();
  };

  if (!items) return <div className="py-24 text-center font-meta text-xs text-neutral-600 animate-pulse">Memuat notifikasi…</div>;

  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div data-testid="client-notifications-page">
      <PageHeader index="PORTAL KLIEN" title="Notifikasi" sub={`${items.length} notifikasi · ${unread} belum dibaca`}>
        {unread > 0 && (
          <Button data-testid="read-all-button" variant="outline" onClick={readAll}
            className="h-10 rounded-none border-white/20 bg-transparent px-6 font-meta text-[9px] text-white hover:bg-white hover:text-black">
            Tandai Semua Dibaca
          </Button>
        )}
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState title="Belum ada notifikasi" hint="Notifikasi galeri baru, revisi, dan hasil akhir akan muncul di sini." />
      ) : (
        <div className="border border-white/10 bg-[#111316]">
          {items.map((n, i) => (
            <button key={n.notification_id} data-testid={`notification-row-${i}`} onClick={() => open(n)}
              className={`flex w-full items-start gap-4 border-b border-white/5 px-6 py-5 text-left transition-colors last:border-0 hover:bg-white/[0.03] ${!n.read_at ? "bg-white/[0.02]" : ""}`}>
              <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${n.read_at ? "bg-white/10" : "bg-amber-300"}`} data-testid={`notification-dot-${i}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${n.read_at ? "text-neutral-400" : "text-white"}`}>{n.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">{n.body}</p>
                <p className="mt-2 font-meta text-[8px] text-neutral-600">{fmtDateTime(n.created_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
