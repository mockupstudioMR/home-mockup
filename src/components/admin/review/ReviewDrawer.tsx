import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ConfidenceBar, DetectionImage, StatusBadge, TermChip, facetLabel, useScanImage, useTerms, type Box, type Term } from "../library/shared";

type Piece = Tables<"detected_pieces">;
const FACETS = ["category", "color", "style", "material"] as const;
type MainFacet = (typeof FACETS)[number];
const NONE = "__none";

export default function ReviewDrawer({
  pieceId,
  onClose,
  onDone,
}: {
  pieceId: string | null;
  onClose: () => void;
  onDone?: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: terms } = useTerms();
  const [values, setValues] = useState<Record<MainFacet, string | null>>({ category: null, color: null, style: null, material: null });
  const [tags, setTags] = useState<string[]>([]);
  const [parentFor, setParentFor] = useState<Record<string, string>>({});
  const [mapTo, setMapTo] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ["review-piece", pieceId],
    enabled: !!pieceId,
    queryFn: async () => {
      const { data: piece, error } = await supabase.from("detected_pieces").select("*").eq("id", pieceId!).single();
      if (error) throw error;
      const { data: item } = await supabase.from("ingest_items").select("*").eq("id", piece.item_id).single();
      const { data: siblings } = await supabase.from("detected_pieces").select("*").eq("item_id", piece.item_id).order("created_at");
      const { data: batch } = item
        ? await supabase.from("ingest_batches").select("id, name, threshold").eq("id", item.batch_id).single()
        : { data: null };
      return { piece: piece as Piece, item, siblings: (siblings ?? []) as Piece[], batch };
    },
  });

  useEffect(() => {
    if (!data?.piece) return;
    const p = data.piece;
    setValues({ category: p.category_id, color: p.color_id, style: p.style_id, material: p.material_id });
    setTags(p.tag_ids);
  }, [data?.piece]);

  const { data: imageUrl } = useScanImage(data?.item?.storage_path, data?.item?.source_url);
  const t = (id: string | null | undefined) => (id ? terms?.byId.get(id) : undefined);
  const activeOf = (facet: string) => terms?.list.filter((x) => x.facet === facet && x.status === "active") ?? [];

  const { data: closest } = useQuery({
    queryKey: ["closest-schemes", values.category],
    enabled: !!values.category,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("furniture_schemes")
        .select("id, category_id, color_id, style_id, material_id, label, status")
        .eq("category_id", values.category!)
        .eq("status", "active")
        .limit(30);
      return rows ?? [];
    },
  });

  const ranked = useMemo(() => {
    const score = (s: { color_id: string | null; style_id: string | null; material_id: string | null }) =>
      (s.color_id === values.color ? 1 : 0) + (s.style_id === values.style ? 1 : 0) + (s.material_id === values.material ? 1 : 0);
    return (closest ?? []).map((s) => ({ ...s, score: score(s) })).sort((a, b) => b.score - a.score).slice(0, 4);
  }, [closest, values]);

  const proposed = FACETS.filter((f) => t(values[f])?.status === "proposed");

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ["review-piece", pieceId] });
    qc.invalidateQueries({ queryKey: ["admin-terms"] });
    qc.invalidateQueries({ queryKey: ["review-queue"] });
    onDone?.();
  };

  const wordAction = useMutation({
    mutationFn: async ({ facet, action }: { facet: MainFacet; action: "accept" | "map" | "reject" }) => {
      const termId = values[facet]!;
      if (action === "accept") {
        const parent = parentFor[facet];
        const { error } = await supabase
          .from("taxonomy_terms")
          .update({ status: "active", parent_id: parent && parent !== NONE ? parent : null })
          .eq("id", termId);
        if (error) throw error;
      } else if (action === "map") {
        const target = mapTo[facet];
        if (!target) throw new Error("Pick the existing term first.");
        const { error } = await supabase.rpc("merge_terms", { _keep: target, _drop: termId });
        if (error) throw error;
        setValues((v) => ({ ...v, [facet]: target }));
      } else {
        const { error } = await supabase.from("taxonomy_terms").update({ status: "retired", is_active: false }).eq("id", termId);
        if (error) throw error;
        await supabase.from("detected_pieces").update({ [`${facet}_id`]: null }).eq("id", pieceId!);
        setValues((v) => ({ ...v, [facet]: null }));
      }
    },
    onSuccess: refreshAll,
    onError: (e: Error) => toast({ title: "Could not update the word", description: e.message, variant: "destructive" }),
  });

  const confirm = useMutation({
    mutationFn: async () => {
      const p = data!.piece;
      const { data: auth } = await supabase.auth.getUser();
      const corrections = FACETS.filter((f) => (p[`${f}_id` as const] ?? null) !== (values[f] ?? null)).map((f) => ({
        piece_id: p.id,
        facet: f,
        ai_value: t(p[`${f}_id` as const])?.label ?? (p.raw as Record<string, string>)?.[f] ?? null,
        fixed_value: t(values[f])?.label ?? null,
        fixed_by: auth.user?.id ?? null,
      }));
      if (corrections.length) await supabase.from("detection_corrections").insert(corrections);
      const { error: upErr } = await supabase
        .from("detected_pieces")
        .update({ category_id: values.category, color_id: values.color, style_id: values.style, material_id: values.material, tag_ids: tags })
        .eq("id", p.id);
      if (upErr) throw upErr;
      const { error } = await supabase.rpc("save_detected_piece", { _piece: p.id, _confirmed: true });
      if (error) throw error;
      return corrections.length;
    },
    onSuccess: (fixed) => {
      toast({ title: fixed ? "Fixed and saved" : "Saved", description: "The scheme is in the library." });
      refreshAll();
      onClose();
    },
    onError: (e: Error) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });

  const drop = useMutation({
    mutationFn: async () => {
      const p = data!.piece;
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("detected_pieces")
        .update({ status: "dropped", reviewed_by: auth.user?.id ?? null, reviewed_at: new Date().toISOString() })
        .eq("id", p.id);
      if (error) throw error;
      await supabase.rpc("save_ingest_combination", { _item: p.item_id });
      if (data?.batch) await supabase.rpc("refresh_ingest_batch", { _batch: data.batch.id });
    },
    onSuccess: () => {
      toast({ title: "Dropped", description: "Kept as a rejected detection to improve the AI." });
      refreshAll();
      onClose();
    },
  });

  const piece = data?.piece;
  const n = data?.siblings.findIndex((s) => s.id === pieceId) ?? -1;

  return (
    <Sheet open={!!pieceId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Is this right?</SheetTitle>
          <SheetDescription>
            {data?.batch?.name ?? "Scan"} · piece {n + 1}
            {piece?.review_reason === "new_word" && " · the AI found a word we don't know"}
            {piece?.review_reason === "low_confidence" && " · the AI wasn't sure"}
          </SheetDescription>
        </SheetHeader>

        {!piece ? (
          <p className="mt-6 text-muted-foreground">Loading…</p>
        ) : (
          <div className="mt-6 space-y-6">
            {imageUrl && (
              <DetectionImage
                src={imageUrl}
                selectedId={piece.id}
                pieces={(data?.siblings ?? []).map((s, i) => ({
                  id: s.id,
                  box: s.box as Box | null,
                  status: s.status,
                  label: t(s.category_id)?.label ?? "Piece",
                  n: i + 1,
                }))}
              />
            )}
            <div className="flex items-center justify-between">
              <StatusBadge status={piece.status} />
              <ConfidenceBar value={piece.confidence} threshold={Number(data?.batch?.threshold ?? 0.85)} />
            </div>

            <section className="space-y-3">
              <h3 className="font-bold">Scheme</h3>
              {FACETS.map((facet) => {
                const current = t(values[facet]);
                const options: Term[] = [...activeOf(facet)];
                if (current && current.status !== "active") options.unshift(current);
                return (
                  <div key={facet} className="grid grid-cols-[110px_1fr] items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{facetLabel[facet]}</span>
                    <Select value={values[facet] ?? NONE} onValueChange={(v) => setValues((s) => ({ ...s, [facet]: v === NONE ? null : v }))}>
                      <SelectTrigger className={current?.status === "proposed" ? "border-dashed border-amber-600 bg-amber-50" : ""}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {facet !== "category" && <SelectItem value={NONE}>Not set</SelectItem>}
                        {options.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.label}
                            {o.status === "proposed" ? " · new word" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
              <div className="grid grid-cols-[110px_1fr] items-start gap-3">
                <span className="pt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((id) => (
                    <button key={id} type="button" onClick={() => setTags((x) => x.filter((y) => y !== id))} aria-label={`Remove tag ${t(id)?.label}`}>
                      <TermChip term={t(id)} />
                    </button>
                  ))}
                  <Select value="" onValueChange={(v) => setTags((x) => [...new Set([...x, v])])}>
                    <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="+ Add tag" /></SelectTrigger>
                    <SelectContent>
                      {(terms?.list ?? [])
                        .filter((x) => ["finish", "shape", "pattern", "mood"].includes(x.facet) && x.status === "active")
                        .map((x) => <SelectItem key={x.id} value={x.id}>{facetLabel[x.facet]} · {x.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {proposed.map((facet) => {
              const word = t(values[facet])!;
              return (
                <section key={facet} className="space-y-3 rounded-2xl border-2 border-dashed border-amber-600/60 bg-amber-50 p-4">
                  <h3 className="font-bold text-amber-900">&ldquo;{word.label}&rdquo; isn&apos;t in the vocabulary</h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-2 rounded-xl bg-background p-3">
                      <p className="text-sm font-semibold">Add as a new term</p>
                      <Select value={parentFor[facet] ?? NONE} onValueChange={(v) => setParentFor((s) => ({ ...s, [facet]: v }))}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Under…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>No parent</SelectItem>
                          {activeOf(facet).map((o) => <SelectItem key={o.id} value={o.id}>Under {o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" className="w-full" onClick={() => wordAction.mutate({ facet, action: "accept" })}>Add term</Button>
                    </div>
                    <div className="space-y-2 rounded-xl bg-background p-3">
                      <p className="text-sm font-semibold">Same as an existing term</p>
                      <Select value={mapTo[facet] ?? ""} onValueChange={(v) => setMapTo((s) => ({ ...s, [facet]: v }))}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Pick a term" /></SelectTrigger>
                        <SelectContent>
                          {activeOf(facet).map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="secondary" className="w-full" onClick={() => wordAction.mutate({ facet, action: "map" })}>
                        Make it a synonym
                      </Button>
                    </div>
                    <div className="space-y-2 rounded-xl bg-background p-3">
                      <p className="text-sm font-semibold">Reject the word</p>
                      <p className="text-xs text-muted-foreground">Leaves {facetLabel[facet].toLowerCase()} empty for this piece.</p>
                      <Button size="sm" variant="outline" className="w-full" onClick={() => wordAction.mutate({ facet, action: "reject" })}>Reject</Button>
                    </div>
                  </div>
                </section>
              );
            })}

            {ranked.length > 0 && (
              <section className="space-y-2">
                <h3 className="font-bold">Closest existing schemes</h3>
                {ranked.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl border p-3">
                    <div className="flex flex-1 flex-wrap gap-1.5">
                      <TermChip term={t(s.color_id)} />
                      <TermChip term={t(s.style_id)} />
                      <TermChip term={t(s.material_id)} />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setValues({ category: s.category_id, color: s.color_id, style: s.style_id, material: s.material_id })}
                    >
                      Use this
                    </Button>
                  </div>
                ))}
              </section>
            )}

            <section className="space-y-2">
              <h3 className="font-bold">Its combination</h3>
              <ul className="space-y-1 text-sm">
                {(data?.siblings ?? []).map((s) => (
                  <li key={s.id} className="flex items-center gap-2">
                    <span className={s.status === "waiting" ? "text-amber-700" : "text-emerald-700"}>{s.status === "waiting" ? "•" : "✓"}</span>
                    <span className="font-semibold">{t(s.category_id)?.label ?? "Piece"}</span>
                    {s.id === piece.id && <span className="text-muted-foreground">· this one</span>}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">The combination is saved once no piece of this design is waiting.</p>
            </section>

            <div className="flex flex-wrap items-center gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => drop.mutate()} disabled={drop.isPending}>Not furniture / wrong box</Button>
              <Button variant="ghost" onClick={onClose}>Skip</Button>
              <Button
                className="ml-auto"
                disabled={confirm.isPending || !values.category || proposed.length > 0}
                onClick={() => confirm.mutate()}
                title={proposed.length ? "Decide on the new word first" : undefined}
              >
                {proposed.length ? "Decide on the new word first" : "Confirm"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
