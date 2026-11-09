#!/usr/bin/env python3
"""Turn a design snapshot into what the Design review page needs. Used by the design-review agent.

The page (an artifact) keeps two documents per run in its database:
  snapshots/<commit>  every screen with its picture asset ids (created new each run)
  meta/current        which snapshot is current, the PDF, counts, chapters, and a compact index
                      {screenId: [hash, desktopAssetId, mobileAssetId, sinceCommit]} for the next run.
Pictures are assets of the artifact; only screens that look different from the previous snapshot are uploaded again.

  python3 page_data.py plan <shots dir> [<prev.json>]
      prev.json = the meta/current document as read from the page (or {} on the first run).
      Prints JSON: {"upload": [[{"name", "path"}, ...batches of 10], "reuse": n}

  python3 page_data.py ops <shots dir> <prev.json> <uploads.txt> <pdf file>
      uploads.txt = one line per uploaded file: "<sha256, first 12+ chars> <opaque_id>", copied from the
                    upload_asset (or list_assets) results, the PDF's line included. Files are matched by sha256,
                    so order and names don't matter, and extra lines are ignored.
      Prints JSON: {"snapshot": {"path", "data"}, "meta": {"path", "data"}} ready for db_write
      (snapshot: op "set" without ifVersion; meta: op "set" with the version read, or without on the first run).
"""
import hashlib, json, os, sys

mode, SHOTS = sys.argv[1], os.path.abspath(sys.argv[2])
m = json.load(open(os.path.join(SHOTS, "shots.json")))
prev = json.load(open(sys.argv[3])) if len(sys.argv) > 3 and os.path.exists(sys.argv[3]) else {}
pidx = prev.get("index", {})
IMG = os.path.join(SHOTS, "pdf-img")  # the smaller copies build_pdf.py made


def reusable(s):
    """The previous pictures can stay when build_pdf.py (run with --prev) found the screen unchanged."""
    p = pidx.get(s["id"])
    return p if p and len(p) >= 3 and p[1] and not s.get("change") else None


if mode == "plan":
    files, reuse = [], 0
    for s in m["screens"]:
        if reusable(s):
            reuse += 1
            continue
        for k in ("desktop", "mobile"):
            if s.get(k):
                files.append({"name": f"{s['id']}-{k}.jpg", "path": os.path.join(IMG, s[k])})
    print(json.dumps({"upload": [files[i:i + 10] for i in range(0, len(files), 10)], "reuse": reuse, "files": len(files)}, indent=1))

elif mode == "ops":
    pairs = [ln.split()[:2] for ln in open(sys.argv[4]).read().replace('"', " ").replace(",", " ").replace("[", " ").replace("]", "\n").splitlines() if len(ln.split()) >= 2]
    def asset_for(path):
        h = hashlib.sha256(open(path, "rb").read()).hexdigest()
        for pre, oid in pairs:
            if len(pre) >= 10 and h.startswith(pre.lower()):
                return {"id": oid, "url": "/_blob/" + oid}
        return {}
    uploads = {}
    for s in m["screens"]:
        for k in ("desktop", "mobile"):
            if s.get(k):
                f = os.path.join(IMG, s[k])
                uploads[f] = asset_for(f)
    pdf = asset_for(sys.argv[5])
    if not pdf:
        sys.exit("No upload result for the PDF")
    screens, index, missing = [], {}, []
    for s in sorted(m["screens"], key=lambda x: x.get("no", 999)):
        p = reusable(s)
        if p:
            d_id, m_id = p[1], p[2]
            d_url, m_url = "/_blob/" + d_id, ("/_blob/" + m_id if m_id else "")
            since = p[3] if len(p) > 3 else prev.get("commitShort")
        else:
            dk = os.path.join(IMG, s["desktop"]) if s.get("desktop") else None
            mk = os.path.join(IMG, s["mobile"]) if s.get("mobile") else None
            du, mu = uploads.get(dk, {}) if dk else {}, uploads.get(mk, {}) if mk else {}
            if (dk and not du) or (mk and not mu):
                missing.append(s["id"])
            d_id, d_url, m_id, m_url = du.get("id", ""), du.get("url", ""), mu.get("id", ""), mu.get("url", "")
            since = m["commitShort"]
        index[s["id"]] = [s.get("hash", ""), d_id, m_id, since]
        screens.append({k: v for k, v in {
            "id": s["id"], "no": s.get("no"), "area": s["area"], "board": s["board"], "group": s.get("group"),
            "title": s["title"], "route": s["route"], "role": s.get("role"), "change": s.get("change"),
            "desktopAssetId": d_id, "mobileAssetId": m_id,  # the page loads each as /_blob/<id>
            "snapshotCommit": since, "error": s.get("error"), "redirectedTo": s.get("redirectedTo"),
        }.items() if v not in (None, "")})
    if missing:
        sys.exit("No upload result for: " + ", ".join(missing))
    changed = sum(1 for s in screens if s.get("change"))
    head = {"commit": m["commit"], "commitShort": m["commitShort"], "commitDate": m["commitDate"], "commitSubject": m.get("commitSubject", ""),
            "takenAt": m["takenAt"], "screenCount": len(screens), "changedCount": changed, "previousCommit": prev.get("commitShort", "")}
    meta = {**head, "snapshot": m["commitShort"], "pdfAssetId": pdf.get("id", ""), "pdfUrl": pdf.get("url", ""),
            "groups": m["groups"], "index": index}
    print(json.dumps({"snapshot": {"path": f"snapshots/{m['commitShort']}", "data": {**head, "screens": screens}},
                      "meta": {"path": "meta/current", "data": meta}}))
