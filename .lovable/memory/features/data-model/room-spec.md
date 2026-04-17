---
name: Canonical RoomSpec
description: Single source of truth for room shape, openings (clockwise per wall), style, furniture, and layout — DB + session cache + JSON export
type: feature
---
A canonical `RoomSpec` consolidates everything about a room (shape, dimensions, walls with clockwise-ordered openings, style, furniture selection, layout + feedback) into one model used across `/floor-plan`, `/generate`, and `/gallery`.

- **Type**: `src/types/roomSpec.ts` (RoomSpec, RoomWall, RoomOpening, RoomLayout, etc.)
- **Service**: `src/services/roomSpec.ts` — `loadActiveRoomSpec`, `saveRoomSpec`, `exportRoomSpec`, `getActiveRoomId`, `toLegacyFloorPlanContext`, `fromLegacySession`
- **Persistence**: DB table `public.rooms` (RLS: own rows only) is source of truth. Mirrored to `sessionStorage["room_spec_active"]` (cache) AND legacy `sessionStorage["floor_plan_context"]` so existing readers (`FloorPlanPreview`, `FloorPlanComparison`, `Generate.tsx`) keep working without rewrite.
- **Active room**: `sessionStorage["room_spec_active_id"]`. `generated_designs.room_id` links each render back to its source spec.
- **Wizard finalize**: `FloorPlan.tsx` calls `saveRoomSpec(...)` after building `floor_plan_context`. Generate sends `floorPlanContext` to `generate-design` and stamps `room_id` on inserts.
- **Export**: Gallery hover overlay has a `FileJson` button → downloads `<name>.room.json` (full spec) — pulled from `rooms` row by `room_id`, falls back to `fromLegacySession()`.
- **Wall ordering invariant**: `walls[]` is clockwise from N; each wall's `openings[]` is in order of `position_pct` along the wall in the same clockwise direction.
