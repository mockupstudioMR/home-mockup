# Design-board tools (Python)

Helpers used to turn the design boards into app screens and to check them. The screen agent itself
is `../run.mjs`; its spec extractor is `../extract-specs.py` and the admin sample data is `../fixtures/build_admin.py`.

Needs: `pip install beautifulsoup4 pillow playwright`

| Script | What it does | Run |
|---|---|---|
| `html2jsx.py` | Converts a design board (`*.dc.html`) into JSX markup to paste into a screen | `python3 html2jsx.py <board.dc.html> <out.jsx.txt>` |
| `scopecss.py` | Scopes a board's CSS under one class so boards don't clash (e.g. `.mu.b-S1-Why`) | `python3 scopecss.py <board.css> <scope> <extra>` |
| `cmp.py` | Side-by-side picture of design vs app for one screen, after a run of the agent (writes `out/cmp.jpg`) | from `qa/screen-agent`: `python3 tools/cmp.py admin E1-Styles [y0] [height]` |
| `render_pdf.py` / `render_admin.py` | Screenshots every journey / admin board | `python3 render_pdf.py <project dir> <assets dir> <font.woff2> <out dir>` |
| `build_pdf.py`, `build_journey_pdf.py`, `build_admin_pdf.py` | Puts the board screenshots into one PDF | `python3 build_pdf.py <shots dir> <hero image> <font.woff2> <out.pdf>` |
