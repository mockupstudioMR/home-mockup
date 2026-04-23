

## Layered Design Refinement

Restructure the `/generate` refinement panel so users can adjust the design in three sequential layers, each with its own controls and regeneration scope.

### The three layers

1. **Architecture** — wall color/material/finish, ceiling color/treatment, floor (already supported), trim/molding
2. **Furniture** — sofa, bed, tables, storage (swap, restyle, recolor, remove)
3. **Decor** — lighting, rugs, art, plants, accessories

Each layer is shown as a tab/accordion in the refinement panel. Architecture is selected by default (matches the natural top-down design order). Switching layers filters the moodboard items shown and the refinement actions available.

### UI changes

**`src/components/generate/RefinementPanel.tsx`**
- Add a 3-step layer selector at the top: `Architecture → Furniture → Decor` with a progress indicator (filled dots + connector line) so the layered nature is visible.
- Per layer, show:
  - **Architecture**: color swatches for walls + ceiling, finish chips (matte / satin / textured / wood paneling / wallpaper), free-text "describe wall/ceiling change" box. Reuses existing `replace-wall` edge function for wall changes; ceiling handled via `color_material` action scoped to ceiling.
  - **Furniture**: filtered moodboard items where `kind === "furniture"` (incl. must-include) with existing swap / recolor / remove actions.
  - **Decor**: filtered items where `kind === "decor"` with the same actions.
- A "Lock previous layers" toggle (default ON) tells the generator to preserve architecture when refining furniture, and preserve architecture+furniture when refining decor.

**`src/components/generate/MoodboardElementsPanel.tsx`**
- Accept an optional `activeLayer` prop. When set, dim/hide sections that don't belong to the active layer so the moodboard reflects what the user is currently editing.
- "Architecture" section already exists conceptually as `material` — rename/remap to a new `architecture` kind covering walls, ceiling, floor, trim.

**`src/components/generate/MoodboardRefinePanel.tsx`** (host)
- Holds the new `activeLayer` state, persists it in `sessionStorage` so switching tabs doesn't reset the user's place.
- Passes layer + lock flag down to the generation request.

### Generation pipeline

**`supabase/functions/generate-design/index.ts`**
- Accept new payload fields: `refinementLayer: "architecture" | "furniture" | "decor"` and `lockedLayers: string[]`.
- Inject layer-aware instructions into the prompt:
  - Architecture refinement → "Preserve all furniture and decor positions/identities exactly. Only modify walls, ceiling, floor, and architectural finishes."
  - Furniture refinement → "Preserve walls, ceiling, floor finishes exactly. Only modify furniture as instructed."
  - Decor refinement → "Preserve architecture and furniture exactly. Only modify decor (lighting, rugs, art, plants, accessories)."
- Reuse the existing scene-preservation prompt scaffolding documented in the structured-refinement memory.

### Data model

No schema changes required. The layer + locked-layers metadata is sent per generation request and stored in the existing `generated_designs.refinement_metadata` JSON column (already used for undo stack).

### Out of scope

- No changes to `/analyze-room` moodboard composition.
- No new edge functions — reuses `generate-design` and `replace-wall`.
- Undo stack continues to work unchanged; each layered edit is one undo step.

### Files touched

- `src/components/generate/RefinementPanel.tsx` (add layer selector + per-layer controls)
- `src/components/generate/MoodboardRefinePanel.tsx` (host state, pass-through)
- `src/components/generate/MoodboardElementsPanel.tsx` (filter by active layer, add `architecture` kind)
- `src/pages/Generate.tsx` (forward `refinementLayer` + `lockedLayers` to the edge function)
- `supabase/functions/generate-design/index.ts` (layer-aware prompt injection)

