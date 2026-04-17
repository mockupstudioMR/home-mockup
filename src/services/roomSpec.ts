/**
 * RoomSpec service — DB as source of truth, sessionStorage as cache.
 *
 * Public API:
 *   - getActiveRoomId() / setActiveRoomId()
 *   - loadActiveRoomSpec()              read cache, fall back to DB
 *   - saveRoomSpec(spec)                upsert to DB + refresh cache + legacy mirrors
 *   - exportRoomSpec(spec)              trigger a JSON file download
 *   - fromLegacySession()               assemble a spec from legacy session keys
 *   - toLegacyFloorPlanContext(spec)    write legacy `floor_plan_context` mirror
 */

import { supabase } from "@/integrations/supabase/client";
import {
  ROOM_SPEC_VERSION,
  RoomSpec,
  RoomLayout,
  emptyRoomSpec,
} from "@/types/roomSpec";

const ACTIVE_ID_KEY = "room_spec_active_id";
const ACTIVE_SPEC_KEY = "room_spec_active";
const LEGACY_FLOOR_PLAN_KEY = "floor_plan_context";
const LEGACY_QUIZ_KEY = "quiz_data_cache";

/* ---------------- session helpers ---------------- */

export function getActiveRoomId(): string | null {
  try { return sessionStorage.getItem(ACTIVE_ID_KEY); } catch { return null; }
}

export function setActiveRoomId(id: string | null) {
  try {
    if (id) sessionStorage.setItem(ACTIVE_ID_KEY, id);
    else sessionStorage.removeItem(ACTIVE_ID_KEY);
  } catch { /* ignore quota */ }
}

function writeCache(spec: RoomSpec) {
  try { sessionStorage.setItem(ACTIVE_SPEC_KEY, JSON.stringify(spec)); } catch { /* ignore */ }
}

function readCache(): RoomSpec | null {
  try {
    const raw = sessionStorage.getItem(ACTIVE_SPEC_KEY);
    return raw ? (JSON.parse(raw) as RoomSpec) : null;
  } catch { return null; }
}

/* ---------------- legacy compatibility ---------------- */

/**
 * Mirror the canonical spec into the legacy `floor_plan_context` key so that
 * existing readers (FloorPlanPreview, FloorPlanComparison, Generate.tsx) keep
 * working without being rewritten in this pass.
 */
export function toLegacyFloorPlanContext(spec: RoomSpec) {
  const flatOpenings = spec.walls.flatMap((w) =>
    w.openings.map((o) => ({ type: o.type, wall: w.id, position: o.position_pct })),
  );
  const ctx = {
    shape: spec.shape,
    dimensions: spec.dimensions,
    customWalls: spec.custom_walls,
    roomType: spec.room_type,
    furnitureItems: spec.furniture.selectedItems,
    openings: flatOpenings,
    walls: spec.walls.map((w) => ({
      wall: w.id,
      surface: w.surface,
      openings: w.openings.map((o) => ({ type: o.type, position_pct: o.position_pct })),
    })),
    style: spec.style.preference,
    referenceImageUrl: spec.style.referenceImageUrl,
    layout: spec.layout,
    feedback: spec.layout?.feedback,
  };
  try { sessionStorage.setItem(LEGACY_FLOOR_PLAN_KEY, JSON.stringify(ctx)); } catch { /* ignore */ }
}

/**
 * Build a RoomSpec from the legacy session-storage keys. Used by the export
 * button when the user hasn't explicitly saved a spec yet but data is in cache.
 */
export function fromLegacySession(): RoomSpec | null {
  let fpc: any = null;
  let quiz: any = null;
  try { fpc = JSON.parse(sessionStorage.getItem(LEGACY_FLOOR_PLAN_KEY) || "null"); } catch { /* ignore */ }
  try { quiz = JSON.parse(sessionStorage.getItem(LEGACY_QUIZ_KEY) || "null"); } catch { /* ignore */ }
  if (!fpc && !quiz) return null;

  const spec = emptyRoomSpec();
  if (fpc) {
    spec.shape = fpc.shape ?? spec.shape;
    spec.dimensions = fpc.dimensions ?? spec.dimensions;
    spec.custom_walls = fpc.customWalls;
    spec.room_type = fpc.roomType ?? spec.room_type;
    spec.furniture.selectedItems = fpc.furnitureItems ?? [];
    spec.walls = (fpc.walls ?? []).map((w: any) => ({
      id: w.wall,
      surface: w.surface ?? "plain",
      openings: (w.openings ?? []).map((o: any) => ({
        type: o.type,
        position_pct: o.position_pct ?? o.position ?? 50,
      })),
    }));
    if (fpc.style) spec.style.preference = fpc.style;
    if (fpc.referenceImageUrl) spec.style.referenceImageUrl = fpc.referenceImageUrl;
    if (fpc.layout) {
      spec.layout = {
        name: fpc.layout.name,
        description: fpc.layout.description,
        items: fpc.layout.items ?? [],
        feedback: fpc.feedback,
      };
    }
  }
  if (quiz) {
    spec.style.preference = quiz.stylePreference || spec.style.preference;
    spec.style.colorPalette = quiz.colorPalette || spec.style.colorPalette;
    spec.style.budgetFeel = quiz.budgetFeel || spec.style.budgetFeel;
    spec.style.mustHaveElements = quiz.mustHaveElements || spec.style.mustHaveElements;
    spec.style.referenceImageUrl = spec.style.referenceImageUrl ?? quiz.sourceImageUrl;
    spec.room_type = quiz.roomType || spec.room_type;
  }
  return spec;
}

/* ---------------- DB IO ---------------- */

export async function loadActiveRoomSpec(): Promise<RoomSpec | null> {
  const cached = readCache();
  if (cached) return cached;

  const id = getActiveRoomId();
  if (!id) return null;

  const { data, error } = await supabase
    .from("rooms" as any)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const spec = rowToSpec(data);
  writeCache(spec);
  return spec;
}

export async function saveRoomSpec(spec: RoomSpec): Promise<RoomSpec | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // not signed in — keep cache only
    writeCache(spec);
    toLegacyFloorPlanContext(spec);
    return spec;
  }

  const row = specToRow({ ...spec, user_id: user.id, schema_version: ROOM_SPEC_VERSION });

  if (spec.id) {
    const { data, error } = await supabase
      .from("rooms" as any)
      .update(row)
      .eq("id", spec.id)
      .select()
      .maybeSingle();
    if (error) { console.error("[roomSpec] update failed", error); return null; }
    const next = data ? rowToSpec(data) : spec;
    writeCache(next);
    setActiveRoomId(next.id ?? null);
    toLegacyFloorPlanContext(next);
    return next;
  }

  const { data, error } = await supabase
    .from("rooms" as any)
    .insert(row)
    .select()
    .maybeSingle();
  if (error) { console.error("[roomSpec] insert failed", error); return null; }
  const next = data ? rowToSpec(data) : spec;
  writeCache(next);
  setActiveRoomId(next.id ?? null);
  toLegacyFloorPlanContext(next);
  return next;
}

/** Update the layout portion of the active spec in-place. */
export async function updateActiveRoomLayout(layout: RoomLayout) {
  const spec = (await loadActiveRoomSpec()) ?? emptyRoomSpec();
  spec.layout = layout;
  return saveRoomSpec(spec);
}

/* ---------------- export ---------------- */

export function exportRoomSpec(spec: RoomSpec, filename?: string) {
  const safeName = (spec.name || "room").replace(/[^a-z0-9-_]+/gi, "_");
  const blob = new Blob([JSON.stringify(spec, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `${safeName}.room.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------------- mappers ---------------- */

function rowToSpec(row: any): RoomSpec {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    room_type: row.room_type,
    shape: row.shape,
    dimensions: row.dimensions ?? {},
    custom_walls: row.custom_walls ?? undefined,
    walls: row.walls ?? [],
    style: {
      preference: row.style?.preference ?? "",
      colorPalette: row.style?.colorPalette ?? "neutral",
      budgetFeel: row.style?.budgetFeel ?? "mid-range",
      mustHaveElements: row.style?.mustHaveElements ?? [],
      referenceImageUrl: row.style?.referenceImageUrl,
    },
    furniture: { selectedItems: row.furniture?.selectedItems ?? [] },
    layout: row.layout ?? undefined,
    schema_version: row.schema_version ?? ROOM_SPEC_VERSION,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function specToRow(spec: RoomSpec) {
  return {
    user_id: spec.user_id,
    name: spec.name,
    room_type: spec.room_type,
    shape: spec.shape,
    dimensions: spec.dimensions,
    custom_walls: spec.custom_walls ?? null,
    walls: spec.walls,
    style: spec.style,
    furniture: spec.furniture,
    layout: spec.layout ?? null,
    schema_version: spec.schema_version,
  };
}
