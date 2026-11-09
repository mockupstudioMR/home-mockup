#!/usr/bin/env python3
"""Put a design snapshot (from snapshot.mjs) into one PDF: cover, contents, then one page per screen
with the desktop and mobile view side by side.

  python3 qa/design-review/build_pdf.py <shots dir> <out.pdf> [--prev <previous shots.json>]

With --prev, screens that look different from the previous snapshot (or are new) are marked "Changed"
and listed on a "What changed" page. The fingerprint of every screen is written back into shots.json
(field "hash") so the next run can compare against it.
Set PW_CHROMIUM to a Chromium binary when Playwright's own browser is not installed.
"""
import html, json, os, sys
from datetime import datetime
from PIL import Image
from playwright.sync_api import sync_playwright

args = sys.argv[1:]
SHOTS, OUT = os.path.abspath(args[0]), os.path.abspath(args[1])
PREV = args[args.index("--prev") + 1] if "--prev" in args else None
m = json.load(open(os.path.join(SHOTS, "shots.json")))

# ---------- fingerprints (difference hash of the first screen height, 16x9 grid = 36 hex digits) ----------
def fingerprint(path):
    im = Image.open(path).convert("L")
    top = im.crop((0, 0, im.width, min(im.height, round(im.width * 0.625))))
    g = top.resize((17, 9), Image.BILINEAR)
    px = list(g.get_flattened_data() if hasattr(g, "get_flattened_data") else g.getdata())
    bits = "".join("1" if px[r * 17 + c] > px[r * 17 + c + 1] else "0" for r in range(9) for c in range(16))
    return hex(int(bits, 2))[2:].zfill(36)

def distance(a, b):
    if len(a) != len(b):
        return 1.0
    return bin(int(a, 16) ^ int(b, 16)).count("1") / (len(a) * 4)

for s in m["screens"]:
    if s.get("desktop"):
        s["hash"] = fingerprint(os.path.join(SHOTS, s["desktop"]))

# previous snapshot: a shots.json, or the compact index the review page keeps ({"commitShort", "index": {id: [hash, ...]}})
prev = {}
if PREV and os.path.exists(PREV):
    P = json.load(open(PREV))
    if "index" in P:
        prev = {k: {"hash": v[0]} for k, v in P["index"].items()}
    else:
        prev = {s["id"]: s for s in P.get("screens", [])}
    m["previousCommit"] = P.get("commitShort")
for s in m["screens"]:
    p = prev.get(s["id"])
    if not prev:
        s["change"] = None
    elif not p or not p.get("hash"):
        s["change"] = "new"
    elif s.get("hash") and distance(s["hash"], p["hash"]) > 0.08:
        s["change"] = "changed"
    else:
        s["change"] = None

# ---------- smaller copies for the PDF (about 1.4x the printed size, JPEG) ----------
SMALL = os.path.join(SHOTS, "pdf-img")
def small(rel, width):
    out = os.path.join(SMALL, rel)
    if not os.path.exists(out):
        os.makedirs(os.path.dirname(out), exist_ok=True)
        im = Image.open(os.path.join(SHOTS, rel)).convert("RGB")
        w = round(width * 1.4)
        if im.width > w:
            im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        im.save(out, "JPEG", quality=72, optimize=True, progressive=True)
    return out

# ---------- chapters ----------
def group_of(s):
    for g in m["groups"]:
        if g["area"] == s["area"] and (not g["prefix"] or s["board"] == g["prefix"] or s["board"].startswith(g["prefix"])):
            return g
    return m["groups"][-1]

order = {g["key"]: i for i, g in enumerate(m["groups"])}
def step_num(s):
    import re
    mm = re.match(r"S(\d+)-", s["board"])
    return int(mm.group(1)) if mm else 0
pos = {s["id"]: i for i, s in enumerate(m["screens"])}
screens = sorted(m["screens"], key=lambda s: (order[group_of(s)["key"]], step_num(s), s["board"].endswith("Summary"), pos[s["id"]] if s["area"] == "public" else 0, s["board"]))
for i, s in enumerate(screens, 1):
    s["no"] = i
    s["group"] = group_of(s)["key"]
json.dump(m, open(os.path.join(SHOTS, "shots.json"), "w"), indent=1)

# ---------- layout ----------
PW = 1600                     # page width in px
DW, MW = 1080, 300            # desktop and mobile image widths on the page
HEAD, FOOT, PAD = 118, 54, 48
e = html.escape
date = datetime.fromisoformat(m["commitDate"]).strftime("%-d %B %Y, %H:%M") if m.get("commitDate") else ""
taken = datetime.fromisoformat(m["takenAt"].replace("Z", "+00:00")).strftime("%-d %B %Y")
changed = [s for s in screens if s.get("change")]

css_pages, body = [], []
def page(name, height, inner, cls=""):
    css_pages.append(f"@page {name} {{ size: {PW}px {height}px; margin: 0 }}")
    body.append(f'<section class="pg {cls}" style="page:{name};height:{height}px">{inner}</section>')

footer = lambda n: f'<div class="ft"><span>Home Mockup · design snapshot · commit {e(m["commitShort"])}</span><span>{n}</span></div>'

# cover
page("cover", 1000, f"""
<div class="cv"><div class="brand"><span class="bm"></span>Home Mockup</div>
 <div><p class="eyebrow">Design snapshot</p><h1>Every screen,<br>as it is on main</h1>
 <p class="lead">{len(screens)} screens · desktop 1440 px and mobile 390 px · rendered with sample data from the latest push.</p></div>
 <table class="meta"><tr><td>Commit</td><td><b>{e(m["commitShort"])}</b> — {e(m.get("commitSubject",""))}</td></tr>
 <tr><td>Pushed</td><td>{e(date)}</td></tr><tr><td>Rendered</td><td>{e(taken)}</td></tr>
 <tr><td>Since last snapshot</td><td>{(str(len(changed)) + " screens changed or new" + (" (vs " + e(m["previousCommit"]) + ")" if m.get("previousCommit") else "")) if prev else "First snapshot — nothing to compare yet"}</td></tr></table>
 <p class="how">To change a design: open the <b>Design review</b> page, mark up the screen and write what should change, then approve it. Approved changes go to the feature list.</p>
</div>
<div class="cv-img"><img src="file://{small(screens[0]['desktop'], 1100)}"></div>""", "cover")

# contents (two columns)
rows, last = [], None
for s in screens:
    g = group_of(s)
    if g["key"] != last:
        rows.append(f'<div class="tg"><b>{e(g["title"])}</b> {e(g["sub"])}</div>')
        last = g["key"]
    badge = f'<span class="bd {s["change"]}">{"New" if s["change"]=="new" else "Changed"}</span>' if s.get("change") else ""
    warn = ' <span class="bd err">!</span>' if s.get("error") or s.get("redirectedTo") else ""
    rows.append(f'<div class="tr"><span class="n">{s["no"]}</span><span class="t">{e(s["title"])}{badge}{warn}</span><span class="r">{e(s["route"])}</span></div>')
per_col = 38
cols = [rows[i:i + per_col] for i in range(0, len(rows), per_col)]
for ci in range(0, len(cols), 2):
    pair = cols[ci:ci + 2]
    page(f"toc{ci}", 1000, f'<div class="toc"><p class="eyebrow">Contents</p><div class="cols">' + "".join(f'<div class="col">{"".join(c)}</div>' for c in pair) + f"</div></div>{footer('')}")

# what changed
if changed:
    items = "".join(f'<div class="ch"><img src="file://{small(s["desktop"], 340)}"><div><b>{s["no"]}. {e(s["title"])}</b><span class="bd {s["change"]}">{"New" if s["change"]=="new" else "Changed"}</span><br><small>{e(s["route"])}</small></div></div>' for s in changed[:24])
    page("changes", 1000, f'<div class="toc"><p class="eyebrow">What changed since {e(m.get("previousCommit") or "the last snapshot")}</p><div class="chg">{items}</div>{"<p>…and " + str(len(changed)-24) + " more</p>" if len(changed) > 24 else ""}</div>{footer("")}')

# one page per screen
for s in screens:
    g = group_of(s)
    dh = mh = 0
    if s.get("desktop"):
        w, h = Image.open(os.path.join(SHOTS, s["desktop"])).size
        dh = round(h * DW / w)
    if s.get("mobile"):
        w, h = Image.open(os.path.join(SHOTS, s["mobile"])).size
        mh = round(h * MW / w)
    H = HEAD + max(dh, mh, 300) + FOOT + PAD
    badge = f'<span class="bd {s["change"]}">{"New screen" if s["change"]=="new" else "Changed since last snapshot"}</span>' if s.get("change") else ""
    note = ""
    if s.get("error"):
        note = f'<p class="warn">Could not render: {e(s["error"])}</p>'
    elif s.get("redirectedTo"):
        note = f'<p class="warn">Opened {e(s["route"])} but ended on {e(s["redirectedTo"])}</p>'
    imgs = (f'<figure class="d"><img src="file://{small(s["desktop"], DW)}" style="width:{DW}px"><figcaption>Desktop · 1440</figcaption></figure>' if s.get("desktop") else "") + \
           (f'<figure class="m"><img src="file://{small(s["mobile"], MW)}" style="width:{MW}px"><figcaption>Mobile · 390</figcaption></figure>' if s.get("mobile") else "")
    page(f"s{s['no']}", H, f"""
<header><div><p class="eyebrow">{e(g["title"])} · {e(g["sub"])}</p><h2><span class="no">{s["no"]}</span>{e(s["title"])} {badge}</h2></div>
<div class="ids"><span>Screen ID <b>{e(s["id"])}</b></span><span>Route <b>{e(s["route"])}</b></span><span>{"Signed in as " + e(s["role"]) if s.get("role") else "Signed out"}</span></div></header>
{note}<div class="shots">{imgs}</div>{footer(s["no"])}""", "scr")

doc = f"""<!doctype html><html><head><meta charset="utf-8"><style>
{chr(10).join(css_pages)}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:Inter,"Helvetica Neue",Arial,sans-serif;color:#2b2233;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.pg{{position:relative;width:{PW}px;overflow:hidden;break-after:page;background:#fbf9f7}}
.eyebrow{{font-size:15px;letter-spacing:.12em;text-transform:uppercase;color:#7a5a8c;font-weight:600}}
.cover{{display:grid;grid-template-columns:640px 1fr;background:#f4efea}}
.cv{{padding:64px;display:flex;flex-direction:column;justify-content:space-between}}
.brand{{display:flex;align-items:center;gap:12px;font-weight:700;font-size:22px}}.bm{{width:30px;height:30px;border-radius:8px;background:#4b2a63}}
h1{{font-family:Georgia,serif;font-weight:400;font-size:64px;line-height:1.05;margin:14px 0 18px;color:#2b1838}}
.lead{{font-size:20px;line-height:1.5;color:#5b4d66;max-width:500px}}
.meta{{font-size:16px;border-collapse:collapse}}.meta td{{padding:7px 0;border-top:1px solid #e2d8de;vertical-align:top}}.meta td:first-child{{color:#8b7d94;width:170px}}
.how{{font-size:15px;line-height:1.5;color:#5b4d66;background:#fff;border-radius:12px;padding:16px 18px}}
.cv-img{{overflow:hidden;padding:64px 0 0 0}}.cv-img img{{width:1100px;border-radius:14px 0 0 0}}
.toc{{padding:56px 64px}}.cols{{display:flex;gap:56px;margin-top:22px}}.col{{flex:1}}
.tg{{font-size:15px;color:#7a5a8c;margin:14px 0 4px}}.tg b{{color:#2b1838;margin-right:6px}}
.tr{{display:flex;gap:12px;font-size:14px;padding:3px 0;border-bottom:1px dotted #e2d8de}}.tr .n{{width:26px;color:#8b7d94}}.tr .t{{flex:1}}.tr .r{{color:#8b7d94;font-family:monospace;font-size:12px}}
.bd{{display:inline-block;font-size:11px;font-weight:700;border-radius:20px;padding:3px 9px;margin-left:8px;vertical-align:middle;letter-spacing:.02em}}
.bd.changed{{background:#fde8c8;color:#8a4b00}}.bd.new{{background:#d9f0e1;color:#1d6b3a}}.bd.err{{background:#fbd5d5;color:#9b1c1c}}
.chg{{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:22px}}.ch img{{width:100%;height:190px;object-fit:cover;object-position:top;border-radius:8px;border:1px solid #e2d8de}}.ch div{{font-size:14px;margin-top:6px}}
.scr header{{height:{HEAD}px;padding:28px 48px 0;display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #ece4e9;background:#fff}}
.no{{display:inline-block;min-width:44px;color:#b7a6c2;font-weight:500}}h2{{font-size:28px;font-weight:650;margin-top:6px;color:#2b1838}}
.ids{{display:flex;flex-direction:column;align-items:flex-end;gap:4px;font-size:13px;color:#8b7d94}}.ids b{{color:#2b2233;font-family:monospace;font-weight:500}}
.warn{{margin:12px 48px 0;padding:10px 14px;background:#fdecec;color:#9b1c1c;border-radius:8px;font-size:14px}}
.shots{{display:flex;gap:60px;padding:{PAD // 2}px 48px 0;align-items:flex-start}}
figure img{{display:block;border-radius:8px;border:1px solid #e2d8de}}figure.m img{{border-radius:22px}}
figcaption{{font-size:12px;color:#8b7d94;margin-top:6px}}
.ft{{position:absolute;left:0;right:0;bottom:0;height:{FOOT - 14}px;padding:0 48px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#a89aaf;border-top:1px solid #ece4e9}}
</style></head><body>{''.join(body)}</body></html>"""

tmp = os.path.join(SHOTS, "book.html")
open(tmp, "w").write(doc)
with sync_playwright() as p:
    exe = os.environ.get("PW_CHROMIUM")
    b = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()
    pg = b.new_page()
    pg.goto("file://" + tmp, wait_until="load")
    pg.pdf(path=OUT, prefer_css_page_size=True, print_background=True)
    b.close()
print(f"{len(screens)} screens, {len(changed)} changed → {OUT} ({os.path.getsize(OUT) // 1024} KB)")
