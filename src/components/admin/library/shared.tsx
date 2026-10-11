import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

export type Term = Tables<"taxonomy_terms">;
export type Facet = Term["facet"];

/** Every vocabulary term (admins also see proposed and retired ones), keyed by id. */
export function useTerms() {
  return useQuery({
    queryKey: ["admin-terms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("taxonomy_terms")
        .select("*")
        .order("facet")
        .order("label")
        .limit(5000);
      if (error) throw error;
      const byId = new Map<string, Term>();
      for (const t of data) byId.set(t.id, t);
      return { list: data, byId };
    },
    staleTime: 60_000,
  });
}

export const facetLabel: Record<string, string> = {
  category: "Category",
  color: "Colour",
  style: "Style",
  material: "Material",
  finish: "Finish",
  shape: "Shape",
  pattern: "Pattern",
  mood: "Mood",
  room_type: "Room type",
};

/** One facet + value chip; dashed amber when the term is only proposed. */
export function TermChip({ term, facet, fallback }: { term?: Term | null; facet?: string; fallback?: string }) {
  const proposed = term?.status === "proposed";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold",
        proposed ? "border-dashed border-amber-600/60 bg-amber-50 text-amber-900" : "border-border bg-background",
      )}
    >
      {facet && (
        <span className={cn("text-[10px] uppercase tracking-wider", proposed ? "text-amber-800" : "text-muted-foreground")}>
          {facetLabel[facet] ?? facet}
        </span>
      )}
      {term?.hex && <span className="h-3 w-3 rounded" style={{ background: term.hex }} aria-hidden="true" />}
      {term?.label ?? fallback ?? "—"}
      {proposed && <span className="text-[10px] font-bold">· new word</span>}
    </span>
  );
}

const statusStyles: Record<string, string> = {
  saved: "bg-emerald-100 text-emerald-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  done: "bg-emerald-100 text-emerald-800",
  approved: "bg-emerald-100 text-emerald-800",
  active: "bg-emerald-100 text-emerald-800",
  merged: "bg-primary/10 text-primary",
  matched: "bg-primary/10 text-primary",
  pinned: "bg-primary/10 text-primary",
  waiting: "bg-amber-100 text-amber-900",
  needs_review: "bg-amber-100 text-amber-900",
  pending: "bg-amber-100 text-amber-900",
  proposed: "bg-amber-100 text-amber-900",
  detecting: "bg-muted text-muted-foreground",
  queued: "bg-muted text-muted-foreground",
  dropped: "bg-muted text-muted-foreground",
  retired: "bg-muted text-muted-foreground",
  undone: "bg-muted text-muted-foreground",
  failed: "bg-red-100 text-red-800",
  rejected: "bg-red-100 text-red-800",
  unreadable: "bg-red-100 text-red-800",
};

const statusText: Record<string, string> = {
  needs_review: "Needs review",
  waiting: "Needs review",
  saved: "Saved",
};

export function StatusBadge({ status, children }: { status: string; children?: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold",
        statusStyles[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {children ?? statusText[status] ?? status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
    </span>
  );
}

export function ConfidenceBar({ value, threshold = 0.85 }: { value: number | null; threshold?: number }) {
  const v = Math.max(0, Math.min(1, value ?? 0));
  return (
    <span className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground" title="How sure the AI was">
      {v.toFixed(2)}
      <span className="h-2 w-16 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <span
          className={cn("block h-full rounded-full", v >= threshold ? "bg-emerald-600" : "bg-primary")}
          style={{ width: `${v * 100}%` }}
        />
      </span>
    </span>
  );
}

export type Box = { x: number; y: number; w: number; h: number };
export type BoxedPiece = { id: string; box: Box | null; status: string; label: string; n: number };

/** An image with the detected pieces outlined: green = saved, purple = matched, amber dashed = waiting. */
export function DetectionImage({
  src,
  pieces,
  selectedId,
  onSelect,
  className,
}: {
  src: string;
  pieces: BoxedPiece[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-neutral-800", className)}>
      <img src={src} alt="Scanned design with detected pieces outlined" className="block w-full" />
      {pieces.map((p) => {
        if (!p.box) return null;
        const waiting = p.status === "waiting";
        const dim = selectedId && selectedId !== p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect?.(p.id)}
            aria-label={`Piece ${p.n}: ${p.label}`}
            className={cn(
              "absolute rounded-lg border-[2.5px] transition-opacity",
              waiting ? "border-dashed border-amber-300" : "border-emerald-300",
              selectedId === p.id && "border-4 ring-4 ring-white/40",
              dim && "opacity-40",
            )}
            style={{ left: `${p.box.x * 100}%`, top: `${p.box.y * 100}%`, width: `${p.box.w * 100}%`, height: `${p.box.h * 100}%` }}
          >
            <span
              className={cn(
                "absolute left-1 top-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-extrabold",
                waiting ? "bg-amber-300 text-amber-950" : "bg-emerald-300 text-emerald-950",
              )}
            >
              {p.n} {p.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Signed URL for a file in the private admin-scans bucket. */
export function useScanImage(path: string | null | undefined, fallbackUrl?: string | null) {
  return useQuery({
    queryKey: ["scan-image", path],
    enabled: !!path,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("admin-scans").createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
    staleTime: 30 * 60_000,
    initialData: path ? undefined : fallbackUrl ?? undefined,
  });
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
