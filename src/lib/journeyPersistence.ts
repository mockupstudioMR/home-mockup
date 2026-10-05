/**
 * Persistence helpers: mirror everything the homeowner journey creates
 * (moodboard AI images, added products, style prompts, design metadata)
 * to the database so it can be recalled instead of regenerated.
 *
 * All functions are fire-and-forget: they swallow errors and log them so
 * a persistence failure never blocks the UI.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

const BUCKET = "moodboard-assets";

async function getUserId(): Promise<string | undefined> {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ?? undefined;
}

async function getSessionId(userId: string): Promise<string | undefined> {
  const { data } = await supabase
    .from("journey_sessions")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.id as string | undefined) ?? undefined;
}

/** Download a remote image and re-upload to our private bucket. */
async function mirrorToStorage(
  sourceUrl: string,
  userId: string,
  section: string,
): Promise<{ url: string; path: string } | null> {
  try {
    // Data URLs get uploaded as-is.
    let blob: Blob;
    if (sourceUrl.startsWith("data:")) {
      const res = await fetch(sourceUrl);
      blob = await res.blob();
    } else if (sourceUrl.startsWith("http")) {
      // Skip mirroring if it's already in our storage.
      if (sourceUrl.includes(`/storage/v1/object/`) && sourceUrl.includes(`${BUCKET}/`)) {
        return null;
      }
      const res = await fetch(sourceUrl, { mode: "cors" });
      if (!res.ok) return null;
      blob = await res.blob();
    } else {
      return null;
    }
    const ext = (blob.type.split("/")[1] || "png").split(";")[0];
    const path = `${userId}/${section}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: blob.type || "image/png", upsert: false });
    if (error) {
      console.error(`[journeyPersistence] upload to "${BUCKET}" failed: ${error.message}`);
      return null;
    }
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365);
    return { url: signed?.signedUrl || sourceUrl, path };
  } catch (e) {
    console.warn("[journeyPersistence] mirror failed", e);
    return null;
  }
}

export interface SaveMoodboardAssetInput {
  section: "architecture" | "colors" | "materials" | "furniture" | "decor" | "must_include";
  label?: string;
  prompt?: string;
  imageUrl: string;
  kind?: "ai" | "upload" | "reference";
  isPinned?: boolean;
  designId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function saveMoodboardAsset(input: SaveMoodboardAssetInput): Promise<void> {
  try {
    const userId = await getUserId();
    if (!userId) return;
    const sessionId = await getSessionId(userId);
    const mirrored = await mirrorToStorage(input.imageUrl, userId, input.section);
    // Never store an inline base64 image in the table: if the upload failed,
    // skip this asset rather than writing megabytes into a row.
    if (!mirrored && input.imageUrl.startsWith("data:")) {
      console.error("[journeyPersistence] moodboard asset not saved: image upload failed");
      return;
    }
    const finalUrl = mirrored?.url || input.imageUrl;
    const { error: insertError } = await supabase.from("moodboard_assets").insert({
      user_id: userId,
      session_id: sessionId,
      design_id: input.designId ?? undefined,
      section: input.section,
      kind: input.kind || "ai",
      label: input.label ?? undefined,
      prompt: input.prompt ?? undefined,
      image_url: finalUrl,
      storage_path: mirrored?.path ?? undefined,
      is_pinned: !!input.isPinned,
      metadata: (input.metadata ?? {}) as Json,
    });
    if (insertError) console.error("[journeyPersistence] saveMoodboardAsset insert failed", insertError);
  } catch (e) {
    console.warn("[journeyPersistence] saveMoodboardAsset failed", e);
  }
}

export interface SaveJourneyProductInput {
  section?: string;
  name?: string;
  sourceUrl?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  designId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function saveJourneyProduct(input: SaveJourneyProductInput): Promise<void> {
  try {
    const userId = await getUserId();
    if (!userId) return;
    const sessionId = await getSessionId(userId);
    let storagePath: string | undefined;
    let finalImage: string | undefined = input.imageUrl || undefined;
    if (input.imageUrl) {
      const mirrored = await mirrorToStorage(input.imageUrl, userId, "products");
      if (mirrored) {
        storagePath = mirrored.path;
        finalImage = mirrored.url;
      } else if (input.imageUrl.startsWith("data:")) {
        // Upload failed: keep the row, but never store inline base64.
        finalImage = undefined;
      }
    }
    await supabase.from("journey_products").insert({
      user_id: userId,
      session_id: sessionId,
      design_id: input.designId ?? undefined,
      section: input.section ?? undefined,
      name: input.name ?? undefined,
      source_url: input.sourceUrl ?? undefined,
      image_url: finalImage,
      storage_path: storagePath,
      price: input.price ?? undefined,
      currency: input.currency ?? "EUR",
      metadata: (input.metadata ?? {}) as Json,
    });
  } catch (e) {
    console.warn("[journeyPersistence] saveJourneyProduct failed", e);
  }
}

export interface SaveStylePromptInput {
  prompt: string;
  inputKind?: "text" | "voice";
  generatedImageUrl?: string;
  metadata?: Record<string, unknown>;
}

export async function saveStylePrompt(input: SaveStylePromptInput): Promise<void> {
  try {
    const userId = await getUserId();
    if (!userId) return;
    const sessionId = await getSessionId(userId);
    let storagePath: string | undefined;
    let finalImage: string | undefined = input.generatedImageUrl || undefined;
    if (input.generatedImageUrl) {
      const mirrored = await mirrorToStorage(input.generatedImageUrl, userId, "style-prompts");
      if (mirrored) {
        storagePath = mirrored.path;
        finalImage = mirrored.url;
      } else if (input.generatedImageUrl.startsWith("data:")) {
        // Upload failed: keep the row, but never store inline base64.
        finalImage = undefined;
      }
    }
    await supabase.from("style_prompts").insert({
      user_id: userId,
      session_id: sessionId,
      input_kind: input.inputKind || "text",
      prompt: input.prompt,
      generated_image_url: finalImage,
      storage_path: storagePath,
      metadata: (input.metadata ?? {}) as Json,
    });
  } catch (e) {
    console.warn("[journeyPersistence] saveStylePrompt failed", e);
  }
}

export interface SaveDesignJourneyMetadataInput {
  designId: string;
  healthScore?: number;
  styleDna?: Record<string, unknown>;
  budget?: Record<string, unknown>;
  roadmap?: Record<string, unknown>;
  shopping?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export async function saveDesignJourneyMetadata(input: SaveDesignJourneyMetadataInput): Promise<void> {
  try {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from("design_journey_metadata").upsert(
      {
        user_id: userId,
        design_id: input.designId,
        health_score: input.healthScore ?? undefined,
        style_dna: (input.styleDna ?? {}) as Json,
        budget: (input.budget ?? {}) as Json,
        roadmap: (input.roadmap ?? {}) as Json,
        shopping: (input.shopping ?? {}) as Json,
        metadata: (input.metadata ?? {}) as Json,
      },
      { onConflict: "design_id" },
    );
  } catch (e) {
    console.warn("[journeyPersistence] saveDesignJourneyMetadata failed", e);
  }
}