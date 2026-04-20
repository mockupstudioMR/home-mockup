# Project Memory

## Core
- Project is named "HomeMockUp". Standardize "My Gallery" and "My Designs" to "My HomeMockUps".
- Currency is strictly Euros (€).
- Branding: Warm palette. Muted Purple/Mauve (Primary), Soft Coral/Peach (Secondary), Sage Green (Accent).
- React Portals: Use a dedicated `useEffect` container appended to `document.body` instead of portaling directly to avoid unmount errors.
- Auth: Initial admin account is bootstrapped by manually assigning 'admin' role to 'monicariad@gmail.com' in user_roles.
- Billing: Marketplace credit-based payment and Stripe integrations are implemented but grayed out ("Coming Soon").
- Canonical room data lives in `RoomSpec` (`public.rooms` DB + `sessionStorage["room_spec_active"]` cache, legacy `floor_plan_context` mirror). All flows must read/write via `src/services/roomSpec.ts`.

## Memories
- [Canonical RoomSpec](mem://features/data-model/room-spec) — Single source of truth for shape/openings/style/furniture/layout, DB-backed, exportable per room
- [Role Management](mem://features/role-management-and-access-control) — Multi-role marketplace with invite-only access for non-user roles
- [Business Ecosystem](mem://features/business-marketplace-ecosystem) — Credit-based offers, inventory management, and AI matching engine
- [Dynamic Quiz Content](mem://features/dynamic-quiz-content) — StyleStep driven dynamically by CMS content table
- [AI Product Enrichment](mem://features/shop/ai-product-enrichment) — Inventory automatically enriched with AI style tags and image descriptions
- [Location-Based Matching](mem://features/marketplace/location-based-matching) — Prioritizes local city shops, with Google Shopping fallback
- [Visual Discovery](mem://features/design-finalization/visual-discovery-fallback) — Bing Images and Shopping used for visual search links
- [Furniture Source](mem://features/quiz/furniture-source-control) — "Shop Products Only" logic for strict AI catalog generation
- [Import Limits](mem://constraints/product-import-limits) — URL scraping limits and text processing constraints
- [Mobile Strategy](mem://features/mobile-accessibility-strategy) — PWA and Native (Capacitor) dual path for mobile apps
- [Design Logic Config](mem://features/admin/design-logic-configuration) — Admins manage prompt templates and variables for AI functions
- [AI Image Limits](mem://constraints/ai-image-processing-limit) — Max 4 product images per request with HEAD checks for validation
- [Continue Design](mem://features/gallery/continue-design) — Resume refinement flow from Gallery with history restoration
- [Storage Strategy](mem://technical-stack/storage-strategy) — Supabase buckets for images, specific RLS and gallery limits
- [Product Journey](mem://features/product-journey/workflow-logic) — "Start with Products" flow, Firecrawl scraping, and Style Wall
- [Quiz Constraints](mem://features/quiz/unified-flow-constraints) — Single-step flow (Room Type only), unused fields set to defaults
- [Design Extraction](mem://features/design-assets/extraction-and-refinement-logic) — Product isolation, surface extraction, and 3-column UI state
- [Item Identification](mem://features/design-assets/item-identification) — Click-to-Identify using Gemini-2.5-Flash and percentage coordinates
- [Homepage Content](mem://design/homepage-content) — Background details, headings, and hidden functional entry points
- [State Persistence](mem://technical-stack/state-persistence-tabs) — Custom manual tabs on Generate page for state retention
- [Report Simplification](mem://features/design-report/ui-simplification) — "Other Angles" and style refinement hidden from Generate page
- [Structured Refinement](mem://features/design-refinement/structured-refinement-and-undo) — 4 modification modes, scene preservation, and undo stack
- [Mockup Titles](mem://features/design-management/editable-mockup-titles) — Auto-generated, editable titles persisted in generated_designs
- [Inventory Management](mem://features/admin/product-inventory-management) — Standardized 'Type' field, inline editing via EditableTagList
- [Matching Engine](mem://features/design-report/matching-engine-logic) — Compatibility scores, Type Families pre-filtering, and regex checks
- [Extraction Constraints](mem://features/design-report/item-extraction-constraints) — Strict furniture types and anti-hallucination policy for AI
- [Thumbnail Priority](mem://features/design-report/thumbnail-priority) — Database matched image > AI extracted > Search engine thumbnail
- [Resilience](mem://constraints/error-handling-and-resilience) — Multi-layered AI retries, auth flags, and fetch backoffs
- [Room Analysis Flow](mem://features/design-journey/room-analysis-flow) — "Start with Your Room" wizard and absolute room preservation model
- [B2B Solutions](mem://features/b2b/solutions-onboarding) — 60-Second Onboarding wizard for professional showrooms
- [Mobile & PWA Setup](mem://features/mobile-and-pwa-setup) — Installable PWA, global mobile CSS rules, SW disabled in preview/iframe
