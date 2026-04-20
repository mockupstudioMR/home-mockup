---
name: Mobile & PWA setup
description: Installable PWA + global mobile responsiveness rules (safe-area, no horizontal overflow, 16px inputs)
type: feature
---
HomeMockUp is installable as a PWA via `/manifest.webmanifest` (theme #75658c, bg #f6f1ea, icons in /public: icon-192.png, icon-512.png, apple-touch-icon.png).

Service worker (`vite-plugin-pwa`, autoUpdate) is registered manually in `src/main.tsx` and is HARD-DISABLED on iframes, localhost, and Lovable preview hosts (`id-preview--*`, `lovableproject.com`) to avoid stale-cache issues. `/auth` and `/~oauth` are in `navigateFallbackDenylist`.

Global mobile rules in `src/index.css` (apply automatically — never re-add per page):
- `html, body { overflow-x: hidden }` to kill horizontal scroll
- `body` honors `env(safe-area-inset-*)` for iOS notch
- inputs/select/textarea forced to 16px under 640px to stop iOS auto-zoom
- text wraps via `overflow-wrap: anywhere`
- images max-width:100% by default
- `.scrollbar-none` utility for horizontally scrollable tab strips

Pattern for tab bars with many items on mobile: wrap `TabsList` in `<div className="-mx-4 px-4 overflow-x-auto scrollbar-none">` and use `inline-flex w-max sm:grid sm:w-full sm:grid-cols-N`. Already applied to AdminDashboard.

`index.html` viewport: `width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=5`. PWA install only works on the published URL, NOT inside the Lovable editor preview.
