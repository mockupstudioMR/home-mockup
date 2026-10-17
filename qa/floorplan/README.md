# Floor-plan reader checks

The reader itself is `public/py/floorplan.py` (Python + OpenCV). The app runs it in the browser through Pyodide
(`src/journey/plan/`), on step 4.1 "Upload a floorplan". No AI is involved; the AI estimate is only a fallback.

| Script | What it checks | Run |
|---|---|---|
| `make_plans.py` | Draws sample plans with known answers: solid, grey, outline and hatched walls, half made to look scanned | `python3 qa/floorplan/make_plans.py <dir> 80` |
| `check.py` | Reads every sample with the Python reader and scores it (proportions within 2 %, doors and windows on the right wall within 4 %) | `python3 qa/floorplan/check.py <dir>` |
| `browser-check.mjs` | The same, inside Chromium through Pyodide, exactly as the app runs it | `N=80 node qa/floorplan/browser-check.mjs <pyodide dir> <dir>` with the app running on port 8091 |
| `real_check.py` + `real.json` | Real estate-agent plans from public research repos (cloned on first run): each room tapped, proportions compared with the size printed on the plan | `python3 qa/floorplan/real_check.py` |
| `e2e-step4.mjs` | Step 4 end to end: upload a plan, check sizes, doors and windows, pick another room, type a measurement | `node qa/floorplan/e2e-step4.mjs <pyodide dir> <plan.jpg> <out dir>` |

`<pyodide dir>` is the unpacked Pyodide 0.26.4 release (github.com/pyodide/pyodide/releases), so the browser
checks don't need the CDN. Needs `pip install opencv-python-headless numpy`.

Last run (17 Oct 2026):
- Drawn samples (80): proportions within 2 % on 74; 90 % of doors and windows found on the right wall.
- Real agent plans (3 plans, 18 rooms, tapped): proportions within 5 % on 7 of 18 straight away. Open-plan
  areas, rooms joined by wide doorways and thin partitions are the hard cases.
- That is why step 4.2 shows the outline on the plan: the person drags an edge onto the right wall and it snaps
  to the wall face (rough drags land within 2 % on 19 of 20 test rooms), or taps another room.
- The size guessed from the door width is rough on real plans (median 35 % off), so the person's one real
  measurement sets the size.
