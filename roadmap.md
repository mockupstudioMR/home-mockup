# Roadmap

## Now
- [ ] Get `npm run lint` green on main (161 errors left: ~100 `any` in the web app, 61 in edge functions, 7 `@ts-nocheck` admin screens). Work through it file by file, biggest first: `components/admin/AdminProductManagement.tsx`, `components/floorplan/BuyListStep.tsx`, `pages/ShopDashboard.tsx`, `components/generate/ShopExistingProducts.tsx`.
- [ ] Style quiz (needs Unsplash allowed in this agent's network settings — blocked on 2026-10-25 and 2026-10-27): check the six inspiration photos in `quiz/steps/ImageStep.tsx` match their labels (e.g. "Bohemian"), move them into `public/images/quiz/` and record credits in `public/images/CREDITS.md`.

## Next
- [ ] Tests for the core journey: style quiz → Style Detector → Moodboard → Floor Plan → Shopping List → Carpenter Brief → Project File (start with pure helpers, then React Testing Library screens).
- [ ] Onboarding: three user paths plus discovery mode — smoke test that each path reaches step 1 of the journey.
- [ ] Admin screens: generate DB types for the admin tables so `@ts-nocheck` can be removed.

## Later
- [ ] Bundle size: `jspdf`, `pdfjs-dist` and the Arabic dictionary are the largest chunks — load them only when needed.
- [ ] Accessibility pass: alt text on generated images, focus order in the journey steps.

## Done
- [x] Lint: `pages/FloorPlan.tsx` and `pages/Generate.tsx` now lint-clean (35 errors removed); floor-plan data parsing moved to `lib/floorPlanParsing.ts` with 7 tests (2026-10-27).
- [x] Lint: fixed empty catch blocks, empty interfaces, prefer-const and require() import in the web app (2026-10-23).
- [x] Types: removed `any` from the roomSpec service and journey hooks; added 7 roomSpec tests (2026-10-23).
- [x] Restore explicit moodboard recreation on the current page and verify it bypasses saved previews (browser confirmed request and moodboard palette).
- [x] Correct moodboard-to-design references and verify generation inputs (reference tests passed; generator deployed).
- [x] Shopping list: auto-extract missing design items and show exact design crops only (never generic/catalog substitutes)
- [x] Repair the app build: drop admin screens whose tables were never created, rebuild Admin home and Projects support on live data, fix WhatsApp functions, grant admin read access. Verified: typecheck clean, tests pass, all admin sections render.
