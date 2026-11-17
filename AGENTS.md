# Architecture rules

- The six-step journey retains legacy stored progress IDs (final step 9, finished room 10) and maps them for display; removed-step URLs continue to the final step so existing accounts and bookmarks remain usable.

- Layout generation appends options to current state and ignores results after leaving the screen; late plan readers must not clear displayed layouts, so selection and edits survive background work.

- Project SELECT policies must check row ownership directly before membership helpers so INSERT RETURNING can read newly created owner rows within the same statement snapshot.

- Keep furniture groupings, plan symbols, side clearances, and wall-gap rules in database reference tables; publish only active groupings and preserve customized reference values when seeding defaults.

- Assemble generation moodboard references with the shared moodboard context helper, preserving role labels; attach images in priority order up to a memory-safe cap and name any remaining references in prompt text, because too many inline images exceed edge worker memory.
- Prefix non-surgical generation prompts with the shared moodboard brief independently of editable prompt templates; this keeps user selections authoritative even when templates omit placeholders.- Translate UI by English source text: `src/i18n` applies the `ar.json` dictionary to rendered text and attributes and sets `dir`, and adds `uiLanguage` to function calls. Edge functions import `_shared/language.ts` first so chat answers follow it. This way every screen is covered without wiring each component; add new English strings to the dictionary.
- Draw the 3D showroom only from journey state (moodboard palette, preview read-out, room size, placements, chosen layout, kept pieces, wall items) through `showroom3d/model.ts`; never hard-code a room, piece or colour in the scene, and add no piece the person does not have.
