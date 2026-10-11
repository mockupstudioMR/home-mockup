/**
 * Small shared bits for the admin screens.
 *
 * (The library used to carry vocabulary/scan helpers too; those tables were never
 * created, so the screens that used them are gone and only the status pill remains.)
 */

const TONES: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground",
  ok: "bg-emerald-100 text-emerald-800",
  warn: "bg-amber-100 text-amber-900",
  bad: "bg-red-100 text-red-800",
  info: "bg-primary/10 text-primary",
};

const STATUS_TONE: Record<string, keyof typeof TONES> = {
  active: "ok",
  approved: "ok",
  completed: "ok",
  ready: "ok",
  paid: "ok",
  confirmed: "ok",
  used: "info",
  pending: "warn",
  invited: "warn",
  awaiting: "warn",
  draft: "warn",
  reading: "info",
  sent: "info",
  declined: "bad",
  expired: "bad",
  rejected: "bad",
  unreadable: "bad",
  failed: "bad",
  cancelled: "bad",
  suspended: "bad",
};

const toneFor = (status: string) => STATUS_TONE[status.toLowerCase()] ?? "neutral";

export const StatusBadge = ({ status, label }: { status: string; label?: string }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${TONES[toneFor(status)]}`}
  >
    {label ?? status}
  </span>
);
