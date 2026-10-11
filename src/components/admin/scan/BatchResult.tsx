import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ConfidenceBar, DetectionImage, StatusBadge, TermChip, useScanImage, useTerms, type Box } from "../library/shared";
import ReviewDrawer from "../review/ReviewDrawer";
import { runDetection } from "./ScanUpload";

type Item = Tables<"ingest_items">;
type Piece = Tables<"detected_pieces">;

export default function BatchResult({
  batchId,
  onBack,
  progress,
}: {
  batchId: string;
  onBack: () => void;
  progress?: { done: number; total: number } | null;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: terms } = useTerms();
  const [itemIndex, setItemIndex] = useState(0);
  const [reviewing, setReviewing] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["batch-detail", batchId],
    queryFn: async () => {
      const [{ data: batch, error: e1 }, { data: items, error: e2 }] = await Promise.all([
        supabase.from("ingest_batches").select("*").eq("id", batchId).single(),
        supabase.from("ingest_items").select("*").eq("batch_id", batchId).order("created_at"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      const ids = (items ?? []).map((i) => i.id);
      const { data: pieces, error: e3 } = ids.length
        ? await supabase.from("detected_pieces").select("*").in("item_id", ids).order("created_at")
        : { data: [] as Piece[], error: null };
      if (e3) throw e3;
      return { batch, items: (items ?? []) as Item[], pieces: (pieces ?? []) as Piece[] };
    },
    refetchInterval: (q) => (q.state.data?.batch?.status === "detecting" ? 3000 : false),
  });

  const items = useMemo(() => (data?.items ?? []).filter((i) => i.status !== "duplicate"), [data]);
  const item = items[Math.min(itemIndex, Math.max(0, items.length - 1))];
  const itemPieces = useMemo(() => (data?.pieces ?? []).filter((p) => p.item_id === item?.id), [data, item]);
  const { data: imageUrl } = useScanImage(item?.storage_path, item?.source_url);
  const t = (id: string | null) => (id ? terms?.byId.get(id) : undefined);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["batch-detail", batchId] });
    qc.invalidateQueries({ queryKey: ["ingest-batches"] });
    qc.invalidateQueries({ queryKey: ["review-queue"] });
  };

  const undo = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("undo_ingest_batch", { _batch: batchId });
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast({ title: "Batch undone", description: "Its combinations and unused AI-saved schemes were removed." });
    },
    onError: (e: Error) => toast({ title: "Could not undo", description: e.message, variant: "destructive" }),
  });

  const retry = useMutation({
    mutationFn: async () => {
      const failed = (data?.items ?? []).filter((i) => i.status === "failed").map((i) => i.id);
      return runDetection(failed, refresh);
    },
    onSuccess: (errors) => {
      refresh();
      if (errors.length) toast({ title: `${errors.length} image(s) still failed`, description: errors[0], variant: "destructive" });
    },
  });

  if (isLoading || !data) return <p className="text-muted-foreground">Loading batch…</p>;
  const { batch } = data;
  const failedCount = (data.items ?? []).filter((i) => i.status === "failed").length;
  const label = (p: Piece) => t(p.category_id)?.label ?? (p.raw as { category?: string })?.category ?? "Piece";

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All batches
      </button>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            {batch.found_count} pieces found, {batch.saved_count} saved
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={batch.status} />
            <StatusBadge status="saved">{batch.saved_count} saved</StatusBadge>
            {batch.waiting_count > 0 && <StatusBadge status="waiting">{batch.waiting_count} need review</StatusBadge>}
            <span className="text-sm text-muted-foreground">
              {batch.name} · threshold {Number(batch.threshold).toFixed(2)}
              {batch.review_all ? " · every piece reviewed" : ""}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {failedCount > 0 && (
            <Button variant="outline" onClick={() => retry.mutate()} disabled={retry.isPending}>
              <RotateCcw className="mr-2 h-4 w-4" /> Retry {failedCount} failed
            </Button>
          )}
          {batch.status !== "undone" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Undo batch</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Undo this batch?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Combinations this batch created and AI-saved schemes that nothing else uses will be removed. Confirmed schemes stay.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep it</AlertDialogCancel>
                  <AlertDialogAction onClick={() => undo.mutate()}>Undo batch</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {progress && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Reading image {Math.min(progress.done + 1, progress.total)} of {progress.total}…</p>
          <Progress value={(progress.done / Math.max(1, progress.total)) * 100} />
        </div>
      )}

      {items.length > 1 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Images in this batch">
          {items.map((it, i) => (
            <Button
              key={it.id}
              size="sm"
              role="tab"
              aria-selected={i === itemIndex}
              variant={i === itemIndex ? "default" : "outline"}
              onClick={() => setItemIndex(i)}
            >
              Image {i + 1} · {(data.pieces ?? []).filter((p) => p.item_id === it.id).length} pieces
            </Button>
          ))}
        </div>
      )}

      {item && (
        <>
          {item.status === "failed" ? (
            <Card><CardContent className="pt-6 text-destructive">This image could not be read: {item.error}</CardContent></Card>
          ) : imageUrl ? (
            <DetectionImage
              src={imageUrl}
              pieces={itemPieces.map((p, i) => ({ id: p.id, box: p.box as Box | null, status: p.status, label: label(p), n: i + 1 }))}
              onSelect={(id) => setReviewing(id)}
            />
          ) : (
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          )}
          <div className="flex flex-wrap gap-5 text-sm font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-2"><span className="h-3 w-5 rounded border-2 border-emerald-400" /> Saved</span>
            <span className="inline-flex items-center gap-2"><span className="h-3 w-5 rounded border-2 border-dashed border-amber-500" /> Waiting for review</span>
          </div>

          <Card>
            <CardContent className="divide-y pt-2">
              {itemPieces.length === 0 && <p className="py-6 text-muted-foreground">{item.status === "done" ? "No furniture found in this image." : "Reading this image…"}</p>}
              {itemPieces.map((p, i) => (
                <div key={p.id} className="flex flex-wrap items-center gap-4 py-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-extrabold">{i + 1}</span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      <TermChip facet="category" term={t(p.category_id)} fallback={(p.raw as { category?: string })?.category} />
                      <TermChip facet="color" term={t(p.color_id)} fallback={(p.raw as { color?: string })?.color} />
                      <TermChip facet="style" term={t(p.style_id)} fallback={(p.raw as { style?: string })?.style} />
                      <TermChip facet="material" term={t(p.material_id)} fallback={(p.raw as { material?: string })?.material} />
                      {p.tag_ids.map((id) => <TermChip key={id} facet={t(id)?.facet} term={t(id)} />)}
                    </div>
                    {p.status === "waiting" && (
                      <p className="text-sm font-semibold text-amber-800">
                        Waiting: {p.review_reason === "new_word" ? "a word isn't in the vocabulary yet" : p.review_reason === "spot_check" ? "every piece in this batch is reviewed" : "the AI wasn't sure enough"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <ConfidenceBar value={p.confidence} threshold={Number(batch.threshold)} />
                    {p.status === "waiting" ? (
                      <Button size="sm" variant="secondary" onClick={() => setReviewing(p.id)}>Review</Button>
                    ) : (
                      <StatusBadge status={p.status} />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      <ReviewDrawer pieceId={reviewing} onClose={() => setReviewing(null)} onDone={refresh} />
    </div>
  );
}
