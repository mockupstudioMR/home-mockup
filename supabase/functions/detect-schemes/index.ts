import "../_shared/language.ts";
// Admin scan pipeline: read one uploaded design (an ingest item), find every furniture piece,
// map the AI's words to the shared vocabulary, save sure pieces as furniture schemes and send
// the rest to the review queue. The admin page calls this once per image in a batch.
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/auth.ts";
import { fetchWithTimeout } from "../_shared/http.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

type Facet = "category" | "color" | "style" | "material";
const TAG_FACETS = ["finish", "shape", "pattern", "mood"] as const;

interface AiPiece {
  category?: string;
  color?: string;
  style?: string;
  material?: string;
  tags?: string[];
  confidence?: number;
  box?: { x: number; y: number; w: number; h: number };
}
interface AiResult {
  style?: string;
  pieces?: AiPiece[];
}

const DEFAULT_PROMPT = `You are cataloguing furniture in an interior design image for a design library.
List every piece of furniture, lighting, rug and large decor item that is clearly visible. Do not list walls, floors, ceilings or anything you cannot see.
For each piece give:
- category: what it is (e.g. "curved sofa", "lounge chair", "pendant", "rug")
- color: its main colour
- style: its design style
- material: its main material
- tags: up to 3 short extra words about finish, shape or pattern (e.g. "fluted", "brushed", "tufted")
- confidence: 0 to 1, how sure you are about the whole description
- box: where it is, as fractions of the image: {"x": left, "y": top, "w": width, "h": height}
Prefer these words when they fit:
{{VOCABULARY}}
Also give the overall style of the room.
Answer with JSON only: {"style": "...", "pieces": [{"category": "...", "color": "...", "style": "...", "material": "...", "tags": ["..."], "confidence": 0.9, "box": {"x": 0.1, "y": 0.5, "w": 0.3, "h": 0.4}}]}`;

const parseJson = (text: string): AiResult | null => {
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    try {
      return JSON.parse(match[0].replace(/,\s*([}\]])/g, "$1"));
    } catch {
      return null;
    }
  }
};

const clamp01 = (n: unknown) => Math.min(1, Math.max(0, Number(n) || 0));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const caller = await requireAdmin(req, corsHeaders);
  if (caller instanceof Response) return caller;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return json({ error: "AI is not configured (LOVABLE_API_KEY missing)." }, 500);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let itemId = "";
  try {
    ({ itemId } = await req.json());
  } catch {
    return json({ error: "Send { itemId }." }, 400);
  }
  if (!itemId) return json({ error: "Send { itemId }." }, 400);

  const { data: item, error: itemErr } = await db
    .from("ingest_items")
    .select("id, batch_id, storage_path, source_url, status")
    .eq("id", itemId)
    .single();
  if (itemErr || !item) return json({ error: "Image not found." }, 404);
  if (!["queued", "failed"].includes(item.status)) return json({ ok: true, skipped: true, status: item.status });

  const { data: batch } = await db
    .from("ingest_batches")
    .select("id, threshold, review_all, style_hint_id")
    .eq("id", item.batch_id)
    .single();
  if (!batch) return json({ error: "Batch not found." }, 404);

  const fail = async (message: string) => {
    await db.from("ingest_items").update({ status: "failed", error: message }).eq("id", itemId);
    await db.rpc("refresh_ingest_batch", { _batch: item.batch_id });
    return json({ error: message }, 502);
  };

  await db.from("ingest_items").update({ status: "detecting", error: null }).eq("id", itemId);
  await db.rpc("refresh_ingest_batch", { _batch: item.batch_id });

  // Image the model can read
  let imageUrl = item.source_url ?? "";
  if (item.storage_path) {
    const { data: signed, error } = await db.storage.from("admin-scans").createSignedUrl(item.storage_path, 900);
    if (error || !signed) return await fail("Could not read the uploaded image.");
    imageUrl = signed.signedUrl;
  }
  if (!imageUrl) return await fail("This item has no image.");

  // Vocabulary hint and prompt (editable as the prompt template "detect_schemes")
  const { data: terms } = await db
    .from("taxonomy_terms")
    .select("facet, label")
    .eq("status", "active")
    .in("facet", ["category", "color", "style", "material"])
    .limit(600);
  const byFacet: Record<string, string[]> = {};
  for (const t of terms ?? []) (byFacet[t.facet] ??= []).push(t.label);
  const vocabulary = Object.entries(byFacet)
    .map(([facet, labels]) => `${facet}: ${labels.slice(0, 120).join(", ")}`)
    .join("\n");
  const { data: tpl } = await db.from("prompt_templates").select("template").eq("template_key", "detect_schemes").maybeSingle();
  const prompt = (tpl?.template || DEFAULT_PROMPT).replace("{{VOCABULARY}}", vocabulary);

  let result: AiResult | null = null;
  try {
    const res = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: imageUrl } }] }],
        max_tokens: 4000,
      }),
    });
    if (res.status === 429) return await fail("The AI is busy. Try this image again in a minute.");
    if (res.status === 402) return await fail("AI credits are used up.");
    if (!res.ok) return await fail(`The AI could not read this image (${res.status}).`);
    const body = await res.json();
    result = parseJson(body.choices?.[0]?.message?.content ?? "");
  } catch (e) {
    return await fail(e instanceof Error ? e.message : "The AI did not answer.");
  }
  if (!result || !Array.isArray(result.pieces)) return await fail("The AI answer could not be read.");

  const resolve = async (facet: string, text?: string) => {
    if (!text || !text.trim()) return null;
    const { data } = await db.rpc("resolve_term", { _facet: facet, _text: text });
    return (data as string | null) ?? null;
  };

  let saved = 0;
  let waiting = 0;
  const threshold = Number(batch.threshold ?? 0.85);

  for (const piece of result.pieces.slice(0, 40)) {
    const ids: Partial<Record<Facet, string | null>> = {};
    const unknown: Facet[] = [];
    for (const facet of ["category", "color", "style", "material"] as Facet[]) {
      const text = piece[facet];
      ids[facet] = await resolve(facet, text);
      if (!ids[facet] && text && text.trim()) unknown.push(facet);
    }
    const tagIds: string[] = [];
    for (const tag of (piece.tags ?? []).slice(0, 3)) {
      for (const facet of TAG_FACETS) {
        const id = await resolve(facet, tag);
        if (id) {
          tagIds.push(id);
          break;
        }
      }
    }
    const confidence = clamp01(piece.confidence);
    const reason = unknown.length
      ? "new_word"
      : !ids.category || confidence < threshold
        ? "low_confidence"
        : batch.review_all
          ? "spot_check"
          : null;

    const box = piece.box
      ? { x: clamp01(piece.box.x), y: clamp01(piece.box.y), w: clamp01(piece.box.w), h: clamp01(piece.box.h) }
      : null;
    const { data: row, error } = await db
      .from("detected_pieces")
      .insert({
        item_id: itemId,
        box,
        category_id: ids.category ?? null,
        color_id: ids.color ?? null,
        style_id: ids.style ?? null,
        material_id: ids.material ?? null,
        tag_ids: [...new Set(tagIds)],
        raw: piece as unknown as Record<string, unknown>,
        confidence,
        review_reason: reason,
        status: "waiting",
      })
      .select("id")
      .single();
    if (error || !row) {
      console.error("[detect-schemes] could not store piece", error);
      continue;
    }

    // New words become proposed terms the admin accepts, maps or rejects in review.
    for (const facet of unknown) {
      const { data: termId } = await db.rpc("propose_term", { _facet: facet, _text: piece[facet]!, _piece: row.id });
      if (termId) await db.from("detected_pieces").update({ [`${facet}_id`]: termId }).eq("id", row.id);
    }

    if (!reason) {
      const { error: saveErr } = await db.rpc("save_detected_piece", { _piece: row.id, _confirmed: false });
      if (saveErr) {
        console.error("[detect-schemes] auto-save failed", saveErr);
        await db.from("detected_pieces").update({ review_reason: "low_confidence" }).eq("id", row.id);
        waiting++;
      } else saved++;
    } else waiting++;
  }

  const detectedStyle = await resolve("style", result.style);
  await db
    .from("ingest_items")
    .update({ status: "done", detected_style_id: detectedStyle ?? batch.style_hint_id ?? null })
    .eq("id", itemId);
  await db.rpc("save_ingest_combination", { _item: itemId });
  await db.rpc("refresh_ingest_batch", { _batch: item.batch_id });

  return json({ ok: true, found: result.pieces.length, saved, waiting });
});
