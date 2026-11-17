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
