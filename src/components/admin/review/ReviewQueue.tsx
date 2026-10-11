import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { TermChip, useScanImage, useTerms, type Box } from "../library/shared";
import ReviewDrawer from "./ReviewDrawer";

const REASONS: Record<string, string> = {
  new_word: "New word",
  low_confidence: "Low confidence",
  possible_duplicate: "Possible duplicate",
  reported: "Reported by support",
  spot_check: "Review-all batch",
};

/** Small crop of the piece from its scanned image. */
function PieceCrop({ path, url, box }: { path: string | null; url: string | null; box: Box | null }) {
  const { data: src } = useScanImage(path, url);
  if (!src) return <span className="block h-14 w-20 rounded-lg bg-muted" />;
  const zoom = box ? Math.min(4, 1 / Math.max(box.w, box.h, 0.25)) : 1;
  const cx = box ? (box.x + box.w / 2) * 100 : 50;
  const cy = box ? (box.y + box.h / 2) * 100 : 50;
  return (
    <span className="block h-14 w-20 overflow-hidden rounded-lg bg-neutral-800">
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        style={{ transform: `scale(${zoom})`, transformOrigin: `${cx}% ${cy}%` }}
      />
    </span>
  );
}

export default function ReviewQueue() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: terms } = useTerms();
  const [reason, setReason] = useState<string>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["review-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("detected_pieces")
        .select("*, ingest_items(storage_path, source_url, batch_id, ingest_batches(name))")
        .eq("status", "waiting")
        .order("created_at", { ascending: true })
        .limit(300);
      if (error) throw error;
      return data;
    },
  });

  const t = (id: string | null) => (id ? terms?.byId.get(id) : undefined);
  const hasNewWord = (p: NonNullable<typeof rows>[number]) =>
    [p.category_id, p.color_id, p.style_id, p.material_id].some((id) => t(id)?.status === "proposed");
  const shown = useMemo(() => (rows ?? []).filter((r) => reason === "all" || r.review_reason === reason), [rows, reason]);
  const count = (r: string) => (rows ?? []).filter((x) => x.review_reason === r).length;

  const bulkConfirm = useMutation({
    mutationFn: async () => {
      let ok = 0;
      const blocked: string[] = [];
      for (const id of selected) {
        const row = rows?.find((r) => r.id === id);
        if (!row || hasNewWord(row) || !row.category_id) {
          blocked.push(id);
          continue;
        }
        const { error } = await supabase.rpc("save_detected_piece", { _piece: id, _confirmed: true });
        if (error) blocked.push(id);
        else ok += 1;
      }
      return { ok, blocked: blocked.length };
    },
    onSuccess: ({ ok, blocked }) => {
      setSelected([]);
      qc.invalidateQueries({ queryKey: ["review-queue"] });
      qc.invalidateQueries({ queryKey: ["ingest-batches"] });
      toast({
        title: `${ok} confirmed`,
        description: blocked ? `${blocked} skipped: they need a new word decided or a category first.` : undefined,
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Review queue</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Everything the AI wasn&apos;t sure about. Nothing here reaches users until you confirm, fix or merge it.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={reason === "all" ? "default" : "outline"} onClick={() => setReason("all")}>
          All {rows?.length ?? 0}
        </Button>
        {Object.entries(REASONS).map(([k, l]) =>
          count(k) ? (
            <Button key={k} size="sm" variant={reason === k ? "default" : "outline"} onClick={() => setReason(k)}>
              {l} {count(k)}
            </Button>
          ) : null,
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-foreground px-5 py-3 text-background">
          <b>{selected.length} selected</b>
          <Button size="sm" variant="secondary" className="ml-auto" onClick={() => bulkConfirm.mutate()} disabled={bulkConfirm.isPending}>
            Confirm as suggested
          </Button>
          <Button size="sm" variant="ghost" className="text-background" onClick={() => setSelected([])}>Clear</Button>
        </div>
      )}

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : shown.length === 0 ? (
            <p className="py-6 text-muted-foreground">Nothing waiting. New scans that need a decision will show up here.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        aria-label="Select all"
                        checked={selected.length === shown.length}
                        onCheckedChange={(c) => setSelected(c ? shown.map((s) => s.id) : [])}
                      />
                    </TableHead>
                    <TableHead>Piece</TableHead>
                    <TableHead>Suggested scheme</TableHead>
                    <TableHead>Why it&apos;s here</TableHead>
                    <TableHead>Sure</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((p) => {
                    const item = p.ingest_items as { storage_path: string | null; source_url: string | null; ingest_batches: { name: string } | null } | null;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Checkbox
                            aria-label="Select piece"
                            checked={selected.includes(p.id)}
                            onCheckedChange={(c) => setSelected((s) => (c ? [...s, p.id] : s.filter((x) => x !== p.id)))}
                          />
                        </TableCell>
                        <TableCell>
                          <PieceCrop path={item?.storage_path ?? null} url={item?.source_url ?? null} box={p.box as Box | null} />
                        </TableCell>
                        <TableCell>
                          <div className="flex max-w-md flex-wrap gap-1">
                            <TermChip term={t(p.category_id)} fallback={(p.raw as { category?: string })?.category} />
                            <TermChip term={t(p.color_id)} fallback={(p.raw as { color?: string })?.color} />
                            <TermChip term={t(p.style_id)} fallback={(p.raw as { style?: string })?.style} />
                            <TermChip term={t(p.material_id)} fallback={(p.raw as { material?: string })?.material} />
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-amber-800">{REASONS[p.review_reason ?? ""] ?? "Review"}</TableCell>
                        <TableCell>{(p.confidence ?? 0).toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item?.ingest_batches?.name ?? "—"}
                          <br />
                          {new Date(p.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="secondary" onClick={() => setOpen(p.id)}>Review</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ReviewDrawer
        pieceId={open}
        onClose={() => setOpen(null)}
        onDone={() => qc.invalidateQueries({ queryKey: ["review-queue"] })}
      />
    </div>
  );
}
