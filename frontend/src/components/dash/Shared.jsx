import { Badge } from "@/components/ui/badge";
import { STATUS_PROJECT, STATUS_ASSET, STATUS_SESSION, STATUS_REVISION } from "@/lib/ui";

export function StatusBadge({ status, kind = "project" }) {
  const maps = { project: STATUS_PROJECT, asset: STATUS_ASSET, session: STATUS_SESSION, revision: STATUS_REVISION };
  const label = (maps[kind] || {})[status] || status;
  const tone =
    status === "completed" || status === "approved" || status === "resolved" || status === "final_published"
      ? "bg-emerald-400/10 text-emerald-300 border-emerald-400/20"
      : status === "rejected" || status === "revision_requested"
      ? "bg-red-400/10 text-red-300 border-red-400/20"
      : status === "proofing" || status === "selected" || status === "selection_submitted"
      ? "bg-amber-400/10 text-amber-300 border-amber-400/20"
      : "bg-white/5 text-neutral-300 border-white/10";
  return (
    <Badge variant="outline" data-testid={`status-badge-${status}`} className={`rounded-full border px-3 py-1 font-meta text-[9px] ${tone}`}>
      {label}
    </Badge>
  );
}

export function StatCard({ label, value, testid }) {
  return (
    <div data-testid={testid} className="border border-white/10 bg-[#111316] p-6 transition-colors duration-300 hover:border-white/25">
      <p className="font-meta text-[9px] text-neutral-500">{label}</p>
      <p className="mt-4 font-display text-4xl tracking-tight text-white">{value}</p>
    </div>
  );
}

export function EmptyState({ title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-white/15 px-8 py-16 text-center">
      <p className="font-display text-2xl italic text-neutral-300">{title}</p>
      <p className="mt-3 max-w-sm text-sm text-neutral-600">{hint}</p>
    </div>
  );
}

export function PageHeader({ index, title, sub, children }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div>
        {index && <p className="font-meta text-[9px] text-neutral-600">{index}</p>}
        <h1 className="mt-3 font-display text-4xl tracking-tight text-white sm:text-5xl">{title}</h1>
        {sub && <p className="mt-3 max-w-lg text-sm text-neutral-500">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
