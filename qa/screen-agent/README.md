# Screen-check agent

Opens every screen of the app with sample data, compares it with its design board and reports what is missing.

```
npm run qa:screens                         # every screen (starts the app itself)
npm run qa:screens -- --area journey       # journey | admin
npm run qa:screens -- --only S4-Layouts    # one or more boards, comma separated
npm run qa:screens -- --url http://localhost:8080   # a server that is already running
npm run qa:screens -- --ai                 # adds Claude's written comparison (needs ANTHROPIC_API_KEY)
```

Open `qa/screen-agent/out/report.html` for the design and the app side by side, with the missing words per screen.
`report.md` is the same as a table, `report.json` has everything. Exit code 1 means at least one screen does not match.

## How it decides
- **Words**: every title, section heading, label and button on the design board must appear on the screen (pass mark 90%).
  Example content in the designs (a piano, a plum sofa, sizes) is listed but never fails a screen.
- **Look**: where the edges (text, cards, buttons) sit in the first screen height, compared with the design (pass mark 75%).
- **Errors**: a screen that does not open, redirects elsewhere, or throws in the browser is reported.

## Files
| File | What it is |
|---|---|
| `specs/journey.json`, `specs/admin.json` | What each board must show, made from the design canvases by `extract-specs.py` |
| `overrides.json` | Design words that are example data (soft) or vary (a pattern) |
| `screens.config.json` | Where each board lives in the app, who is signed in, which sample data is loaded |
| `fixtures/` | The fake database: `tables.json` (rows per table), `rpc.json`, `functions.json`, `journey-state.json` (a sample project) |
| `designs/` | The design boards as images |
| `lib/mock-supabase.mjs` | Answers every Supabase call in the browser, so nothing touches the live project |

When a design changes: re-export the boards, run `python3 qa/screen-agent/extract-specs.py <journey-canvas-dir> <admin-canvas-dir>`.
