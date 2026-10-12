/**
 * The files picked for a new scan batch, and the progress of batches being detected. Kept outside React,
 * so detection keeps running when the admin leaves the page ("Run in background").
 */
import { supabase } from "@/lib/looseDb";

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());
export const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export type Pending = { files: File[]; links: string[] };
let pending: Pending = { files: [], links: [] };
export const getPending = () => pending;
export const setPending = (p: Partial<Pending>) => {
  pending = { ...pending, ...p };
  emit();
};

export type Progress = { batchId: string; total: number; done: number; current?: string; errors: string[]; finished: boolean };
const progress = new Map<string, Progress>();
export const getProgress = (batchId: string) => progress.get(batchId);

const sha256 = async (file: Blob) => {
  const buf = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

/** Split a PDF into one JPEG per page (each page counts as one design). */
export async function pdfToImages(file: File, maxPages = 30): Promise<File[]> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const out: File[] = [];
  for (let i = 1; i <= Math.min(doc.numPages, maxPages); i++) {
    const page = await doc.getPage(i);
    const vp = page.getViewport({ scale: 1.6 });
    const canvas = document.createElement("canvas");
    canvas.width = vp.width;
    canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.85));
    out.push(new File([blob], `${file.name.replace(/\.pdf$/i, "")}-p${i}.jpg`, { type: "image/jpeg" }));
  }
  return out;
}

export type BatchSetup = {
  name: string;
  sourceType: string;
  roomTypeId: string | null;
  styleHintId: string | null;
  credit: string;
  creditUrl: string;
  threshold: number;
  reviewAll: boolean;
};

/** Create the batch, upload its images (skipping duplicates), then detect image by image. Returns the batch id at once. */
export async function startBatch(setup: BatchSetup, onDone?: (p: Progress) => void): Promise<string> {
  const { files, links } = pending;
  const { data: auth } = await supabase.auth.getUser();
  const { data: batch, error } = await supabase
    .from("ingest_batches")
    .insert({
      name: setup.name.trim() || `Batch ${new Date().toLocaleString()}`,
      source_type: setup.sourceType,
      room_type_id: setup.roomTypeId,
      style_hint_id: setup.styleHintId,
      source_credit: setup.credit.trim() || null,
      source_url: setup.creditUrl.trim() || null,
      threshold: setup.threshold,
      review_all: setup.reviewAll,
      status: "detecting",
      created_by: auth.user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  const p: Progress = { batchId: batch.id, total: files.length + links.length, done: 0, errors: [], finished: false };
  progress.set(batch.id, p);
  setPending({ files: [], links: [] });

  (async () => {
    const ids: { id: string; name: string }[] = [];
    for (const file of files) {
      const hash = await sha256(file);
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${batch.id}/${crypto.randomUUID()}.${ext}`;
      const { data: dup } = await supabase.from("ingest_items").select("id").eq("file_hash", hash).neq("status", "duplicate").maybeSingle();
      if (dup) {
        await supabase.from("ingest_items").insert({ batch_id: batch.id, status: "duplicate", error: `Same image as ${dup.id}` });
        p.total -= 1;
        continue;
      }
      const up = await supabase.storage.from("admin-scans").upload(path, file, { contentType: file.type || undefined });
      if (up.error) {
        p.errors.push(up.error.message);
        continue;
      }
      const { data: item } = await supabase.from("ingest_items").insert({ batch_id: batch.id, storage_path: path, file_hash: hash }).select("id").single();
      if (item) ids.push({ id: item.id, name: file.name });
      emit();
    }
    for (const url of links) {
      const { data: item } = await supabase.from("ingest_items").insert({ batch_id: batch.id, source_url: url }).select("id").single();
      if (item) ids.push({ id: item.id, name: url });
    }
    for (const it of ids) {
      p.current = it.name;
      emit();
      const { data, error: e } = await supabase.functions.invoke("detect-schemes", { body: { itemId: it.id } });
      if (e || data?.error) p.errors.push(data?.error ?? e?.message ?? "Detection failed");
      p.done += 1;
      emit();
    }
    p.finished = true;
    p.current = undefined;
    emit();
    onDone?.(p);
  })().catch((e) => {
    p.errors.push(String(e?.message ?? e));
    p.finished = true;
    emit();
  });
  return batch.id;
}

/** Detect again the images of a batch that failed. */
export async function retryFailed(batchId: string) {
  const { data: items } = await supabase.from("ingest_items").select("id").eq("batch_id", batchId).eq("status", "failed");
  const errors: string[] = [];
  for (const it of items ?? []) {
    const { data, error } = await supabase.functions.invoke("detect-schemes", { body: { itemId: it.id } });
    if (error || data?.error) errors.push(data?.error ?? error?.message ?? "Detection failed");
  }
  return errors;
}
