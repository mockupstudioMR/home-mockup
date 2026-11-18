# Test-data agent

Makes randomized test users for the journey, in a folder on your computer. One folder per user:

```
batch-2026-10-17-seed48213/
  README.md                       overview of all users (🇨🇭 = real Swiss apartment)
  cases.csv                       same, as a table
  TC-001-hannah-cairo/
    README.md                     story + every answer, step by step, room by room + what to check
    answers.json                  the answers with the app's field names (JourneyState)
    floorplan/plan.png            the home's floor plan
    floorplan/SOURCE.md           link, author, licence, Swiss yes/no, real room sizes when known
    inspiration/1-living-room/    photos this user uploads in step 2 (only if they choose "Upload")
    inspiration/1-living-room/SOURCES.md   link for every photo
```

## Run it

With Claude Code in this repo: *"use the test-data-collector agent to make 10 test users in ~/HomeMockUp-TestData"*.
The agent runs the script, looks at every plan and photo, replaces bad ones and reports.

Or the script alone:

```
pip install pandas shapely matplotlib pillow numpy opencv-python-headless
python3 qa/test-data-agent/generate.py --out ~/HomeMockUp-TestData --n 10
```

| Option | What it does |
|---|---|
| `--n 10` | number of users |
| `--seed 123` | repeat an earlier batch exactly (each batch's seed is in its folder name) |
| `--swiss 0.35` | share of users living in a real Swiss apartment |
| `--no-plan 0.15` | share of users without a plan (they measure or photograph the room) |
| `--no-hannah` | drop the fixed first user (Hannah, Cairo, whole home) |
| `--offline` | no downloads: synthetic plans with known sizes, empty inspiration folders |
| `PEXELS_API_KEY=…` | use Pexels for inspiration photos (better interiors); otherwise Openverse, then Wikimedia Commons |

## How the users are made

- **Answers** only use choices that exist in the app (`options.py`, mirrored from `src/journey/data.ts` and the step
  screens). Each run checks them against the source and warns when the app has changed.
- **Realistic, not uniform**: one main style per person, kids' activities only with kids, AC instead of radiators in
  hot cities, owners for core-and-shell and full redos, typical ceiling heights per city, Arabic UI for some Cairo users.
- **One or more rooms** per user; the first is the start room, the rest are added with "Add another room".
- **Floor plans**: Swiss users get a real apartment from [Swiss Dwellings](https://zenodo.org/records/7070952)
  (Archilyse, CC BY 4.0), drawn to PNG, with the true inside size of every room — so the plan reader has a known answer.
  Everyone else gets an openly licensed plan from Wikimedia Commons / Openverse; offline, a synthetic plan from
  `qa/floorplan/make_plans.py` (answer file included).
- The output is test data, not code: keep it out of git.
