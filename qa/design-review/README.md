# Design review

Turns the latest push to `main` into a design book (PDF) and a review page where Monica marks up screens, writes what should change and approves it. Approved edits she pushes become ideas on the Feature Pipeline board, where the feature builder agent writes the spec for her to approve and then builds it.

Run by the scheduled task **"home-mockup design review"** (hourly; it does nothing when there is no new commit and no pushed edit).

```
PW_CHROMIUM=<chromium binary, optional> node qa/design-review/snapshot.mjs --out qa/design-review/out/shots
python3 qa/design-review/build_pdf.py qa/design-review/out/shots qa/design-review/out/<name>.pdf [--prev <prev.json>]
python3 qa/design-review/page_data.py plan qa/design-review/out/shots <prev.json>
python3 qa/design-review/page_data.py ops  qa/design-review/out/shots <prev.json> <uploads.txt> <pdf>
```

| File | What it is |
|---|---|
| `snapshot.mjs` | Opens every screen with the screen agent's fake database (nothing touches the live project) and saves desktop (1440) and mobile (390) screenshots plus `shots.json` |
| `extra-screens.json` | Screens added to the journey/admin boards of `../screen-agent/screens.config.json` (landing, auth, quiz…) and the PDF chapters |
| `build_pdf.py` | Cover, contents, "what changed" page and one page per screen. With `--prev` it marks screens that look different from the last snapshot |
| `page_data.py` | Which pictures to upload to the review page (only changed screens) and the two database documents to write |
| `review-page.html` | Source of the review page (artifact `4349d974-8c7f-4f1a-a445-25c9d1bc8041`) |
| `out/` | Working files, not committed |

Review page database:
- `meta/current`: current snapshot, PDF asset, chapters, and `index` {screenId: [look hash, desktop asset, mobile asset, commit since]} for the next comparison
- `snapshots/<commit>`: all screens of that snapshot
- `edits/<id>`: Monica's edits. `status`: draft → approved → queued (she pushed it) → sent (on the board, `featureId`, `featureStatus`) or rejected. `shapes` = her marks, `markupAssetId` = screen with marks, `uploadAssetId` = her own version, `beforeAssetId` = the screen as it was

To add a screen: put it in `extra-screens.json` (or in the screen agent config) with its route and who is signed in.
