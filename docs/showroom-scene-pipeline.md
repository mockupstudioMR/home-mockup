# Publishing an interactive Generator PRO scene

This pipeline takes **already prepared and camera-aligned** scene assets, validates their presence in Supabase Storage, builds a Generator PRO JSON manifest and registers a ready scene for the Home Mockup journey. It does not yet create masks, remove backgrounds or synthesize product variations from a photograph.

## Setup

1. Apply migrations `20261117130000_showroom_scenes.sql` and `20261117133000_showroom_scene_assets.sql`.
2. Deploy the `publish-showroom-scene` edge function.
3. Upload approved, non-sensitive images to `showroom-scene-assets` with admin credentials.
4. Call the function with an authenticated admin session.
5. Open the matching project, room, layout and view at `/journey/4/showroom`.

**Privacy:** the scene-assets bucket is public. Never upload customer room photos, personal objects or confidential design assets. A private, signed-URL pipeline is required before production customer scene generation.

## Input example

```json
{
  "projectId": "00000000-0000-4000-8000-000000000001",
  "roomId": "00000000-0000-4000-8000-000000000002",
  "layoutId": "chosen-layout-id",
  "view": "room",
  "width": 1920,
  "height": 1080,
  "backgroundPath": "approved-demo/living-room/background.webp",
  "layers": [
    {
      "name": "sofa",
      "group": "furniture",
      "order": 20,
      "variations": [
        "approved-demo/living-room/sofa-cream.webp",
        "approved-demo/living-room/sofa-sage.webp"
      ],
      "shadow": "approved-demo/living-room/sofa-shadow.webp",
      "title": "Sofa",
      "thumbnails": [
        "approved-demo/living-room/sofa-cream-thumb.jpg",
        "approved-demo/living-room/sofa-sage-thumb.jpg"
      ],
      "hotspot": { "x": 1060, "y": 760 }
    },
    {
      "name": "floor",
      "group": "floor",
      "order": 10,
      "variations": [
        "approved-demo/living-room/floor-oak.webp",
        "approved-demo/living-room/floor-walnut.webp"
      ]
    }
  ]
}
```

`title`, `thumbnails` (one per variation) and `hotspot` (pixels of the scene image) are optional. Without a `hotspot` the layer can only be reached from its tab.

All variation images must have the same pixel dimensions and camera registration as the background, with transparent pixels outside the affected region. Images must be prepared externally and visually checked. The server validates that files exist, not their alpha channels, registration or aesthetic quality.

The function returns a published scene ID and version. The Home Mockup screen discovers the latest ready scene scoped to the exact project, room, layout and view. If no prepared scene exists, it shows the approved background image without an infinite loading indicator.

## Remaining production work

- Build segmentation/masking and generation workers to produce and quality-check aligned variations automatically.
- Add private per-customer storage and short-lived signed asset access.
- Persist selections and undo/redo across sessions through a stable Generator PRO event API.
- Add user-facing scene preparation status, retries and cost accounting.
- Run migrations, edge-function deployment, build, and a real two-variation browser smoke test.

This implementation is a **publishing and runtime discovery pipeline**, not a complete AI asset-generation pipeline.
