# Showroom: layered wall pictures (and the hidden 3D room)

People see their room as **real, hyper-realistic pictures, one per wall**, where every piece is a swappable layer with its main option and two alternatives. The pictures are made in step 5 ("Your walls") for all four walls as soon as the step opens, and shown in each wall's Picture view with `wallScenes/LayeredWall.tsx`: a hotspot on every item, and a panel to swap it between its main option and two alternatives (choices kept in `showroom.picks`). Hotspots and layered compositing follow the Generator PRO showroom (`mockupstudio-showroom-generator-pro`).

## How one wall's picture is made (`src/journey/wallScenes/runner.ts`)

1. **Guide.** The 3D room (`showroom3d/`, not shown to users) draws the wall as the same straight-on elevation as its step 5 outline (orthographic: the wall fills the frame floor to ceiling, corner to corner), with its doors, windows and only the outline's pieces at their real size, order and place, in the moodboard's colours. It also reports where each item is in the picture.
2. **Photograph.** `generate-wall-scene` (mode `base`) turns the guide into a photograph. If that function is not deployed, the app falls back to `generate-design` as a surgical edit (no style image attached then), copying style, materials and light from the person's step 2 preview. Geometry comes from the guide.
3. **Alternatives.** For each item (wall colour, floor, door, each piece on the wall, curtains, art, mirror), two alternatives (`wallScenes/items.ts`): a product the person picked from their own shop on that wall first, otherwise options in the moodboard palette or another shape from the library. `generate-wall-scene` (mode `variation`) redraws only that item.
4. **Layers.** Each alternative is compared with the photograph inside the item's box (`wallScenes/layers.ts`). The changed pixels of all alternatives make one mask; the original and both alternatives are cut to it, so swapping is seamless. Alternatives that moved the rest of the photo are retried once, then dropped.
5. **Publish.** Layers, thumbnails and a Generator PRO manifest go to the `design-images` bucket under the person's folder; the wall's scene is kept in `showroom.scenes` with the journey and inserted into `showroom_scenes` (needs migration `20261118000000_showroom_scenes_owner_insert.sql`).

A wall's scene carries a key of everything it was made from; when the room changes, it shows as "Room changed · make again". Failed walls are retried only when the person asks.

Runs in the browser: the page must stay open. Cost: one base picture plus two edits per item, roughly 10–15 image calls per wall.

## The hidden 3D room

`src/journey/showroom3d/` builds the room from journey state only (see `model.ts`). It is kept for guide renders, and later for video, AR or other 3D content. The saved style record (`record.ts`, exact colours, every element's shape and place, each wall's order) is kept in `showroom.record` and mirrored to `showroom_style_records` (migration `20261117230000_showroom_style_records.sql`).

## Not done

- No visual browser test has been run.
- The image model may still shift the picture slightly; the drift check limits this but cannot fix it.

## Keeping the pictures realistic (v2)

- Each alternative's tones are matched to the original photo before cutting (`matchTone`), so a piece never sits in a lighter or darker rectangle.
- Each alternative is cut to its own shape (`altMask`) with a threshold above the photo's own noise. It is dropped (and retried once) when it runs past its area (`clipped`, an incomplete piece) or is just a re-lit rectangle (`patch`). There is no box fallback any more.
- The guide leaves out other walls' doors and windows, and slides any piece that runs past a corner back onto the wall (`keepInFrame`).
- The prompts ask for a real photograph with one light direction, contact shadows only, and every piece whole.
- `PICTURE_VERSION` in `runner.ts` marks walls made the old way as out of date, so they are made again.

## Wall compositions (v4)

| Table | What it holds |
|---|---|
| `showroom_canvas_presets` | The six canvas sizes walls are drawn at (4:3 to 3:1, longest side at most 2048, multiples of 16). |
| `showroom_item_specs` | One rule per `furniture_specs` box: mount, height of a wall-hung piece, depth band (drawing order), layer group, cut padding, shadow margin, hotspot position, smallest size in pixels, and whether it appears in wall pictures. Seeded for every box; new boxes get one by trigger. Read through the view `showroom_item_specs_full`. |
| `wall_compositions` | One row per person, layout and wall: the wall's size in cm, the preset, canvas size, px per cm, where the wall sits in the canvas, and the guide, photo and manifest files. |
| `wall_composition_items` | Every piece on that wall: place in cm and px, drawing order, hotspot, a low-resolution flag, and its layer files, thumbnails and names. |

Each wall picks the preset closest to its own length-to-height ratio and is fitted whole at one scale. The guide, the photo, every layer and every thumbnail share that canvas size. Pieces are drawn back to front by depth band. Hotspots come from each box's rule. The manifest also carries the composition.

## Table sets (v5)

A dining table or desk and the chairs within about 8% of the room from it form one set (`seatSets` in `wallOutline.ts`). The set shows whole on every wall any of its pieces is nearest to (`wallsShowing`; `PieceModel.shownOn`, `seenOn`). Two chairs never appear without their table. In the outline, chairs beyond the table's end are drawn in profile with their backs outward. A chair hidden behind another on the same side is drawn once, and tables have a solid top, an apron and tapered legs. In the pictures, chairs are layered in front of their table, and the prompts ask for the whole set, complete and styled.

## One wall per piece, everything clickable (v6)

- Each piece is drawn on exactly one wall (`homeWalls`, `nearestWall` in `wallOutline.ts`). A long piece goes on the nearer of the two walls its long side runs along. A bed, a kept piece or a squarish piece goes on its nearest wall. A table set goes on the wall nearest the whole set. A rug goes on the wall of the piece it lies under the most.
- Swappable items:
  - wall colour, floor, door, window frames;
  - every piece on the wall, including chairs, tables and rugs (a rug gets the floor strip in front of the wall);
  - curtains, art and mirrors;
  - a "Wall decor" spot above the main low piece of a wall with nothing hung on it. Its main option is the bare wall; the alternatives are a large painting or floating shelves.
- Kept pieces, and items whose alternatives didn't fit, are still clickable. They are stored as `hotspots` in the manifest, apart from `layers`, so the Generator PRO viewer is unaffected, and they show a note.
- The base prompt lists everything on the wall, hanging items included, and forbids anything else. A clear wall is drawn bare. The preview is used only for colours, materials and mood, never for its furniture or camera.
