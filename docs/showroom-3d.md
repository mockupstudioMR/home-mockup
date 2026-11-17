# The 3D showroom (4 · showroom)

Every person gets their own room in 3D straight after choosing a layout. It needs no prepared image assets: it is drawn in the browser from what the journey already knows. A prepared Generator PRO scene, when one exists for the project, room, layout and view, still takes its place.

## Where each part comes from

| In the room | Source in the journey state |
|---|---|
| Room size | `room.widthM`, `room.lengthM`, `room.ceilingM` (example size until confirmed) |
| Doors, windows, radiators | `placements` (4.3 "What can't move") |
| Pieces, positions, footprints, facing | the chosen layout's `items`; kept pieces from `keeping` |
| Colours | `moodboard.palette` — each colour's `use` decides what it goes on; lightness fills gaps |
| Shapes and materials | words about each piece in `preview.read`, its label, and the step 5 anchor, matched to `showroom3d/library.ts` |
| Curtains, art, mirror, pendant | only when they are on a wall in `walls[...].items` |

Nothing is added that the person does not have: no invented rug, art or plants.

## Files

- `src/journey/showroom3d/model.ts` — journey state → room model (pure, tested)
- `src/journey/showroom3d/library.ts` — the shape library and the word matching
- `src/journey/showroom3d/scene.ts` — the three.js room; `buildScene` needs no renderer
- `src/journey/showroom3d/record.ts` — the saved style record
- `src/journey/showroom3d/Showroom3D.tsx` — the screen (lazy-loaded with three.js)

## Saving

What the person changes is kept in `showroom.edits` (per piece: colour, shape). The style record — exact palette values, every element's colour, material, shape, wall and position, and each wall's order — is kept in `showroom.record` with the journey, and mirrored to `showroom_style_records` (one row per room) when the project tables exist. Apply migration `20261117230000_showroom_style_records.sql` for the database copy; without it the record stays in the browser.

## Adding a shape

Add it to its category in `library.ts` (id, name, note, the words that point to it), draw it in the matching builder in `scene.ts` at a typical size facing +z, and add the name to `src/i18n/ar.json`. The test "draws every shape in the library" covers it automatically.

## Not done

- No visual browser test has been run on this screen yet.
- Shapes are matched from the preview's description, not from the picture itself.
