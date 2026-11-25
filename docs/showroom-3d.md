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

## Clean swaps (v8)

- The viewer lays only swapped pieces over the photo. The photo already shows every main option, and drawing the main layers on top used to paint the old sofa or wall back over a new one.
- The guide also renders an item map: which piece each pixel shows, front-most first (`Guide.ids`). Each alternative's cut-out is kept off the other pieces' pixels (`keepOff`), shrunk a little so small misalignments between the drawing and the photo leave no seam. A new coffee table never repaints the sofa, and a new wall colour never repaints the furniture.
- Around a new piece, its shadow is a see-through darkening, so it falls on whichever wall colour is chosen.
- Pictures and layers are saved at quality 0.93.

## Free-standing pieces, the whole room, floor views (v9)

- **Plan.** A piece that belongs against a wall (a TV unit, sideboard, shelving, wardrobe or piano) but stands more than 40 cm out is flagged in the fit checks, with "Move it against a wall" (`strayPieces` and `moveOntoWalls` in `layoutCheck.ts`). A TV or media unit goes on the wall facing the sofa where it can; anything else goes on its nearest wall. It goes as close to where it was as possible while keeping the door swing (plus 30 cm), a window (for tall pieces), the other pieces and the walking route clear. New layouts get this automatically; existing ones only when the person taps the fix.
- **Wall drawings.** A piece more than 60 cm from its wall is free-standing (`freeStanding`). The exception is a table, chair, stool, ottoman, bench, lamp or plant standing in front of a piece at the wall, such as a coffee table before the sofa. Free-standing pieces are left off the wall's outline and picture, listed under the outline with their distance, and shown in the whole-room picture.
- **Doors** only push away pieces standing within their swing (95 cm). Windows and columns only push away pieces within 45 cm.
- **Whole-room picture** (`renderRoomGuide`, scene key `"room"`): seen from the room's corner at eye height on a 16:9 canvas. Every piece is in it, free-standing ones included, and every piece is swappable. It is shown under "Whole room" in the showroom.
- **Floor in seating views.** A wall with seating or a rug is seen from 16° above (`floorDepthFor`, `wallViewExtent`). That takes in 1.2 m up to 60% of the room's depth of floor, so the rug and the floor show and can be swapped. Only that wall is drawn in this view.
- Every item now has two alternatives. When there are too few moodboard colours or shapes, light oak and matt black fill in.

## AI providers (direct)

`supabase/functions/_shared/aiModels.ts` sends each AI call straight to Google (`GEMINI_API_KEY`, Google AI Studio) or OpenAI (`OPENAI_API_KEY`) when that key is set as a function secret. If a direct call fails, the call goes through the Lovable gateway (while `LOVABLE_API_KEY` exists), and last of all to the model the function itself names. Seedream (shop posts) has no direct route yet and stays on the gateway.

## Layout boxes together (v10)

- A layout box is the pieces placed as one furniture grouping (`LayoutItem.group`), or, for pieces without a grouping, a table with the chairs at it (`layoutBoxes`). A box always goes whole on one wall: the wall its main piece (the largest that isn't a rug) stands against, or, for a box standing out in the room, the wall nearest the whole box. Its pieces are never listed as free-standing.
- The outline draws each box as one soft bracket with its name, and its seats in profile where they stand beyond the main piece. The wall names (step 4), the "On this wall" lists (step 5), the 3D guide and the pictures all use the same walls. The layout's pieces on a saved wall follow the layout again, while the person's choices and extra items are kept.
- No shadows left behind: gentle light changes next to a swapped piece are cut in too. Where the alternative is lighter (an old shadow that has gone), its own lit wall is used rather than a see-through layer.

## Cleaner wall pictures (v11)

- **A swap covers the whole old piece.** The change is looked for in a wider area around the guide's box, keeping only what joins up with the piece. A taller old sofa back or a longer rug no longer stays behind. "Too big" is judged against that wider area.
- **Floor views fit the wall's width exactly**, with the ceiling line at the top. There are no empty side strips for the picture model to fill with invented furniture.
- **The prompts give the exact number of pieces** and forbid anything else, even cut off at an edge.
- **Walls are always plain flat matt paint in one even colour.** `PLAIN_WALLS` in `_shared/moodboardContext.ts` is added to the preview, the wall photos and wall-colour swaps. The wall colour options are always "Plain white" plus one palette colour, each covering the whole wall.
