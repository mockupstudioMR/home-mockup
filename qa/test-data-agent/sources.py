"""
Where floor plans and inspiration photos come from. Every file saved gets its page link, author and licence.

Floor plans
  * Swiss homes  — "Swiss Dwellings" by Archilyse (CC BY 4.0, 42k real Swiss apartments as vector geometry):
                   https://zenodo.org/records/7070952 . Downloaded once (~800 MB) into the cache, then each picked
                   apartment is drawn to a PNG. Because the geometry is exact, the test case also gets the real
                   inside size of the room under test — a known answer for the floor-plan reader.
  * Other homes  — openly licensed plans found through Openverse (api.openverse.org) and Wikimedia Commons.
  * No internet  — synthetic architect-style plans from qa/floorplan/make_plans.py (answer file included).

Inspiration photos
  * Pexels (if PEXELS_API_KEY is set), else Openverse, else Wikimedia Commons — all with a link to the page.
"""
import json
import os
import random
import sys
import time
import urllib.parse
import urllib.request

UA = "MockUpStudio-QA-test-data/1.0 (+https://github.com/mockupstudioMR/home-mockup)"
SWISS_RECORD = "https://zenodo.org/records/7070952"
SWISS_CSV = "https://zenodo.org/records/7070952/files/geometries.csv?download=1"
SWISS_CREDIT = "Swiss Dwellings dataset, Archilyse AG — CC BY 4.0"


# ----------------------------------------------------------------------------------------------- web helpers
def _get(url, headers=None, timeout=40):
    req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def _json(url, headers=None):
    return json.loads(_get(url, headers).decode("utf-8"))


def download(url, dest, headers=None):
    data = _get(url, headers, timeout=90)
    if len(data) < 5000:
        raise ValueError("file too small to be an image")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "wb") as f:
        f.write(data)
    return dest


def _ext(url, default=".jpg"):
    e = os.path.splitext(urllib.parse.urlparse(url).path)[1].lower()
    return e if e in (".jpg", ".jpeg", ".png", ".webp", ".gif") else default


# ----------------------------------------------------------------------------------------------- image search
def search_pexels(query, n):
    key = os.environ.get("PEXELS_API_KEY")
    if not key:
        return []
    q = urllib.parse.urlencode({"query": query, "per_page": min(40, n * 3), "orientation": "landscape"})
    data = _json(f"https://api.pexels.com/v1/search?{q}", {"Authorization": key})
    return [{"image": p["src"]["large"], "page": p["url"], "author": p.get("photographer", ""), "licence": "Pexels License",
             "title": p.get("alt") or query} for p in data.get("photos", [])]


def search_openverse(query, n, category="photograph"):
    params = {"q": query, "page_size": min(40, n * 4), "license_type": "all-cc", "mature": "false"}
    if category:
        params["category"] = category
    q = urllib.parse.urlencode(params)
    data = _json(f"https://api.openverse.org/v1/images/?{q}")
    out = []
    for r in data.get("results", []):
        lic = (r.get("license") or "").upper()
        out.append({"image": r.get("url"), "page": r.get("foreign_landing_url") or r.get("url"), "author": r.get("creator") or "",
                    "licence": f"CC {lic} {r.get('license_version') or ''}".strip() if lic not in ("CC0", "PDM") else lic,
                    "title": r.get("title") or query})
    return [o for o in out if o["image"]]


def search_commons(query, n):
    q = urllib.parse.urlencode({"action": "query", "format": "json", "generator": "search", "gsrsearch": f"filetype:bitmap {query}",
                                "gsrnamespace": 6, "gsrlimit": min(50, n * 4), "prop": "imageinfo",
                                "iiprop": "url|extmetadata", "iiurlwidth": 1600})
    data = _json(f"https://commons.wikimedia.org/w/api.php?{q}")
    out = []
    for p in (data.get("query", {}).get("pages", {}) or {}).values():
        ii = (p.get("imageinfo") or [{}])[0]
        meta = ii.get("extmetadata", {})
        out.append({"image": ii.get("thumburl") or ii.get("url"), "page": ii.get("descriptionurl"),
                    "author": _strip_html(meta.get("Artist", {}).get("value", "")),
                    "licence": meta.get("LicenseShortName", {}).get("value", "see page"), "title": p.get("title", "")})
    return [o for o in out if o["image"]]


def _strip_html(s):
    import re
    return re.sub(r"<[^>]+>", "", s).strip()[:120]


def find_images(queries, n, rnd, used, kind="photo"):
    """Try each provider with each query until n new images are found. `used` keeps a test batch from repeating."""
    found = []
    if kind == "photo":
        providers = [search_pexels, search_openverse, search_commons]
    else:  # plans are drawings, not photos
        providers = [search_commons, lambda q, k: search_openverse(q, k, category=None)]
    for q in queries:
        for prov in providers:
            try:
                hits = prov(q, n)
            except Exception as e:  # provider down or rate-limited: try the next one
                print(f"    · {getattr(prov, '__name__', 'provider')} failed for {q!r}: {e}", file=sys.stderr)
                continue
            rnd.shuffle(hits)
            for h in hits:
                if h["image"] in used or h["page"] in used:
                    continue
                found.append({**h, "query": q})
                used.add(h["image"]); used.add(h["page"])
                if len(found) >= n:
                    return found
            time.sleep(0.4)
    return found


# ----------------------------------------------------------------------------------------------- inspiration
def save_inspiration(hits, folder):
    """Download each hit into folder; returns the saved list with file names. Skips any that fail."""
    saved = []
    for i, h in enumerate(hits, 1):
        dest = os.path.join(folder, f"insp-{i:02d}{_ext(h['image'])}")
        try:
            download(h["image"], dest)
            saved.append({**h, "file": os.path.basename(dest)})
        except Exception as e:
            print(f"    · could not download {h['image']}: {e}", file=sys.stderr)
    with open(os.path.join(folder, "SOURCES.md"), "w", encoding="utf-8") as f:
        f.write("# Inspiration sources\n\n| File | Page | Author | Licence | Search |\n|---|---|---|---|---|\n")
        for s in saved:
            f.write(f"| {s['file']} | [{s['title'][:60]}]({s['page']}) | {s['author']} | {s['licence']} | {s['query']} |\n")
    return saved


# ----------------------------------------------------------------------------------------------- open-licence plans
PLAN_QUERIES = ["apartment floor plan", "house floor plan", "flat floor plan drawing", "floorplan residential", "Grundriss Wohnung"]


def web_plan(folder, rnd, used, hint=""):
    qs = ([f"{hint} floor plan"] if hint else []) + rnd.sample(PLAN_QUERIES, len(PLAN_QUERIES))
    hits = find_images(qs, 1, rnd, used, kind="plan")
    if not hits:
        return None
    h = hits[0]
    dest = os.path.join(folder, "plan" + _ext(h["image"], ".png"))
    download(h["image"], dest)
    return {"file": os.path.basename(dest), "page": h["page"], "author": h["author"], "licence": h["licence"],
            "title": h["title"], "swiss": False, "kind": "web", "rooms": None}


# ----------------------------------------------------------------------------------------------- Swiss Dwellings
ROOM_TYPES = {  # Swiss Dwellings area subtypes → app room ids
    "LIVING_ROOM": "living-room", "LIVING_DINING": "living-room", "BEDROOM": "bedroom", "ROOM": "bedroom",
    "KITCHEN": "kitchen", "KITCHEN_DINING": "kitchen", "DINING": "dining-room", "BATHROOM": "bathroom",
    "CORRIDOR": "hallway", "OFFICE": "office", "STUDIO": "office",
}


class SwissDwellings:
    """Reads the geometries CSV once and draws apartments. Columns are found by name, so newer versions also work."""

    def __init__(self, cache):
        self.cache = cache
        self.csv = os.path.join(cache, "swiss_dwellings_geometries.csv")
        self.index_file = os.path.join(cache, "swiss_dwellings_index.json")
        self.index = None

    def ready(self):
        if os.path.exists(self.index_file):
            self.index = json.load(open(self.index_file))
            return True
        if not os.path.exists(self.csv):
            print(f"  Downloading Swiss Dwellings (~800 MB, once) from {SWISS_RECORD} …")
            os.makedirs(self.cache, exist_ok=True)
            tmp = self.csv + ".part"
            req = urllib.request.Request(SWISS_CSV, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=120) as r, open(tmp, "wb") as f:
                while True:
                    b = r.read(1 << 20)
                    if not b:
                        break
                    f.write(b)
            os.replace(tmp, self.csv)
        self._build_index()
        return True

    def _build_index(self):
        """One pass: per apartment, its floor, its areas (type + polygon), so plans can be drawn without re-reading 800 MB."""
        import pandas as pd
        print("  Indexing Swiss Dwellings (one-off, a few minutes) …")
        cols = pd.read_csv(self.csv, nrows=0).columns
        pick = lambda *names: next((c for c in cols if c.lower() in names), None)
        c_apt, c_floor = pick("apartment_id"), pick("floor_id")
        c_type, c_sub, c_geo = pick("entity_type"), pick("entity_subtype"), pick("geometry")
        apts = {}
        floors = {}
        for chunk in pd.read_csv(self.csv, usecols=[c for c in (c_apt, c_floor, c_type, c_sub, c_geo) if c], chunksize=200_000):
            for row in chunk.itertuples(index=False):
                d = row._asdict()
                apt, floor = d.get(c_apt), d.get(c_floor)
                et, sub, geo = str(d.get(c_type)).lower(), str(d.get(c_sub)).upper(), d.get(c_geo)
                if not isinstance(geo, str):
                    continue
                if et == "area" and isinstance(apt, str) and apt:
                    a = apts.setdefault(apt, {"floor": str(floor), "areas": []})
                    a["areas"].append([sub, geo])
                elif et in ("separator", "opening"):
                    floors.setdefault(str(floor), []).append([et, sub, geo])
        # keep it light: sample 1500 apartments with a living room and at least one bedroom, and only their floors
        good = [k for k, v in apts.items() if {"LIVING_ROOM", "LIVING_DINING"} & {s for s, _ in v["areas"]} and any(s == "BEDROOM" for s, _ in v["areas"])]
        random.Random(7).shuffle(good)
        keep = {k: apts[k] for k in good[:1500]}
        keep_floors = {f: floors.get(f, []) for f in {v["floor"] for v in keep.values()}}
        self.index = {"apartments": keep, "floors": keep_floors}
        json.dump(self.index, open(self.index_file, "w"))

    def pick(self, rnd, used, need_rooms=0):
        ids = [k for k in self.index["apartments"] if k not in used]
        rnd.shuffle(ids)
        for k in ids:
            rooms = self.rooms_of(k)
            if len(rooms) >= need_rooms:
                used.add(k)
                return k
        return ids[0] if ids else None

    def rooms_of(self, apt):
        """App rooms in this apartment, with inside size (m) of the largest area of each type."""
        from shapely import wkt
        out = {}
        for sub, geo in self.index["apartments"][apt]["areas"]:
            rid = ROOM_TYPES.get(sub)
            if not rid:
                continue
            g = wkt.loads(geo)
            r = g.minimum_rotated_rectangle
            xs = list(r.exterior.coords)
            import math
            s1 = math.dist(xs[0], xs[1]); s2 = math.dist(xs[1], xs[2])
            info = {"type": sub, "area_m2": round(g.area, 1), "width_m": round(min(s1, s2), 2), "length_m": round(max(s1, s2), 2)}
            key = rid
            n = 2
            while key in out and rid == "bedroom":  # several bedrooms: bedroom, bedroom-2 …
                key = f"bedroom-{n}"; n += 1
            if key not in out or out[key]["area_m2"] < info["area_m2"]:
                out[key] = info
        return out

    def draw(self, apt, dest):
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        from shapely import wkt
        from shapely.geometry import box
        a = self.index["apartments"][apt]
        areas = [(s, wkt.loads(g)) for s, g in a["areas"]]
        minx = min(g.bounds[0] for _, g in areas); miny = min(g.bounds[1] for _, g in areas)
        maxx = max(g.bounds[2] for _, g in areas); maxy = max(g.bounds[3] for _, g in areas)
        frame = box(minx - 0.6, miny - 0.6, maxx + 0.6, maxy + 0.6)
        fig, ax = plt.subplots(figsize=(10, 10 * (maxy - miny + 1.2) / max(maxx - minx + 1.2, 1)), dpi=150)
        for sub, g in areas:
            for poly in getattr(g, "geoms", [g]):
                x, y = poly.exterior.xy
                ax.fill(x, y, color="#F4F1EC" if sub not in ("BALCONY", "LOGGIA") else "#E6EFE9", lw=0)
            c = g.representative_point()
            label = sub.replace("_", " ").title()
            ax.text(c.x, c.y, f"{label}\n{g.area:.1f} m²", ha="center", va="center", fontsize=7, color="#555")
        for et, sub, geo in self.index["floors"].get(a["floor"], []):
            g = wkt.loads(geo)
            if not g.intersects(frame):
                continue
            g = g.intersection(frame)
            colour = "#111" if et == "separator" else ("#5B9BD5" if "WINDOW" in sub else "#C9A227")
            for part in getattr(g, "geoms", [g]):
                if part.geom_type == "Polygon":
                    x, y = part.exterior.xy
                    ax.fill(x, y, color=colour, lw=0)
                elif part.geom_type in ("LineString", "LinearRing"):
                    x, y = part.xy
                    ax.plot(x, y, color=colour, lw=2)
        ax.set_aspect("equal"); ax.axis("off")
        ax.plot([minx, minx + 1], [miny - 0.4, miny - 0.4], color="#111", lw=2)
        ax.text(minx + 0.5, miny - 0.55, "1 m", ha="center", va="top", fontsize=7)
        fig.savefig(dest, bbox_inches="tight", facecolor="white")
        plt.close(fig)
        return dest


def swiss_plan(sd, folder, rnd, used, need_rooms):
    apt = sd.pick(rnd, used, need_rooms)
    if not apt:
        return None
    os.makedirs(folder, exist_ok=True)
    sd.draw(apt, os.path.join(folder, "plan.png"))
    return {"file": "plan.png", "page": SWISS_RECORD, "author": "Archilyse AG", "licence": "CC BY 4.0",
            "title": f"Swiss Dwellings apartment {apt}", "apartment_id": apt, "swiss": True, "kind": "swiss", "rooms": sd.rooms_of(apt)}


# ----------------------------------------------------------------------------------------------- synthetic fallback
def synthetic_plan(repo, folder, seed):
    sys.path.insert(0, os.path.join(repo, "qa", "floorplan"))
    import cv2
    import make_plans  # noqa: E402  (the repo's own sample-plan maker)
    res = make_plans.make(seed, scan=seed % 2 == 0)
    img, answer = (res[0], res[1]) if isinstance(res, tuple) else (res, {})
    os.makedirs(folder, exist_ok=True)
    cv2.imwrite(os.path.join(folder, "plan.png"), img)
    json.dump(answer, open(os.path.join(folder, "plan.answer.json"), "w"), indent=1, default=str)
    return {"file": "plan.png", "page": "qa/floorplan/make_plans.py (generated, no web source)", "author": "MockUp Studio QA",
            "licence": "internal", "title": f"Synthetic plan, seed {seed}", "swiss": False, "kind": "synthetic", "rooms": None,
            "answer": answer}


def write_plan_source(folder, plan):
    with open(os.path.join(folder, "SOURCE.md"), "w", encoding="utf-8") as f:
        f.write(f"# Floor plan source\n\n- File: `{plan['file']}`\n- From: {plan['page']}\n- Title: {plan['title']}\n")
        f.write(f"- Author: {plan['author']}\n- Licence: {plan['licence']}\n- Swiss home: {'yes 🇨🇭' if plan['swiss'] else 'no'}\n")
        if plan.get("apartment_id"):
            f.write(f"- Apartment id in the dataset: `{plan['apartment_id']}` (credit: {SWISS_CREDIT})\n")
        if plan.get("rooms"):
            f.write("\n## Rooms in this plan (measured from the dataset geometry)\n\n| Room | Dataset type | Inside size | Area |\n|---|---|---|---|\n")
            for k, v in plan["rooms"].items():
                f.write(f"| {k} | {v['type']} | {v['width_m']} × {v['length_m']} m | {v['area_m2']} m² |\n")
