# Library-first showroom pipeline

## Asset resolution order

1. Look for approved, licensed `showroom_asset_library` entries matching **room type, camera key, pixel dimensions and category**.
2. For each category, reuse the latest matching entry (commercial projects require `commercial` license scope).
3. If at least one category matches, publish those layers through `publish-showroom-scene`. Report missing categories explicitly as `partial`.
4. If nothing matches, return `assets_required` without generating invented layers or spending AI credits.
5. An image-generation/segmentation worker is still required to fill missing categories, produce alpha-matted overlays and get human/automated approval before registering them in the library.

## Call `prepare-showroom-scene`

Admin-only POST JSON:

```json
{
  "projectId": "00000000-0000-4000-8000-000000000001",
  "roomId": "00000000-0000-4000-8000-000000000002",
  "layoutId": "chosen-layout-id",
  "roomType": "living-room",
  "cameraKey": "living-room-front-v1",
  "view": "room",
  "backgroundPath": "approved-demo/living-room/background.webp",
  "width": 1920,
  "height": 1080,
  "categories": ["furniture", "floor"],
  "commercial": false
}
```

All paths refer to existing objects in the public `showroom-scene-assets` bucket. Approved entries must contain at least two transparent full-canvas variations for each category. The function never reuses arbitrary catalog product thumbnails as compositing layers: those are not spatially aligned.

## Remaining automation

- AI worker for room-specific segmentation, inpainting, product placement, shadow and variation generation
- Quality checks: alpha transparency, geometry alignment, stable backgrounds and product fidelity
- Approval and library ingestion for new assets
- Private storage and signed URLs for customer photos and licensed product imagery
- Credits, retries, job queue and cost controls

The implemented pipeline is **library-first reuse + validation + manifest publication**, not automatic generation of missing assets.
