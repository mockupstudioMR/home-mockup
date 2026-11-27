# Generator PRO integration contract

The React showroom adapter is implemented on this branch, but **a live room is not ready** until a compatible deployed renderer and a complete scene asset manifest exist.

## Required environment values

- `VITE_GENERATOR_PRO_SCRIPT_URL`: URL to the **ES module** built from Generator PRO's `public/configurator-dist/showroom-configurator.js`. Host it on the same origin or with compatible cross-origin headers.
- `VITE_GENERATOR_PRO_CONFIG_URL`: fetchable JSON configuration for a prepared room. The current adapter uses a single configured URL; it is **not yet per-project routing**.
- `VITE_GENERATOR_PRO_ASSETS_URL`: base URL for the prepared WebP layers.

Generator PRO expects `config` to be a URL, not a JSON object. It reads `background`, `layers`, and `imageSize` from the JSON, and supports `mockup.layers` arrays in its own legacy format. `assets` is the prefix for relative layer paths.

## Production blockers

1. **Per-room configuration:** add a project/room/layout/version-scoped manifest registry with authorization. Never point every user to one shared manifest.
2. **Scene preparation:** produce camera-aligned WebP layers, variation assets, shadows and verified product mappings. Approved static background photos are not valid substitute layer assets.
3. **State/events:** extend Generator PRO with a stable selection-change API and a restore-selections API. Persist snapshots through Home Mockup project storage. The current custom element owns its internal selection state.
4. **Credit transactions:** enforce purchases and entitlements server-side, with idempotency and refunds. Never charge in the browser.
5. **Build and test:** verify the deployed JS registers `showroom-configurator`, check the runtime config and assets load, and test visual layer swaps on a real room.

Until all three environment values exist, Home Mockup deliberately displays its approved reference-image preview.

## Local patches to the bundled renderer (`public/generator-pro/showroom-configurator.js`)

The bundle is vendored. These changes are marked `Home Mockup patch` in the file; re-apply them if the bundle is rebuilt from Generator PRO:

1. **Array-mode variation layers start on variation 1.** Without this, layers published as `variations: [url, url, …]` (what `publish-showroom-scene` writes) had no initial state and were never drawn — the room showed only its background.
2. **Hotspots are keyed by `id`, falling back to the layer name.** Standalone hotspots had no `id`, so every hotspot shared the key `undefined` and only one was positioned. Published manifests now also write `hotspot.id`.
3. **Hotspot positions use layout sizes, not scaled bounding boxes.** The journey scales each screen with a CSS transform to fit the window; the renderer measured the already-scaled canvas and placed hotspots inside the scaled container, scaling them twice.
4. **English by default** (was German); the DE/EN toggle is kept. Also: optional `thumbnails` per variation layer are used for the choice strip (full-canvas transparent layers make poor thumbnails).
5. **A scene can set its own grade.** A manifest `enhancements: {brightness, contrast, saturation}` replaces the renderer's defaults (105 / 105 / 156, which over-colour scenes that are already graded). Prepared walls publish 100 / 100 / 100. The Tune sliders still work on top.
6. **Pieces drawn at a box.** A variation layer with `box: {x, y, w, h}` (scene pixels) draws its shadow and colour images into that box instead of over the whole canvas; for product layers the box can sit on the material or the product, so each product keeps its own size. One prepared piece can then go anywhere on a wall, and its files stay small.
7. **Each variation uses its own shadow.** A layer (or product material) with `shadows: [url, …]` draws variation *i* with `shadows[i]`, falling back to the shared `shadow`. `wallScenes/runner.ts` publishes one shadow per alternative (each has its own silhouette); without this every alternative was drawn over the main option's shadow, leaving a black copy of the old piece. A shadow that fails to load no longer drops the layer: the colour image is drawn on its own.

The same changes (per-variation shadows, optional shadows) are in Generator PRO's `fix/per-variation-shadows` branch, so a rebuilt bundle keeps them.

## How layers are composited (Generator PRO's own method)

For every layer the renderer multiplies its **shadow** image, then draws its **colour** image with *lighten*:

- shadow: white where the room is untouched, the shade the piece throws (on wall and floor), black under the piece itself;
- colour: the lit piece (or surface) on black.

No transparency is needed, so dark pieces keep clean edges, and the shade is part of the layer, so it stays right whatever wall or floor colour is underneath. Wall and floor finishes are layers too: one shared shadow (black where the surface is) and one colour image per finish.

## Sample walls (step 5 · Picture)

`public/showroom-demo/walls/{a,b,c,d}/` are the sample living room's four walls, prepared to the wall standard (camera key `wall-std-v1-L500`: straight on, eye height 1.40 m, 1920 × 1080, walls up to 5 m at 3 px per cm) by `scripts/showroom-demo/make_walls.py`. Each wall has 4 wall colours, 3 floors and its pieces as sprites with boxes; wall D's cabinet slot has two products of different sizes. The wall screen shows them, labelled as a sample, until the person's own wall has a prepared scene. Pieces are rendered on a neutral room with and without the piece, which gives their shadow image; the sources are in `scripts/showroom-demo/wall-sources/`.

## Sample scene

`public/showroom-demo/living-room/` is a real two-layer scene (arch wall: 4 colours, sofa: 5 colours) built from the sample photo by `scripts/showroom-demo/make_scene.py`: the layers are masks of the photo itself, recoloured, so they are camera-aligned. The showroom screen opens it — labelled "Sample room" — for living rooms that don't have a prepared scene yet. Your own prepared scene always wins.

Check the whole flow (layout summary → showroom → swap → step 5) with `node qa/showroom-flow.mjs`.
