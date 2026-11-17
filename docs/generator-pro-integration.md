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

The bundle is vendored. These four changes are marked `Home Mockup patch` in the file; re-apply them if the bundle is rebuilt from Generator PRO:

1. **Array-mode variation layers start on variation 1.** Without this, layers published as `variations: [url, url, …]` (what `publish-showroom-scene` writes) had no initial state and were never drawn — the room showed only its background.
2. **Hotspots are keyed by `id`, falling back to the layer name.** Standalone hotspots had no `id`, so every hotspot shared the key `undefined` and only one was positioned. Published manifests now also write `hotspot.id`.
3. **Hotspot positions use layout sizes, not scaled bounding boxes.** The journey scales each screen with a CSS transform to fit the window; the renderer measured the already-scaled canvas and placed hotspots inside the scaled container, scaling them twice.
4. **English by default** (was German); the DE/EN toggle is kept. Also: optional `thumbnails` per variation layer are used for the choice strip (full-canvas transparent layers make poor thumbnails).

## Sample scene

`public/showroom-demo/living-room/` is a real two-layer scene (arch wall: 4 colours, sofa: 5 colours) built from the sample photo by `scripts/showroom-demo/make_scene.py`: the layers are masks of the photo itself, recoloured, so they are camera-aligned. The showroom screen opens it — labelled "Sample room" — for living rooms that don't have a prepared scene yet. Your own prepared scene always wins.

Check the whole flow (layout summary → showroom → swap → step 5) with `node qa/showroom-flow.mjs`.
