import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, FileImage, Link2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge, useTerms } from "../library/shared";
import BatchResult from "./BatchResult";

type Batch = Tables<"ingest_batches">;

const SOURCE_TYPES = [
  { value: "room_photo", label: "Room photo", hint: "A real room you like" },
  { value: "catalogue_page", label: "Catalogue page", hint: "One design per page" },
  { value: "generated_design", label: "Generated design", hint: "A Home Mockup preview" },
  { value: "retailer_link", label: "Retailer link", hint: "A product or room-set page" },
] as const;

const sha256 = async (file: File) => {
  const buf = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

/** Runs detection image by image so one slow image never times out the whole batch. */
export async function runDetection(itemIds: string[], onProgress?: (done: number) => void) {
  let done = 0;
  const errors: string[] = [];
  for (const itemId of itemIds) {
    const { data, error } = await supabase.functions.invoke("detect-schemes", { body: { itemId } });
    if (error || data?.error) errors.push(data?.error ?? error?.message ?? "Detection failed");
    done += 1;
    onProgress?.(done);
  }
  return errors;
}

export default function ScanUpload() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: terms } = useTerms();
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  const [openBatch, setOpenBatch] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState("");
  const [showLinks, setShowLinks] = useState(false);
  const [name, setName] = useState("");
  const [sourceType, setSourceType] = useState<string>("room_photo");
  const [roomType, setRoomType] = useState<string>("none");
  const [styleHint, setStyleHint] = useState<string>("none");
  const [credit, setCredit] = useState("");
  const [creditUrl, setCreditUrl] = useState("");
  const [threshold, setThreshold] = useState(0.85);
  const [reviewAll, setReviewAll] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const roomTypes = useMemo(() => terms?.list.filter((t) => t.facet === "room_type" && t.status === "active") ?? [], [terms]);
  const styles = useMemo(() => terms?.list.filter((t) => t.facet === "style" && t.status === "active") ?? [], [terms]);

  const { data: settings } = useQuery({
    queryKey: ["scan-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("cms_content").select("value").eq("key", "scan_settings").maybeSingle();
      try {
        return JSON.parse(data?.value ?? "{}") as { auto_save_threshold?: number };
      } catch {
        return {};
      }
    },
  });
  const defaultThreshold = settings?.auto_save_threshold ?? 0.85;

  const { data: batches, isLoading } = useQuery({
    queryKey: ["ingest-batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ingest_batches")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Batch[];
    },
    refetchInterval: (q) => ((q.state.data as Batch[] | undefined)?.some((b) => b.status === "detecting") ? 4000 : false),
  });

  const linkList = links
    .split(/\s+/)
    .map((l) => l.trim())
    .filter((l) => /^https?:\/\//i.test(l));
  const itemCount = files.length + linkList.length;

  const reset = () => {
    setFiles([]);
    setLinks("");
    setName("");
    setCredit("");
    setCreditUrl("");
    setReviewAll(false);
    setThreshold(defaultThreshold);
  };

  const start = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { data: batch, error } = await supabase
        .from("ingest_batches")
        .insert({
          name: name.trim() || `Batch ${new Date().toLocaleString()}`,
          source_type: sourceType,
          room_type_id: roomType === "none" ? null : roomType,
          style_hint_id: styleHint === "none" ? null : styleHint,
          source_credit: credit.trim() || null,
          source_url: creditUrl.trim() || null,
          threshold,
          review_all: reviewAll,
          status: "detecting",
          created_by: auth.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      const itemIds: string[] = [];
      let duplicates = 0;
      for (const file of files) {
        const hash = await sha256(file);
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${batch.id}/${crypto.randomUUID()}.${ext}`;
        const { data: dup } = await supabase.from("ingest_items").select("id").eq("file_hash", hash).neq("status", "duplicate").maybeSingle();
        if (dup) {
          duplicates += 1;
          await supabase.from("ingest_items").insert({ batch_id: batch.id, status: "duplicate", error: `Same image as ${dup.id}` });
          continue;
        }
        const up = await supabase.storage.from("admin-scans").upload(path, file, { contentType: file.type || undefined });
        if (up.error) throw up.error;
        const { data: item, error: itemErr } = await supabase
          .from("ingest_items")
          .insert({ batch_id: batch.id, storage_path: path, file_hash: hash })
          .select("id")
          .single();
        if (itemErr) throw itemErr;
        itemIds.push(item.id);
      }
      for (const url of linkList) {
        const { data: item, error: itemErr } = await supabase
          .from("ingest_items")
          .insert({ batch_id: batch.id, source_url: url })
          .select("id")
          .single();
        if (itemErr) throw itemErr;
        itemIds.push(item.id);
      }

      setProgress({ done: 0, total: itemIds.length });
      setOpenBatch(batch.id);
      qc.invalidateQueries({ queryKey: ["ingest-batches"] });
      const errors = await runDetection(itemIds, (done) => {
        setProgress({ done, total: itemIds.length });
        qc.invalidateQueries({ queryKey: ["batch-detail", batch.id] });
      });
      return { batch, errors, duplicates };
    },
    onSuccess: ({ errors, duplicates }) => {
      setProgress(null);
      reset();
      qc.invalidateQueries({ queryKey: ["ingest-batches"] });
      qc.invalidateQueries({ queryKey: ["review-queue"] });
      qc.invalidateQueries({ queryKey: ["admin-terms"] });
      toast({
        title: "Detection finished",
        description: [
          errors.length ? `${errors.length} image(s) could not be read.` : "",
          duplicates ? `${duplicates} duplicate image(s) skipped.` : "",
        ]
          .filter(Boolean)
          .join(" ") || "Open the batch to see what was found.",
        variant: errors.length ? "destructive" : "default",
      });
    },
    onError: (e: Error) => {
      setProgress(null);
      toast({ title: "Could not start the batch", description: e.message, variant: "destructive" });
    },
  });

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const images = Array.from(list).filter((f) => f.type.startsWith("image/"));
    if (images.length < list.length) {
      toast({ title: "Only images for now", description: "Export PDF pages as images and drop them in." });
    }
    setFiles((prev) => [...prev, ...images].slice(0, 50));
  };

  if (openBatch) return <BatchResult batchId={openBatch} onBack={() => setOpenBatch(null)} progress={progress} />;

  const shown = (batches ?? []).filter((b) => filter === "all" || b.status === filter);
  const count = (s: string) => (batches ?? []).filter((b) => b.status === s).length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Scan &amp; upload</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Feed the system designs you trust. AI finds every piece, saves the ones it&apos;s sure of as schemes, and sends the rest to review.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
          >
            <Upload className="h-10 w-10 text-primary" aria-hidden="true" />
            <p className="text-lg font-semibold">Drop room photos, catalogue pages or generated designs here</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button type="button" onClick={() => fileInput.current?.click()}>
                <FileImage className="mr-2 h-4 w-4" /> Upload images
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowLinks((v) => !v)}>
                <Link2 className="mr-2 h-4 w-4" /> Paste links
              </Button>
              <Button type="button" variant="secondary" onClick={() => cameraInput.current?.click()}>
                <Camera className="mr-2 h-4 w-4" /> Scan with camera
              </Button>
            </div>
            <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
            <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => addFiles(e.target.files)} />
            <p className="text-sm text-muted-foreground">The same image twice is spotted and skipped.</p>
          </div>

          {showLinks && (
            <div className="space-y-2">
              <Label htmlFor="scan-links">Image links, one per line</Label>
              <Textarea id="scan-links" value={links} onChange={(e) => setLinks(e.target.value)} placeholder="https://…" rows={3} />
            </div>
          )}

          {files.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {files.map((f, i) => (
                <div key={`${f.name}-${i}`} className="relative h-24 w-32 overflow-hidden rounded-xl bg-muted">
                  <img src={URL.createObjectURL(f)} alt={f.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {itemCount > 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="batch-name">Batch name</Label>
                <Input id="batch-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Living rooms · plum & green" />
              </div>
              <div className="space-y-2">
                <Label>Source type</Label>
                <Select value={sourceType} onValueChange={setSourceType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label} · {s.hint}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Room type (optional)</Label>
                <Select value={roomType} onValueChange={setRoomType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    {roomTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Style hint (used only if the AI can&apos;t decide)</Label>
                <Select value={styleHint} onValueChange={setStyleHint}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No hint</SelectItem>
                    {styles.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-credit">Source credit</Label>
                <Input id="batch-credit" value={credit} onChange={(e) => setCredit(e.target.value)} placeholder="Shop, designer or magazine" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-url">Source link (optional)</Label>
                <Input id="batch-url" value={creditUrl} onChange={(e) => setCreditUrl(e.target.value)} placeholder="https://" />
              </div>
              <div className="space-y-3 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label>Save automatically when the AI is at least</Label>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{threshold.toFixed(2)} sure</span>
                </div>
                <Slider min={0.5} max={1} step={0.05} value={[threshold]} onValueChange={([v]) => setThreshold(v)} aria-label="Auto-save threshold" />
                <p className="text-sm text-muted-foreground">
                  A piece with a word we don&apos;t know always goes to review, whatever this is set to.
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 md:col-span-2">
                <div>
                  <p className="font-semibold">Review every piece in this batch</p>
                  <p className="text-sm text-muted-foreground">Turn on for a messy batch or a new source.</p>
                </div>
                <Switch checked={reviewAll} onCheckedChange={setReviewAll} aria-label="Review every piece in this batch" />
              </div>
              <div className="flex justify-end md:col-span-2">
                <Button size="lg" disabled={start.isPending} onClick={() => start.mutate()}>
                  {start.isPending ? "Uploading…" : `Start detecting ${itemCount} image${itemCount === 1 ? "" : "s"}`}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Batches</CardTitle>
            <CardDescription>Everything scanned so far</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["all", `All ${batches?.length ?? 0}`],
              ["needs_review", `Needs review ${count("needs_review")}`],
              ["detecting", `Detecting ${count("detecting")}`],
              ["done", `Done ${count("done")}`],
              ["failed", `Failed ${count("failed")}`],
            ].map(([v, l]) => (
              <Button key={v} size="sm" variant={filter === v ? "default" : "outline"} onClick={() => setFilter(v)}>
                {l}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : shown.length === 0 ? (
            <p className="text-muted-foreground">No batches yet. Drop a few designs above to start.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Found</TableHead>
                    <TableHead>Saved</TableHead>
                    <TableHead>Waiting</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((b) => (
                    <TableRow key={b.id} className="cursor-pointer" onClick={() => setOpenBatch(b.id)}>
                      <TableCell>
                        <button type="button" className="text-left font-semibold text-primary hover:underline" onClick={() => setOpenBatch(b.id)}>
                          {b.name}
                        </button>
                        <div className="text-sm text-muted-foreground">{new Date(b.created_at).toLocaleString()}</div>
                      </TableCell>
                      <TableCell>{SOURCE_TYPES.find((s) => s.value === b.source_type)?.label ?? b.source_type}</TableCell>
                      <TableCell>{b.found_count}</TableCell>
                      <TableCell>{b.saved_count}</TableCell>
                      <TableCell>{b.waiting_count}</TableCell>
                      <TableCell><StatusBadge status={b.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {progress && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold">Detecting {progress.done} of {progress.total}</p>
              <Progress value={(progress.done / Math.max(1, progress.total)) * 100} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
