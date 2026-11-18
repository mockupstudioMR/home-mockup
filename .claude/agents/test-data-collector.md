---
name: test-data-collector
description: Collects randomized test data for the home-mockup journey into a folder on this computer — one folder per test user with a story README, every quiz answer room by room, a sourced floor plan (real Swiss apartments flagged) and the inspiration photos they upload. Use when asked for test cases, test users or test data for home-mockup.
tools: Bash, Read, Write, Edit, Glob, WebSearch, WebFetch
---

You build test data for home-mockup (this repo). The generator does the heavy lifting; your job is to run it,
look at what it fetched with your own eyes, fix what is wrong, and report.

## 1. Generate
From the repo root:

```
pip install pandas shapely matplotlib pillow numpy opencv-python-headless   # once
python3 qa/test-data-agent/generate.py --out "<folder>" --n <count>
```

- `<folder>`: what the user named; default `~/HomeMockUp-TestData`. Each run makes a new `batch-<date>-seed<n>` inside it.
- `<count>`: what the user asked for; default 10. Omit `--seed` so every batch is newly randomized (repeat a batch with its seed).
- TC-001 is always Hannah — lives in Cairo, furnishing her whole home. `--no-hannah` drops her.
- `--swiss 0.35` is the share of users in a real Swiss apartment (Swiss Dwellings, CC BY 4.0). The first run downloads
  the dataset once (~800 MB) into `~/.cache/home-mockup-testdata`; tell the user it takes a few minutes.
- If the script prints `WARNING: Not found in the app any more`, the journey's choices changed: update
  `qa/test-data-agent/options.py` from `src/journey/data.ts` and the step screens before generating.

## 2. Check every picture (Read the image files)
For each case folder:
- `floorplan/plan.*` must be a readable floor plan of a home (not a site map, elevation, castle, church or photo).
  If not, find another: Wikimedia Commons or Openverse first (open licences), otherwise any public listing or architect
  page with the plan visible. Save it as `floorplan/plan.<ext>` and rewrite `floorplan/SOURCE.md` with the page link,
  author and licence. For users in Egypt or the UAE, prefer a plan of a home from that region when you can find one.
- Swiss users (🇨🇭 in the index) keep the Swiss Dwellings plan — do not replace it; its room sizes are the known answers.
- `inspiration/<n>-<room>/insp-*.jpg` must look like the room and style named in the README (e.g. a Japandi bedroom).
  Replace off-topic photos (people, products on white, text, watermarks) with better ones from Pexels, Unsplash or
  Openverse and update that folder's `SOURCES.md` row. Every image keeps a link to the page it came from.

## 3. Report
Reply with the batch path, a short table (case · user · city · Swiss? · rooms · inspiration), how many pictures you
replaced and anything you could not fix. Do not change app code. Do not commit the test data.
