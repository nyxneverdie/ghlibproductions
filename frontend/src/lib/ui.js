import dayjs from "dayjs";
import "dayjs/locale/id";

dayjs.locale("id");

export const STATUS_PROJECT = {
  inquiry: "Penawaran",
  scheduled: "Terjadwal",
  shoot_completed: "Shooting Selesai",
  proofing: "Proofing",
  selection_submitted: "Seleksi Dikirim",
  editing: "Editing",
  client_review: "Review Klien",
  revision_requested: "Revisi Diminta",
  final_delivered: "Hasil Akhir Dikirim",
  completed: "Selesai",
  archived: "Arsip",
};

export const STATUS_ASSET = {
  uploaded: "Diunggah",
  proof_published: "Proofing",
  selected: "Terpilih",
  editing: "Editing",
  review_pending: "Menunggu Review",
  revision_requested: "Revisi Diminta",
  revision_in_progress: "Revisi Diproses",
  approved: "Disetujui",
  final_published: "Final",
};

export const STATUS_SESSION = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  rescheduled: "Dijadwalkan Ulang",
};

export const STATUS_REVISION = {
  open: "Baru",
  in_progress: "Diproses",
  resolved: "Selesai",
};

export const fmtDate = (d) => (d ? dayjs(d).format("D MMMM YYYY") : "-");
export const fmtDateTime = (d) => (d ? dayjs(d).format("D MMM YYYY, HH:mm") : "-");

export const PROJECT_TYPES = [
  { value: "portrait", label: "Portrait" },
  { value: "wedding", label: "Wedding" },
  { value: "event", label: "Event" },
  { value: "product", label: "Product" },
  { value: "graduation", label: "Graduation" },
  { value: "film", label: "Film / Videography" },
];

export const typeLabel = (v) =>
  (PROJECT_TYPES.find((t) => t.value === v) || { label: v }).label;
