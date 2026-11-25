# Photo timeout recovery

## Rule
A slow photo-outlining request must not discard the person's wall picture or automatically repeat a request that may already have been billed.

## Places checked by reading their code
- `segment-photo/index.ts` and `_shared/http.ts`: the 90-second timeout previously became a generic 500. It now returns a 504, identifying the remote outcome as unknown and disabling automatic retry. The existing model choice and timeout are unchanged.
- `wallScenes/segment.ts`: the common client for every outlining call previously repeated failed/empty responses. It now sends four items at a time, throws failures immediately and does not replay empty results.
- `wallScenes/runner.ts`, original furniture outlines: failure reaches the existing whole-wall cut-out fallback over the original photo; missing outlines cannot leave holes in an empty-room background.
- `wallScenes/runner.ts`, empty-room walls/floor/doors/windows: previously swallowed failures, including credit denials. Failures now reach the same fallback; credit or sign-in failures retain their stop behavior.
- `wallScenes/runner.ts`, alternative furniture outlines: thrown failures do not repeat segmentation. Empty outlines now stop that alternative rather than automatically generating it again.
- `wallScenes/runner.ts`, cut-out fallback: previously discarded the original photo when no swappable alternatives succeeded. It now saves the original photo and item hotspots even without alternatives.
- `wallScenes/useRoomPictures.tsx`: failed walls require an explicit user retry; no automatic failure replay. Unchanged.
- `screens/Step5Walls.tsx`, All walls and individual wall views: progress/error and explicit retry remain available; ready fallback manifests use the same viewer. Unchanged.
- `screens/Step5Walls.tsx`, older individual-wall picture editing, and `journey/services.ts`: errors show a message and clear loading while retaining the existing image. These paths do not call segmentation. Unchanged.
- `screens/ShowroomHandoff.tsx`, whole-room and four wall views: reads ready saved scenes or local ready wall manifests; does not start segmentation. Unchanged.
- `wallScenes/LayeredWall.tsx`: renders the retained background, handles unavailable layer pictures, and does not call segmentation. Unchanged.
- `wallScenes/runner.ts`, background room runner and saved-scene publishing: processes walls sequentially, clears running/progress in `finally`, saves only finished manifests. No database-side segmentation call.
- `wallScenes/composition.ts`, composition and confirmation saving: stores the result of browser composition; no model call or automatic timeout retry. No changes to existing confirmed records, permissions or settings were made.

## Verification
- 13 tests passed across photo client recovery, function timeout classification, existing wall compositing, and common function invocation.
- Preview reported `build OK`.
- The redeployed function validated an authenticated request.
- A signed-in browser test intercepted only segmentation with a controlled 504. Nine requested objects caused exactly one request; recovery reached the caller and the page stayed visible without runtime errors.
- The fresh browser had no saved furnished journey. Real furnished-wall generation and its final fallback photo were not exercised end-to-end; no inference credits were spent for verification. The controlled browser check does not establish that the AI provider itself is responding normally.