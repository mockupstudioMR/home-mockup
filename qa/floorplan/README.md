# Floor-plan reader checks

The reader itself is `public/py/floorplan.py` (Python + OpenCV). The app runs it in the browser through Pyodide
(`src/journey/plan/`), on step 4.1 "Upload a floorplan". No AI is involved; the AI estimate is only a fallback.

| Script | What it checks | Run |
|---|---|---|
| `make_plans.py` | Draws sample plans with known answers: solid, grey, outline and hatched walls, half made to look scanned | `python3 qa/floorplan/make_plans.py <dir> 80` |
| `check.py` | Reads every sample with the Python reader and scores it (proportions within 2 %, doors and windows on the right wall within 4 %) | `python3 qa/floorplan/check.py <dir>` |
| `browser-check.mjs` | The same, inside Chromium through Pyodide, exactly as the app runs it | `N=80 node qa/floorplan/browser-check.mjs <pyodide dir> <dir>` with the app running on port 8091 |
| `e2e-step4.mjs` | Step 4 end to end: upload a plan, check sizes, doors and windows, pick another room, type a measurement | `node qa/floorplan/e2e-step4.mjs <pyodide dir> <plan.jpg> <out dir>` |

`<pyodide dir>` is the unpacked Pyodide 0.26.4 release (github.com/pyodide/pyodide/releases), so the browser
checks don't need the CDN. Needs `pip install opencv-python-headless numpy`.

Last run (17 Oct 2026, 80 samples): proportions within 2 % on 78/80; 93 % of doors and windows found on the
right wall (browser: 245/263); size guessed from the door width before the person types a measurement: median
error 5 %. About 2–3 s per plan in the browser, after a one-time ~20 MB download of Pyodide + OpenCV.

Not yet tested on real plans from agents and listings — add them here with a `.json` answer file to include them.
