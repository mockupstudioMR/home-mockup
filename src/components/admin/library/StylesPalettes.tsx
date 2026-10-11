import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { TermChip, facetLabel, useTerms } from "./shared";

const NONE = "__none";
const ROLES = ["main", "accent", "neutral", "wood", "metal"] as const;
const VERDICT: Record<string, { label: string; cls: string }> = {
  works: { label: "Goes with", cls: "bg-emerald-100 text-emerald-800" },
  avoid: { label: "Avoid with", cls: "bg-red-100 text-red-800" },
  neutral: { label: "Neutral", cls: "bg-muted text-muted-foreground" },
};

export default function StylesPalettes() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Styles, palettes &amp; rules</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          What each style means, which colours belong together, and the pairings the matching engine should prefer or avoid.
        </p>
      </div>
      <StylesSection />
      <PalettesSection />
      <RulesSection />
    </div>
  );
}

function StylesSection() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: terms } = useTerms();
  const styles = useMemo(() => terms?.list.filter((t) => t.facet === "style" && t.status === "active") ?? [], [terms]);
  const [styleId, setStyleId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ description: "", prompt_fragment: "", mood: "", palette: NONE });

  useEffect(() => {
    if (!styleId && styles.length) setStyleId(styles[0].id);
  }, [styles, styleId]);

  const { data: defs } = useQuery({
    queryKey: ["style-definitions"],
    queryFn: async () => (await supabase.from("style_definitions").select("*")).data ?? [],
  });
  const { data: palettes } = useQuery({
    queryKey: ["palettes"],
    queryFn: async () => (await supabase.from("palettes").select("*, palette_colors(position, color_id, role)").order("name")).data ?? [],
  });
  const { data: counts } = useQuery({
    queryKey: ["style-scheme-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("furniture_schemes").select("style_id").eq("status", "active").limit(5000);
      const m = new Map<string, number>();
      (data ?? []).forEach((s) => s.style_id && m.set(s.style_id, (m.get(s.style_id) ?? 0) + 1));
      return m;
    },
  });

  useEffect(() => {
    const d = defs?.find((x) => x.style_id === styleId);
    setDraft({
      description: d?.description ?? "",
      prompt_fragment: d?.prompt_fragment ?? "",
      mood: (d?.mood_keywords ?? []).join(", "),
      palette: d?.default_palette_id ?? NONE,
    });
  }, [defs, styleId]);

  const save = useMutation({
    mutationFn: async () => {
      if (!styleId) return;
      const { error } = await supabase.from("style_definitions").upsert({
        style_id: styleId,
        description: draft.description || null,
        prompt_fragment: draft.prompt_fragment || null,
        mood_keywords: draft.mood.split(",").map((s) => s.trim()).filter(Boolean),
        default_palette_id: draft.palette === NONE ? null : draft.palette,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["style-definitions"] });
      toast({ title: "Style saved" });
    },
    onError: (e: Error) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Styles</CardTitle>
        <CardDescription>Add new styles in Vocabulary → Style; describe them here.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-2 md:max-w-xs">
          {styles.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStyleId(s.id)}
              className={cn("rounded-xl border p-3 text-left", styleId === s.id ? "border-2 border-primary bg-background" : "bg-muted/40")}
            >
              <p className="font-semibold">{s.label}</p>
              <p className="text-xs text-muted-foreground">{counts?.get(s.id) ?? 0} schemes</p>
            </button>
          ))}
        </div>
        {styleId && (
          <div className="min-w-0 flex-[999_1_420px] space-y-4">
            <div className="space-y-2">
              <Label htmlFor="style-desc">Description shown to users</Label>
              <Textarea id="style-desc" rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="style-prompt">Prompt fragment (added to design generation)</Label>
              <Textarea id="style-prompt" rows={2} value={draft.prompt_fragment} onChange={(e) => setDraft({ ...draft, prompt_fragment: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="style-mood">Mood words, comma separated</Label>
                <Input id="style-mood" value={draft.mood} onChange={(e) => setDraft({ ...draft, mood: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Default palette</Label>
                <Select value={draft.palette} onValueChange={(v) => setDraft({ ...draft, palette: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {(palettes ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>Save style</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PalettesSection() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: terms } = useTerms();
  const colors = terms?.list.filter((t) => t.facet === "color" && t.status === "active") ?? [];
  const styles = terms?.list.filter((t) => t.facet === "style" && t.status === "active") ?? [];
  const [name, setName] = useState("");
  const [style, setStyle] = useState(NONE);
  const [picked, setPicked] = useState<{ color_id: string; role: string }[]>([]);

  const { data: palettes } = useQuery({
    queryKey: ["palettes"],
    queryFn: async () => (await supabase.from("palettes").select("*, palette_colors(position, color_id, role)").order("name")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!name.trim() || picked.length < 2) throw new Error("Name the palette and pick at least two colours.");
      const { data: p, error } = await supabase.from("palettes").insert({ name: name.trim(), style_id: style === NONE ? null : style }).select("id").single();
      if (error) throw error;
      const { error: cErr } = await supabase
        .from("palette_colors")
        .insert(picked.map((c, i) => ({ palette_id: p.id, position: i + 1, color_id: c.color_id, role: c.role as Tables<"palette_colors">["role"] })));
      if (cErr) throw cErr;
    },
    onSuccess: () => {
      setName("");
      setPicked([]);
      qc.invalidateQueries({ queryKey: ["palettes"] });
      toast({ title: "Palette added" });
    },
    onError: (e: Error) => toast({ title: "Could not add the palette", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("palettes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["palettes"] }),
  });

  const t = (id: string) => terms?.byId.get(id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Palettes</CardTitle>
        <CardDescription>Colours from the vocabulary with a role each; link a palette to a style.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(palettes ?? []).map((p) => {
            const cols = [...(p.palette_colors as { position: number; color_id: string; role: string | null }[])].sort((a, b) => a.position - b.position);
            return (
              <div key={p.id} className="space-y-3 rounded-2xl border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.style_id ? t(p.style_id)?.label : "No style"}</p>
                  </div>
                  <Button size="icon" variant="ghost" aria-label={`Delete ${p.name}`} onClick={() => remove.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="flex h-14 overflow-hidden rounded-xl" aria-hidden="true">
                  {cols.map((c) => <span key={c.position} className="flex-1" style={{ background: t(c.color_id)?.hex ?? "#ccc" }} />)}
                </div>
                <p className="text-xs text-muted-foreground">{cols.map((c) => `${c.role ?? "colour"} · ${t(c.color_id)?.label}`).join("  ·  ")}</p>
              </div>
            );
          })}
        </div>
        <div className="space-y-3 border-t pt-5">
          <p className="font-semibold">New palette</p>
          <div className="flex flex-wrap gap-3">
            <Input aria-label="Palette name" className="w-56" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No style</SelectItem>
                {styles.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            {picked.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-2 rounded-xl border p-1 pl-2">
                <TermChip term={t(c.color_id)} />
                <Select value={c.role} onValueChange={(v) => setPicked((p) => p.map((x, j) => (j === i ? { ...x, role: v } : x)))}>
                  <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Remove colour" onClick={() => setPicked((p) => p.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
              </span>
            ))}
            <Select value="" onValueChange={(v) => setPicked((p) => [...p, { color_id: v, role: p.length ? "accent" : "main" }].slice(0, 12))}>
              <SelectTrigger className="h-10 w-44"><SelectValue placeholder="+ Add colour" /></SelectTrigger>
              <SelectContent>{colors.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={() => create.mutate()} disabled={create.isPending}><Plus className="mr-2 h-4 w-4" /> Add palette</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RulesSection() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: terms } = useTerms();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [verdict, setVerdict] = useState("works");
  const [strength, setStrength] = useState("3");
  const [reason, setReason] = useState("");
  const pickable = terms?.list.filter((x) => x.status === "active" && ["color", "style", "material", "finish", "shape", "pattern"].includes(x.facet)) ?? [];
  const t = (id: string) => terms?.byId.get(id);

  const { data } = useQuery({
    queryKey: ["compat-rules"],
    queryFn: async () => {
      const [{ data: rules }, { data: pairs }] = await Promise.all([
        supabase.from("compatibility_rules").select("*").order("created_at", { ascending: false }),
        supabase.from("mv_term_pair_scores").select("*").order("combinations", { ascending: false }).limit(200),
      ]);
      return { rules: rules ?? [], pairs: pairs ?? [] };
    },
  });
  const evidence = (x: string, y: string) => data?.pairs.find((p) => p.term_a === x && p.term_b === y);
  const ruleSet = new Set((data?.rules ?? []).map((r) => `${r.term_a_id}|${r.term_b_id}`));
  const suggestions = (data?.pairs ?? []).filter((p) => p.term_a && p.term_b && Number(p.combinations) >= 3 && !ruleSet.has(`${p.term_a}|${p.term_b}`)).slice(0, 5);

  const add = useMutation({
    mutationFn: async (r?: { a: string; b: string; verdict: string; reason: string }) => {
      const x = r?.a ?? a;
      const y = r?.b ?? b;
      if (!x || !y || x === y) throw new Error("Pick two different words.");
      const [lo, hi] = x < y ? [x, y] : [y, x];
      const { error } = await supabase.from("compatibility_rules").insert({
        term_a_id: lo,
        term_b_id: hi,
        verdict: r?.verdict ?? verdict,
        strength: Number(strength),
        reason: (r?.reason ?? reason) || null,
        source: r ? "learned" : "expert",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setA("");
      setB("");
      setReason("");
      qc.invalidateQueries({ queryKey: ["compat-rules"] });
      toast({ title: "Rule added" });
    },
    onError: (e: Error) => toast({ title: "Could not add the rule", description: e.message.includes("duplicate") ? "A rule for this pair already exists." : e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("compatibility_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compat-rules"] }),
  });

  const termSelect = (value: string, set: (v: string) => void, label: string) => (
    <Select value={value} onValueChange={set}>
      <SelectTrigger className="w-52" aria-label={label}><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>{pickable.map((x) => <SelectItem key={x.id} value={x.id}>{facetLabel[x.facet]} · {x.label}</SelectItem>)}</SelectContent>
    </Select>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compatibility rules</CardTitle>
        <CardDescription>Pairs the matching engine should prefer or avoid, with what the data already says about each pair.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Word</TableHead>
                <TableHead>Rule</TableHead>
                <TableHead>With</TableHead>
                <TableHead>Strength</TableHead>
                <TableHead>What the data says</TableHead>
                <TableHead><span className="sr-only">Delete</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.rules ?? []).length === 0 && <TableRow><TableCell colSpan={6} className="text-muted-foreground">No rules yet.</TableCell></TableRow>}
              {(data?.rules ?? []).map((r) => {
                const ev = evidence(r.term_a_id, r.term_b_id);
                return (
                  <TableRow key={r.id}>
                    <TableCell><TermChip term={t(r.term_a_id)} /></TableCell>
                    <TableCell><span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", VERDICT[r.verdict]?.cls)}>{VERDICT[r.verdict]?.label}</span></TableCell>
                    <TableCell><TermChip term={t(r.term_b_id)} /></TableCell>
                    <TableCell>{r.strength}/5</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ev ? `Together in ${ev.combinations} combinations · score ${Number(ev.score).toFixed(2)}` : "Not enough data yet"}
                      {r.reason ? ` · ${r.reason}` : ""}
                    </TableCell>
                    <TableCell><Button size="icon" variant="ghost" aria-label="Delete rule" onClick={() => remove.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-2 rounded-2xl bg-primary/5 p-4">
            <p className="text-sm font-semibold">Suggested from the data</p>
            {suggestions.map((p) => (
              <div key={`${p.term_a}${p.term_b}`} className="flex flex-wrap items-center gap-2 text-sm">
                <TermChip term={t(p.term_a!)} /> with <TermChip term={t(p.term_b!)} />
                <span className="text-muted-foreground">together in {p.combinations} combinations · score {Number(p.score).toFixed(2)}</span>
                <Button size="sm" variant="outline" className="ml-auto" onClick={() => add.mutate({ a: p.term_a!, b: p.term_b!, verdict: Number(p.score) >= 0.5 ? "works" : "avoid", reason: "suggested from combinations" })}>
                  Add as rule
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3 border-t pt-5">
          {termSelect(a, setA, "First word")}
          <Select value={verdict} onValueChange={setVerdict}>
            <SelectTrigger className="w-36" aria-label="Rule"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="works">Goes with</SelectItem>
              <SelectItem value="avoid">Avoid with</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
            </SelectContent>
          </Select>
          {termSelect(b, setB, "Second word")}
          <Select value={strength} onValueChange={setStrength}>
            <SelectTrigger className="w-28" aria-label="Strength"><SelectValue /></SelectTrigger>
            <SelectContent>{[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}/5</SelectItem>)}</SelectContent>
          </Select>
          <Input aria-label="Reason" className="w-56" placeholder="Why (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button onClick={() => add.mutate(undefined)} disabled={add.isPending}><Plus className="mr-2 h-4 w-4" /> Add rule</Button>
        </div>
      </CardContent>
    </Card>
  );
}
