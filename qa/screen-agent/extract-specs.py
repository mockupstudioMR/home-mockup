#!/usr/bin/env python3
"""Turn design boards (.dc.html from the design canvases) into screen specs for the screen-check agent.

  python3 qa/screen-agent/extract-specs.py <journey-canvas-dir> <admin-canvas-dir> [<design-shots-dir-journey> <design-shots-dir-admin>]

Each spec lists what a screen must show. "must" items are the screen's fixed words (titles, section
headings, field labels, buttons). "sample" items are example content from the design (a piano, a plum sofa)
that the real screen fills from the user's own data; they are reported but never fail a screen.
Routes and how to reach each screen live in screens.config.json, not here.
"""
import json, re, sys, os
from bs4 import BeautifulSoup

HERE = os.path.dirname(os.path.abspath(__file__))
SAMPLE = re.compile(r"piano|plum|walnut|brass|velvet|eclectic|biophilic|jewel|curved|l-shape|terracotta|sage|oak|linen|boucl|rattan|"
                    r"maya|anna|lena|jonas|sara|berlin|\bwall [a-f]\b|\b\d+(\.\d+)?\s?(cm|m|mm|€|kg|%)|€\s?\d|\d+\s?×|×\s?\d|"
                    r"\b\d{2,}\b|green|ochre|mustard|emerald|navy|blush|cream|marble|travertine|ikea|bolia|hay\b|muuto|kave|ferm", re.I)
MUST_CLASSES = {"eyebrow", "h1", "h2", "h3", "btn", "next-btn", "link-btn", "lbl", "prog-label", "back"}
SOFT_CLASSES = {"opt-t", "k", "kw", "tag", "chip"}

def norm(t):
    t = t.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"').replace("–", "-").replace("—", "-")
    return " ".join(t.split())

def items_for(path, area):
    soup = BeautifulSoup(open(path, encoding="utf-8").read(), "html.parser")
    root = soup.select_one(".app") or soup
    out, seen = [], set()
    title = soup.title.get_text(strip=True) if soup.title else ""
    for el in root.find_all(True):
        cls = set(el.get("class") or [])
        kind = None
        if el.name == "h1" or "h1" in cls: kind = "title"
        elif "eyebrow" in cls: kind = "eyebrow"
        elif el.name in ("h2", "h3") or cls & {"h2", "h3"}: kind = "heading"
        elif el.name == "th": kind = "column"
        elif el.name == "label" or "lbl" in cls: kind = "label"
        elif cls & {"btn", "next-btn", "link-btn"} or (el.name == "a" and "back" in cls): kind = "button"
        elif "prog-label" in cls:
            for sp in el.find_all("span", recursive=False):
                t = norm(sp.get_text(" ", strip=True))
                m = re.match(r"(Step \d+ of 10)", t)
                if m and m.group(1) not in seen:
                    seen.add(m.group(1)); out.append({"text": m.group(1), "kind": "progress", "must": True})
            continue
        elif cls & SOFT_CLASSES: kind = "content"
        elif el.name == "button": kind = "control"
        if not kind: continue
        # icon-only or nested duplicates
        t = norm(el.get_text(" ", strip=True))
        if not t or len(t) > 90 or t in seen: continue
        if kind in ("button", "control"):
            t = re.sub(r"^[←→]\s*|\s*[←→]$", "", t).strip()
        if not t: continue
        seen.add(t)
        must = kind in ("title", "eyebrow", "heading", "column", "label", "button") and not SAMPLE.search(t)
        if area == "admin" and kind == "heading" and SAMPLE.search(t): must = False
        out.append({"text": t, "kind": kind, "must": must})
    return title, out

def main():
    jdir, adir = sys.argv[1], sys.argv[2]
    for area, d in (("journey", jdir), ("admin", adir)):
        canvas = json.load(open(os.path.join(d, "canvas.json")))
        specs = []
        ov = json.load(open(os.path.join(HERE, "overrides.json"))).get(area, {})
        for f, b in canvas["boards"].items():
            title, items = items_for(os.path.join(d, f), area)
            board = f.replace(".dc.html", "")
            o = ov.get(board, {})
            for it in items:
                if it["text"] in o.get("soft", []): it["must"] = False
                if it["text"] in o.get("match", {}): it["match"] = o["match"][it["text"]]; it["must"] = True
            specs.append({"board": board, "title": b["title"], "page": title, "items": items,
                          "design": f"designs/{area}/{board}.jpg"})
        specs.sort(key=lambda s: (s["title"]))
        json.dump(specs, open(os.path.join(HERE, "specs", f"{area}.json"), "w"), indent=1, ensure_ascii=False)
        print(area, len(specs), "boards,", sum(len(s["items"]) for s in specs), "items,",
              sum(1 for s in specs for i in s["items"] if i["must"]), "must")

if __name__ == "__main__":
    main()
