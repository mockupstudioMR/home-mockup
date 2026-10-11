import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { StatusBadge, facetLabel, slugify, useTerms, type Facet, type Term } from "./shared";

const FACETS: Facet[] = ["category", "color", "style", "material", "finish", "shape", "pattern", "mood", "room_type"];
const NONE = "__none";

export default function VocabularyManager() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: terms, isLoading } = useTerms();
  const [facet, setFacet] = useState<Facet | "proposed">("category");
  const [filter, setFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ label: string; parent: string; hex: string; synonyms: string[] } | null>(null);
  const [newSyn, setNewSyn] = useState("");
  const [mergeTarget, setMergeTarget] = useState<string>("");
  const [confirmMerge, setConfirmMerge] = useState(false);
  const [mapFor, setMapFor] = useState<Record<string, string>>({});

  const list = useMemo(() => terms?.list ?? [], [terms]);
  const proposed = list.filter((t) => t.status === "proposed");
  const facetTerms = useMemo(
    () => list.filter((t) => t.facet === facet && t.status !== "proposed" && (!filter || t.label.toLowerCase().includes(filter.toLowerCase()))),
    [list, facet, filter],
  );
  const selected = selectedId ? terms?.byId.get(selectedId) : undefined;

  useEffect(() => {
    if (!selected) return setDraft(null);
    setDraft({ label: selected.label, parent: selected.parent_id ?? NONE, hex: selected.hex ?? "", synonyms: selected.synonyms });
    setMergeTarget("");
  }, [selected]);

  // Parents first, children indented under them.
  const tree = useMemo(() => {
    const roots = facetTerms.filter((t) => !t.parent_id || !facetTerms.some((p) => p.id === t.parent_id));
    const out: { term: Term; depth: number }[] = [];
    const walk = (t: Term, depth: number) => {
      out.push({ term: t, depth });
      facetTerms.filter((c) => c.parent_id === t.id).forEach((c) => walk(c, Math.min(depth + 1, 2)));
    };
    roots.forEach((r) => walk(r, 0));
    return out;
  }, [facetTerms]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-terms"] });
  const fail = (title: string) => (e: Error) => toast({ title, description: e.message, variant: "destructive" });

  const save = useMutation({
    mutationFn: async () => {
      if (!selected || !draft) return;
      const { error } = await supabase
        .from("taxonomy_terms")
        .update({
          label: draft.label.trim(),
          parent_id: draft.parent === NONE ? null : draft.parent,
          hex: selected.facet === "color" && /^#[0-9a-f]{6}$/i.test(draft.hex) ? draft.hex : null,
          synonyms: draft.synonyms,
        })
        .eq("id", selected.id);
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast({ title: "Term saved" });
    },
    onError: fail("Could not save the term"),
  });

  const add = useMutation({
    mutationFn: async () => {
      if (facet === "proposed") return;
      const label = filter.trim() || "New term";
      const { data, error } = await supabase
        .from("taxonomy_terms")
        .insert({ facet, slug: slugify(label), label })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => {
      refresh();
      if (id) setSelectedId(id);
    },
    onError: fail("Could not add the term"),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "retired" }) => {
      const { error } = await supabase.from("taxonomy_terms").update({ status, is_active: status === "active" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: fail("Could not change the term"),
  });

  const merge = useMutation({
    mutationFn: async ({ keep, drop }: { keep: string; drop: string }) => {
      const { error } = await supabase.rpc("merge_terms", { _keep: keep, _drop: drop });
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      refresh();
      setSelectedId(v.keep);
      toast({ title: "Terms merged", description: "Everything now points to the kept term." });
    },
    onError: fail("Could not merge"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Vocabulary</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          The shared words behind every scheme, product and rule. Synonyms let free text from AI and shop feeds land on the right term.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Facets">
        {FACETS.map((f) => (
          <Button key={f} size="sm" role="tab" aria-selected={facet === f} variant={facet === f ? "default" : "outline"} onClick={() => { setFacet(f); setSelectedId(null); }}>
            {facetLabel[f]}
          </Button>
        ))}
        <Button size="sm" role="tab" aria-selected={facet === "proposed"} variant={facet === "proposed" ? "default" : "outline"} onClick={() => setFacet("proposed")}>
          Proposed · {proposed.length}
        </Button>
      </div>

      {facet === "proposed" ? (
        <Card>
          <CardHeader><CardTitle>Proposed by scans</CardTitle></CardHeader>
          <CardContent>
            {proposed.length === 0 ? (
              <p className="text-muted-foreground">No new words waiting.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Word</TableHead>
                      <TableHead>Facet</TableHead>
                      <TableHead>Map to</TableHead>
                      <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposed.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-bold">{p.label}</TableCell>
                        <TableCell>{facetLabel[p.facet]}</TableCell>
                        <TableCell>
                          <Select value={mapFor[p.id] ?? ""} onValueChange={(v) => setMapFor((s) => ({ ...s, [p.id]: v }))}>
                            <SelectTrigger className="h-9 w-48"><SelectValue placeholder="Existing term" /></SelectTrigger>
                            <SelectContent>
                              {list.filter((x) => x.facet === p.facet && x.status === "active").map((x) => (
                                <SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => setStatus.mutate({ id: p.id, status: "active" })}>Accept</Button>
                            <Button size="sm" variant="secondary" disabled={!mapFor[p.id]} onClick={() => merge.mutate({ keep: mapFor[p.id], drop: p.id })}>
                              Map
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: p.id, status: "retired" })}>Reject</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-wrap items-start gap-6">
          <Card className="min-w-0 flex-[1_1_280px] md:max-w-sm">
            <CardContent className="space-y-3 pt-6">
              <div className="flex gap-2">
                <Input aria-label="Filter or name a new term" placeholder={`Filter ${facetLabel[facet].toLowerCase()} terms`} value={filter} onChange={(e) => setFilter(e.target.value)} />
                <Button size="icon" aria-label="Add term" onClick={() => add.mutate()}><Plus className="h-4 w-4" /></Button>
              </div>
              {isLoading ? (
                <p className="text-muted-foreground">Loading…</p>
              ) : (
                <ul className="max-h-[520px] space-y-0.5 overflow-y-auto">
                  {tree.map(({ term, depth }) => (
                    <li key={term.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(term.id)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm",
                          selectedId === term.id ? "bg-primary/10 font-bold text-primary" : "hover:bg-muted",
                          term.status === "retired" && "text-muted-foreground line-through",
                        )}
                        style={{ paddingLeft: 12 + depth * 22 }}
                      >
                        {term.hex && <span className="h-3 w-3 rounded" style={{ background: term.hex }} aria-hidden="true" />}
                        {term.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">Type a word and press + to add it as a new {facetLabel[facet].toLowerCase()} term.</p>
            </CardContent>
          </Card>

          <Card className="min-w-0 flex-[999_1_460px]">
            <CardContent className="space-y-5 pt-6">
              {!selected || !draft ? (
                <p className="text-muted-foreground">Pick a term to edit its label, parent and synonyms.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-muted-foreground">{facetLabel[selected.facet]} · {selected.slug}</span>
                    <StatusBadge status={selected.status} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="term-label">Label</Label>
                      <Input id="term-label" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Parent</Label>
                      <Select value={draft.parent} onValueChange={(v) => setDraft({ ...draft, parent: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>No parent</SelectItem>
                          {list.filter((x) => x.facet === selected.facet && x.id !== selected.id && x.status === "active").map((x) => (
                            <SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selected.facet === "color" && (
                      <div className="space-y-2">
                        <Label htmlFor="term-hex">Swatch</Label>
                        <div className="flex gap-2">
                          <Input id="term-hex" value={draft.hex} placeholder="#5B2E45" onChange={(e) => setDraft({ ...draft, hex: e.target.value })} />
                          <span className="h-10 w-10 shrink-0 rounded-lg border" style={{ background: draft.hex || "transparent" }} aria-hidden="true" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Synonyms</Label>
                    <div className="flex flex-wrap gap-2">
                      {draft.synonyms.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 pl-3 pr-1 text-sm font-semibold text-primary">
                          {s}
                          <button type="button" aria-label={`Remove ${s}`} className="rounded-full p-1 hover:bg-primary/10" onClick={() => setDraft({ ...draft, synonyms: draft.synonyms.filter((x) => x !== s) })}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const s = newSyn.trim().toLowerCase();
                          if (s && !draft.synonyms.includes(s)) setDraft({ ...draft, synonyms: [...draft.synonyms, s] });
                          setNewSyn("");
                        }}
                      >
                        <Input aria-label="New synonym" className="h-9 w-44" placeholder="Add synonym" value={newSyn} onChange={(e) => setNewSyn(e.target.value)} />
                      </form>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-end gap-3 border-t pt-4">
                    <div className="space-y-2">
                      <Label>Merge into</Label>
                      <Select value={mergeTarget} onValueChange={setMergeTarget}>
                        <SelectTrigger className="w-56"><SelectValue placeholder="Pick the term to keep" /></SelectTrigger>
                        <SelectContent>
                          {list.filter((x) => x.facet === selected.facet && x.id !== selected.id && x.status === "active").map((x) => (
                            <SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline" disabled={!mergeTarget} onClick={() => setConfirmMerge(true)}>Merge</Button>
                    {selected.status === "active" ? (
                      <Button variant="ghost" onClick={() => setStatus.mutate({ id: selected.id, status: "retired" })}>Retire</Button>
                    ) : (
                      <Button variant="ghost" onClick={() => setStatus.mutate({ id: selected.id, status: "active" })}>Make active</Button>
                    )}
                    <Button className="ml-auto" onClick={() => save.mutate()} disabled={save.isPending}>Save term</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Merging moves every scheme, rule and detection to the kept term; this label becomes its synonym. Retired terms stay on old schemes but leave every picker.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog open={confirmMerge} onOpenChange={setConfirmMerge}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Merge &ldquo;{selected?.label}&rdquo; into &ldquo;{terms?.byId.get(mergeTarget)?.label}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              Every scheme, rule and detection using &ldquo;{selected?.label}&rdquo; will use &ldquo;{terms?.byId.get(mergeTarget)?.label}&rdquo; instead. This can&apos;t be undone from here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selected && merge.mutate({ keep: mergeTarget, drop: selected.id })}>Merge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
