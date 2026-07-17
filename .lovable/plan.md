# Design Journey — Apple-quality cinematic experience

A new full-screen, story-driven experience that plays after the user uploads a room photo and their design is generated. It replaces the current static result view with a 10-screen guided journey.

## Scope

- New route: `/design-journey/:designId` (opens after generation finishes)
- Homeowner path only for now (does not touch the Professional path or existing `/generate` layout)
- Frontend/presentation only — reuses existing generated design data, style analysis, product matches, and budget data already produced by the current backend. No new edge functions.

## Route & entry points

- After a design is generated in the homeowner flow, add a primary CTA "Enter your design journey →" that navigates to `/design-journey/:designId`.
- Keep the current results screen as a fallback (accessible via a small "Classic view" link).
- Deep-linkable: journey loads the design + related data by id.

## Screens (10)

Each screen is a full-viewport section with Framer Motion enter/exit animations, generous whitespace, large type, and a persistent minimal nav.

1. **Hero Reveal** — before→after morph, then draggable comparison slider. Headline "Your room has been transformed." CTA "Explore My Design →".
2. **Style DNA** — staggered cards: Primary Style, Secondary Style, Mood, Color Palette (animated circles), Materials (icons), Lifestyle Match.
3. **Design Evolution** — horizontal, swipeable timeline of versions (Original → Concept → Professional → Luxury → Final) with crossfade + bottom progress dots.
4. **Why We Changed It** — redesigned room with numbered hotspots that pop in one by one; clicking opens a glass card, background blurs.
5. **Room Health Score** — big circular gauge counts 0→score; category bars animate left-to-right (Style, Comfort, Lighting, Flow, Storage, Luxury, Personality).
6. **Shopping Experience** — premium product cards (image, name, price, reason, match %, store) with Essential / Recommended / Premium / Budget filter chips; animated layout transitions.
7. **Budget** — animated donut with Essential / Recommended / Luxury toggle; changing tier animates products + total.
8. **Implementation Roadmap** — vertical week-by-week timeline that reveals on scroll with animated checkmarks.
9. **Before vs After** — large immersive drag slider with version buttons (Original / AI / Professional / Luxury).
10. **Share & Next Steps** — celebratory summary (score, style, budget, products count) + Download Design Book, Share, Continue Shopping, Start Another Room. Subtle floating gradient particles.

## Navigation

- Persistent top bar: thin progress indicator (10 segments), Back, Save.
- Persistent bottom-right: "Next →" pill.
- Keyboard: ←/→ to move, Esc to exit.
- Scroll-snap between sections on desktop; swipe on mobile.

## Motion system

- Framer Motion (`framer-motion` already fits the stack; install if missing).
- Reusable primitives:
  - `<Section>` wrapper: fade + slide-up on enter, blur-out on exit (300–600ms, ease `[0.22, 1, 0.36, 1]`).
  - `<Stagger>` for card lists (60–100ms child delay).
  - `<CountUp>` for numeric reveals.
  - `<Reveal>` intersection-observer wrapper for scroll-triggered fades.
- Respect `prefers-reduced-motion` (disable morph/parallax, keep fades short).

## Visual language

- White background, `bg-background` with subtle warm gradient washes per screen.
- Large display type (existing font stack, tighter tracking on H1s: `text-5xl md:text-7xl font-semibold tracking-tight`).
- Rounded-3xl cards, soft shadows (`shadow-[0_20px_60px_-30px_hsl(var(--primary)/0.25)]`), occasional glass panels (`backdrop-blur-xl bg-card/60 border border-border/50`).
- All colors via semantic tokens — no hardcoded hex in components.

## Data sources (reused, no backend changes)

- `generated_designs` row → original + final image, title, description.
- Existing style analysis → Style DNA fields (fallbacks when missing).
- Existing product matches → Shopping + Budget screens.
- Existing highlights → Hotspots for "Why we changed it".
- Health score + roadmap: derive on the client from existing analysis fields; if a field is absent, hide that sub-item gracefully (never show empty state as broken).

## Technical structure

```text
src/pages/DesignJourney.tsx                # route shell, section orchestration, nav
src/components/journey/
  JourneyNav.tsx                           # progress + back/next/save
  Section.tsx                              # motion wrapper
  primitives/{CountUp,Reveal,Stagger}.tsx
  screens/
    HeroReveal.tsx
    StyleDNA.tsx
    DesignEvolution.tsx
    WhyWeChangedIt.tsx
    HealthScore.tsx
    Shopping.tsx
    Budget.tsx
    Roadmap.tsx
    BeforeAfter.tsx
    ShareNextSteps.tsx
  hooks/useJourneyData.ts                  # loads design + related data by id
```

- Route wired in `src/App.tsx`.
- Add `framer-motion` if not present.
- No changes to edge functions, schema, or the Professional flow.

## Out of scope (this pass)

- Generating new "Concept / Luxury" variants — Screen 3 uses whatever variants already exist; if only one image exists, it shows a single frame with a subtle Ken Burns effect and a note that more versions can be generated.
- Real "Download Design Book" PDF export — button stub that opens a toast "Coming soon" unless you want it built now.
- Analytics events.

Confirm and I'll build it.
