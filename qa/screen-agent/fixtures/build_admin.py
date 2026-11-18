"""Sample admin data for the screen-check agent: writes tables.admin.json and storage.json next to this file.

The rows follow the admin design boards (Living rooms · plum & green batch, the smoked-glass pendants,
the four combinations, Eclectic modern, Curved sofa sizes, …) so each admin screen renders like its board.
Dates are "@now-…" tokens that the fake database turns into real timestamps.
Run:  python3 qa/screen-agent/fixtures/build_admin.py
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ADMIN = "00000000-0000-4000-8000-00000000a0a0"
MAYA = "00000000-0000-4000-8000-000000000001"
JONAS, LENA, TOM = "u-jonas", "u-lena", "u-tom"

T = {}  # all tables


def add(table, *rows):
    T.setdefault(table, []).extend(rows)


# ------------------------------------------------------------------ vocabulary
def term(id, facet, label, hex=None, status="active", parent=None, synonyms=(), ago="@now-30d"):
    add("taxonomy_terms", {
        "id": id, "facet": facet, "label": label, "slug": label.lower().replace(" ", "-").replace("é", "e"), "status": status,
        "is_active": status == "active", "hex": hex, "parent_id": parent, "synonyms": list(synonyms), "proposed_from": None, "created_at": ago,
    })


for id, label in [("rt-living", "Living room"), ("rt-bed", "Bedroom"), ("rt-kitchen", "Kitchen")]:
    term(id, "room_type", label)
for id, label in [("k-seating", "Seating"), ("k-lighting", "Lighting"), ("k-storage", "Storage")]:
    term(id, "category", label)
for id, label, parent in [
    ("t-sofa", "Curved sofa", "k-seating"), ("t-chair", "Lounge chair", "k-seating"), ("t-armchair", "Armchair", "k-seating"),
    ("t-wingback", "Wingback chair", "k-seating"), ("t-sofa2", "Sofa", "k-seating"), ("t-console", "Console", "k-storage"),
    ("t-shelving", "Open shelving", "k-storage"), ("t-sideboard", "Sideboard", "k-storage"), ("t-cabinet", "Cabinet", "k-storage"),
    ("t-lamp", "Floor lamp", "k-lighting"), ("t-pendant", "Pendant cluster", "k-lighting"), ("t-walllight", "Wall light", "k-lighting"),
    ("t-vases", "Floor vases", None), ("t-coffee", "Coffee table", None), ("t-bed", "Bed", None), ("t-dining", "Dining table", None),
    ("t-sidetable", "Side table", None),
]:
    term(id, "category", label, parent=parent)
for id, label, hex in [
    ("c-plum", "Plum", "#5B2E45"), ("c-emerald", "Emerald green", "#2F5B4A"), ("c-brass", "Brass", "#B08A3E"), ("c-walnut", "Dark walnut", "#4A3020"),
    ("c-natural", "Natural wood", "#C9A77C"), ("c-sage", "Sage green", "#8C9A86"), ("c-oat", "Oat", "#EDE6DA"), ("c-oak", "Natural oak", "#C9B79C"),
    ("c-charcoal", "Charcoal", "#2E2E2E"), ("c-ink", "Ink blue", "#1F2A3A"), ("c-malachite", "Malachite", "#2F6B55"), ("c-ivory", "Ivory", "#E9E1D4"),
    ("c-burgundy", "Burgundy", "#6B2232"), ("c-green", "Green", "#3D6B4F"),
]:
    term(id, "color", label, hex)
term("c-oxblood", "color", "Oxblood", status="proposed", ago="@now-1d")
for id, label in [("s-eclectic", "Eclectic modern"), ("s-scandi", "Scandinavian"), ("s-trad", "Traditional"), ("s-deco", "Art deco"), ("s-mid", "Mid-century")]:
    term(id, "style", label)
term("s-japandi", "style", "Japandi", status="proposed", ago="@now-1d")
for id, label in [("m-wood", "Wood"), ("m-glass", "Glass"), ("m-metal", "Metal"), ("m-textile", "Textile"), ("m-stone", "Stone"), ("m-fibre", "Natural fibre")]:
    term(id, "material", label)
for id, label, parent, syn in [
    ("m-walnut", "Walnut", "m-wood", ()), ("m-oak", "Oak", "m-wood", ()), ("m-painted", "Painted wood", "m-wood", ()),
    ("m-clear", "Clear glass", "m-glass", ()), ("t-glass", "Tinted glass", "m-glass", ("coloured glass", "amber glass", "getöntes Glas")),
    ("m-opal", "Opal glass", "m-glass", ()), ("m-brass", "Brass", "m-metal", ()), ("m-velvet", "Velvet", "m-textile", ()),
    ("m-leather", "Leather", "m-textile", ()), ("m-linen", "Linen", "m-textile", ()), ("m-wool", "Wool", "m-textile", ()),
    ("m-rattan", "Rattan", "m-fibre", ()), ("m-ceramic", "Ceramic", None, ()),
]:
    term(id, "material", label, parent=parent, synonyms=syn)
for id, label in [("m-smoked", "Smoked glass"), ("m-malachite", "Malachite"), ("m-boucle", "Bouclé")]:
    term(id, "material", label, status="proposed", ago="@now-2h")
for id, label in [("g-lowback", "Low back"), ("g-cane", "Cane sides"), ("g-fluted", "Fluted"), ("g-moss", "Moss panels"), ("g-cone", "Cone shade"),
                  ("g-brassframe", "Brass frame"), ("g-embroidered", "Embroidered"), ("g-turned", "Turned legs")]:
    term(id, "finish", label)
for id, label in [("g-arched", "Arched"), ("g-curved", "Curved"), ("g-arc", "Arc")]:
    term(id, "shape", label)
term("g-crewel", "pattern", "Crewel embroidery", status="proposed", ago="@now-7h")

# ------------------------------------------------------------------ schemes
SCHEMES = [
    # id, cat, color, style, material, source, tags, age
    ("sc-sofa", "t-sofa", "c-plum", "s-eclectic", "m-velvet", "ai_extracted", ["g-lowback"], "@now-2h"),
    ("sc-chair", "t-chair", "c-emerald", "s-mid", "m-leather", "curated", ["g-cane"], "@now-20d"),
    ("sc-console", "t-console", "c-walnut", "s-eclectic", "m-walnut", "admin", ["g-fluted"], "@now-25d"),
    ("sc-shelf", "t-shelving", "c-emerald", "s-eclectic", "m-painted", "curated", ["g-arched"], "@now-2h"),
    ("sc-sideboard", "t-sideboard", "c-walnut", "s-eclectic", "m-walnut", "user", ["g-moss"], "@now-12d"),
    ("sc-lamp", "t-lamp", "c-natural", "s-scandi", "m-rattan", "curated", ["g-arc"], "@now-30d"),
    ("sc-pendant", "t-pendant", "c-brass", "s-deco", "m-brass", "curated", [], "@now-30d"),
    ("sc-wingback", "t-wingback", "c-sage", "s-trad", "m-linen", "ai_extracted", ["g-embroidered", "g-turned"], "@now-3d"),
    ("sc-cabinet", "t-cabinet", "c-walnut", "s-trad", "m-walnut", "curated", [], "@now-30d"),
    ("sc-vases", "t-vases", "c-burgundy", None, "m-ceramic", "curated", [], "@now-30d"),
]
for id, cat, col, sty, mat, src, tags, ago in SCHEMES:
    add("furniture_schemes", {"id": id, "label": None, "category_id": cat, "category_facet": "category", "color_id": col, "color_facet": "color", "style_id": sty,
                              "style_facet": "style", "material_id": mat, "material_facet": "material", "source": src, "status": "active", "tag_signature": ",".join(tags),
                              "created_by": ADMIN, "created_at": ago})
    for g in tags:
        add("furniture_scheme_tags", {"scheme_id": id, "term_id": g})

COMBOS = [
    ("co-1", "Sofa + walnut table", "s-eclectic", "rt-living", "pinned", ["sc-sofa", "sc-console", "sc-lamp"], 0.84, {"curated": 2, "liked": 9, "kept_in_design": 6, "bought_together": 1}),
    ("co-2", "Plum & emerald lounge", "s-eclectic", "rt-living", "active", ["sc-sofa", "sc-chair", "sc-shelf", "sc-lamp"], 0.78, {"curated": 1, "liked": 4, "kept_in_design": 3, "changed_in_design": 1}),
    ("co-3", "Wingback reading corner", "s-trad", "rt-living", "active", ["sc-wingback", "sc-lamp", "sc-cabinet"], 0.66, {"curated": 1, "expert_approved": 1, "liked": 2}),
    ("co-4", "Velvet sofa + glass pendants", "s-deco", "rt-living", "active", ["sc-sofa", "sc-pendant"], 0.21, {"generated": 6, "disliked": 3, "changed_in_design": 2}),
]
n = 0
for id, name, sty, room, status, members, score, sig in COMBOS:
    add("scheme_combinations", {"id": id, "name": name, "style_id": sty, "style_facet": "style", "room_type_id": room, "room_type_facet": "room_type", "status": status,
                                "member_count": len(members), "member_signature": ",".join(sorted(members)), "source": "curated", "notes": None, "ingest_batch_id": None,
                                "created_by": ADMIN, "created_at": "@now-10d"})
    for m in members:
        add("scheme_combination_members", {"combination_id": id, "scheme_id": m, "role": "member"})
    pos = sum(v for k, v in sig.items() if k not in ("disliked", "changed_in_design", "expert_rejected"))
    add("mv_combination_scores", {"combination_id": id, "name": name, "score": score, "member_count": len(members), "positive": pos, "negative": sum(sig.values()) - pos, "users": 5, "last_signal_at": "@now-1d"})
    for k, v in sig.items():
        for _ in range(v):
            n += 1
            add("combination_signals", {"id": f"sig-{n}", "combination_id": id, "signal": k, "note": None, "design_id": None, "room_id": None, "user_id": None, "created_at": "@now-3d"})
for s, w in [("curated", 1), ("bought_together", 3), ("expert_approved", 2), ("kept_in_design", 1), ("liked", 1), ("generated", 0), ("changed_in_design", -1), ("disliked", -1), ("expert_rejected", -2)]:
    add("signal_weights", {"signal": s, "weight": w})

# ------------------------------------------------------------------ scans
add("ingest_batches",
    {"id": "b-demo-running", "name": "Living rooms · plum & green", "source_type": "generated_design", "room_type_id": "rt-living", "style_hint_id": "s-eclectic", "threshold": 0.85,
     "review_all": False, "status": "detecting", "found_count": 6, "saved_count": 4, "waiting_count": 1, "failed_count": 0, "source_credit": "Home Mockup studio", "source_url": None,
     "created_by": ADMIN, "created_at": "@now-15m", "finished_at": None},
    {"id": "b-demo-done", "name": "Living rooms · plum & green", "source_type": "generated_design", "room_type_id": "rt-living", "style_hint_id": "s-eclectic", "threshold": 0.85,
     "review_all": False, "status": "done", "found_count": 12, "saved_count": 9, "waiting_count": 3, "failed_count": 0, "source_credit": "Home Mockup studio", "source_url": None,
     "created_by": ADMIN, "created_at": "@now-2h", "finished_at": "@now-2h"},
    {"id": "b-cat", "name": "Catalogue p. 14–22", "source_type": "catalogue_page", "room_type_id": "rt-living", "style_hint_id": None, "threshold": 0.85, "review_all": False,
     "status": "done", "found_count": 31, "saved_count": 27, "waiting_count": 4, "failed_count": 0, "source_credit": "Atelier Nord", "source_url": None, "created_by": ADMIN, "created_at": "@now-7h", "finished_at": "@now-7h"},
    {"id": "b-bed", "name": "Bedroom refs", "source_type": "room_photo", "room_type_id": "rt-bed", "style_hint_id": None, "threshold": 0.85, "review_all": False,
     "status": "done", "found_count": 14, "saved_count": 12, "waiting_count": 2, "failed_count": 0, "source_credit": None, "source_url": None, "created_by": ADMIN, "created_at": "@now-1d", "finished_at": "@now-1d"},
    {"id": "b-sup", "name": "Support", "source_type": "room_photo", "room_type_id": "rt-living", "style_hint_id": None, "threshold": 0.85, "review_all": False,
     "status": "done", "found_count": 1, "saved_count": 0, "waiting_count": 1, "failed_count": 0, "source_credit": None, "source_url": None, "created_by": ADMIN, "created_at": "@now-2d", "finished_at": "@now-2d"},
)
STORAGE = {"plum-living.jpg": "journey-sample/room-hero.jpg", "arch-shelves.jpg": "journey-sample/piano-wall.jpg", "reference-03.jpg": "journey-sample/insp-1.jpg",
           "catalogue-14.jpg": "journey-sample/luxe-2.jpg", "catalogue-18.jpg": "journey-sample/sofa-wall.jpg", "bedroom-01.jpg": "journey-sample/insp-3.jpg",
           "support-01.jpg": "journey-sample/entry-wall.jpg"}
ITEMS = [
    ("i-r1", "b-demo-running", "plum-living.jpg", "done", "@now-14m"), ("i-r2", "b-demo-running", "arch-shelves.jpg", "detecting", "@now-13m"),
    ("i-r3", "b-demo-running", "reference-03.jpg", "queued", "@now-12m"),
    ("i-d1", "b-demo-done", "plum-living.jpg", "done", "@now-2h"), ("i-d2", "b-demo-done", "arch-shelves.jpg", "done", "@now-2h"),
    ("i-d3", "b-demo-done", "reference-03.jpg", "done", "@now-2h"),
    ("i-c1", "b-cat", "catalogue-14.jpg", "done", "@now-7h"), ("i-c2", "b-cat", "catalogue-18.jpg", "done", "@now-7h"),
    ("i-b1", "b-bed", "bedroom-01.jpg", "done", "@now-1d"), ("i-s1", "b-sup", "support-01.jpg", "done", "@now-2d"),
]
for id, b, f, st, ago in ITEMS:
    add("ingest_items", {"id": id, "batch_id": b, "storage_path": f"{b}/{f}", "source_url": None, "status": st, "error": None, "file_hash": id, "page_no": None,
                         "detected_style_id": None, "created_at": ago})

BOX = {"sofa": [0.6, 0.6, 0.38, 0.36], "chair": [0.2, 0.58, 0.2, 0.36], "pendant": [0.42, 0.0, 0.18, 0.22], "lamp": [0.4, 0.28, 0.1, 0.5],
       "shelf": [0.02, 0.08, 0.2, 0.62], "vases": [0.52, 0.7, 0.08, 0.26], "console": [0.3, 0.45, 0.4, 0.3], "big": [0.15, 0.2, 0.7, 0.7]}
P = 0


def piece(id, item, box, cat, col, sty, mat, conf, status, scheme=None, reason=None, tags=(), ago="@now-2h"):
    global P
    P += 1
    x, y, w, h = BOX[box]
    add("detected_pieces", {"id": id, "item_id": item, "box": {"x": x, "y": y, "w": w, "h": h}, "category_id": cat, "color_id": col, "style_id": sty, "material_id": mat,
                            "tag_ids": list(tags), "confidence": conf, "status": status, "scheme_id": scheme, "review_reason": reason, "raw": {}, "crop_path": None,
                            "reviewed_at": None, "reviewed_by": None, "created_at": ago})


# running batch: image 1 read (6 pieces), image 2 reading
for i, (b, c, co, s, m, conf, st, sc, rs) in enumerate([
    ("lamp", "t-lamp", "c-brass", "s-mid", "m-metal", 0.90, "saved", "sc-lamp", None), ("shelf", "t-shelving", "c-walnut", "s-eclectic", "m-walnut", 0.89, "saved", "sc-shelf", None),
    ("vases", "t-vases", "c-burgundy", None, "m-ceramic", 0.62, "saved", "sc-vases", None), ("sofa", "t-sofa", "c-plum", "s-eclectic", "m-velvet", 0.93, "saved", "sc-sofa", None),
    ("chair", "t-chair", "c-emerald", "s-mid", "m-leather", 0.91, "saved", "sc-chair", None), ("pendant", "t-pendant", "c-brass", "s-deco", "m-smoked", 0.88, "waiting", None, "new_word"),
]):
    piece(f"p-run-{i}", "i-r1", b, c, co, s, m, conf, st, sc, rs, ago=f"@now-{14 - i}m")
# finished batch, image 1: the board's six pieces
piece("p-d1-1", "i-d1", "sofa", "t-sofa", "c-plum", "s-eclectic", "m-velvet", 0.93, "saved", "sc-sofa", tags=["g-lowback"])
piece("p-d1-2", "i-d1", "chair", "t-chair", "c-emerald", "s-mid", "m-leather", 0.91, "saved", "sc-chair", tags=["g-cane"])
piece("p-demo-1", "i-d1", "pendant", "t-pendant", "c-brass", "s-deco", "m-smoked", 0.88, "waiting", None, "new_word")
piece("p-d1-4", "i-d1", "lamp", "t-lamp", "c-brass", "s-mid", "m-metal", 0.90, "saved", "sc-lamp", tags=["g-cone"])
piece("p-d1-5", "i-d1", "shelf", "t-shelving", "c-walnut", "s-eclectic", "m-walnut", 0.89, "saved", "sc-shelf", tags=["g-brassframe"])
piece("p-d1-6", "i-d1", "vases", "t-vases", "c-burgundy", None, "m-ceramic", 0.62, "waiting", None, "low_confidence")
for i, (b, c, sc) in enumerate([("console", "t-console", "sc-console"), ("shelf", "t-shelving", "sc-shelf"), ("lamp", "t-lamp", "sc-lamp"), ("sofa", "t-sofa", "sc-sofa")]):
    piece(f"p-d2-{i}", "i-d2", b, c, "c-walnut" if c != "t-sofa" else "c-plum", "s-eclectic", "m-walnut", 0.9, "saved", sc)
piece("p-d3-0", "i-d3", "big", "t-sofa", "c-plum", "s-eclectic", "m-velvet", 0.92, "saved", "sc-sofa")
piece("p-d3-1", "i-d3", "chair", "t-sidetable", "c-walnut", "s-eclectic", "m-walnut", 0.74, "waiting", None, "low_confidence")
# the rest of the review queue
piece("p-c-wall", "i-c1", "lamp", "t-walllight", "c-brass", "s-deco", "m-smoked", 0.86, "waiting", None, "new_word", ago="@now-7h")
piece("p-c-wing", "i-c1", "big", "t-wingback", "c-sage", "s-trad", "m-linen", 0.90, "waiting", None, "new_word", tags=["g-crewel"], ago="@now-7h")
piece("p-c-side", "i-c2", "console", "t-sideboard", "c-walnut", "s-eclectic", "m-walnut", 0.87, "waiting", None, "possible_duplicate", ago="@now-7h")
piece("p-c-sb", "i-c2", "big", "t-sideboard", "c-walnut", "s-eclectic", "m-walnut", 0.95, "saved", "sc-sideboard", tags=["g-moss"], ago="@now-7h")
piece("p-b-cab", "i-b1", "console", "t-cabinet", "c-green", "s-deco", "m-malachite", 0.84, "waiting", None, "new_word", ago="@now-1d")
piece("p-b-lamp", "i-b1", "lamp", "t-lamp", "c-natural", "s-japandi", "m-rattan", 0.71, "waiting", None, "low_confidence", ago="@now-1d")
piece("p-s-shelf", "i-s1", "shelf", "t-shelving", "c-emerald", "s-eclectic", "m-painted", 0.92, "waiting", None, "reported", ago="@now-2d")
# AI-saved this week, for the spot-check
piece("p-sc-wing", "i-c1", "chair", "t-wingback", "c-sage", "s-trad", "m-linen", 0.94, "saved", "sc-wingback", tags=["g-embroidered", "g-turned"], ago="@now-3d")
piece("p-sc-cab", "i-b1", "big", "t-cabinet", "c-walnut", "s-trad", "m-walnut", 0.96, "saved", "sc-cabinet", ago="@now-1d")
add("detection_corrections", {"id": "dc-1", "piece_id": "p-sc-cab", "facet": "color", "ai_value": "c-brass", "fixed_value": "c-walnut", "fixed_by": ADMIN, "created_at": "@now-1d"})

# ------------------------------------------------------------------ styles, palettes, rules
add("style_definitions",
    {"style_id": "s-eclectic", "style_facet": "style", "description": "Rich, saturated colour with warm wood and brass. Curved shapes, mixed patterns and collected objects — modern lines, nothing too matched.",
     "prompt_fragment": "saturated jewel tones, curved silhouettes, warm walnut and brass", "mood_keywords": ["rich", "collected"], "default_palette_id": "pal-1"},
    {"style_id": "s-scandi", "style_facet": "style", "description": "Light woods, soft neutrals and simple shapes.", "prompt_fragment": None, "mood_keywords": [], "default_palette_id": "pal-2"})
for id, name, sty, cols in [("pal-1", "Plum & moss", "s-eclectic", ["c-plum", "c-emerald", "c-walnut", "c-brass"]),
                            ("pal-2", "Nordic calm", "s-scandi", ["c-oat", "c-oak", "c-sage", "c-charcoal"]),
                            ("pal-3", "Deco night", "s-deco", ["c-ink", "c-malachite", "c-ivory", "c-brass"])]:
    add("palettes", {"id": id, "name": name, "style_id": sty, "source": "admin", "created_at": "@now-20d"})
    for i, c in enumerate(cols):
        add("palette_colors", {"palette_id": id, "position": i + 1, "color_id": c, "color_facet": "color", "role": ["main", "neutral", "wood", "accent"][i]})


def pair(a, b):
    return (a, b) if a < b else (b, a)


for i, (a, b, v, s, src, reason) in enumerate([
    ("m-velvet", "m-brass", "works", 5, "learned", None), ("c-plum", "c-emerald", "works", 3, "learned", None),
    ("m-rattan", "s-scandi", "only", 3, "expert", "Rarely kept outside these styles"), ("m-rattan", "s-japandi", "only", 3, "expert", "Rarely kept outside these styles"),
    ("m-smoked", "c-walnut", "avoid", 1, "expert", None),
]):
    lo, hi = pair(a, b)
    add("compatibility_rules", {"id": f"cr-{i}", "term_a_id": lo, "term_b_id": hi, "verdict": v, "strength": s, "reason": reason, "source": src, "created_at": f"@now-{20 - i}d"})
for a, b, pos, neg, comb in [("m-velvet", "m-brass", 24, 0, 30), ("c-plum", "c-emerald", 18, 2, 22), ("m-boucle", "m-oak", 11, 0, 11)]:
    lo, hi = pair(a, b)
    add("mv_term_pair_scores", {"term_a": lo, "term_b": hi, "positive": pos, "negative": neg, "combinations": comb, "score": round(pos / max(1, pos + neg), 2)})

# ------------------------------------------------------------------ sizes & scope
SPECS = [("Curved sofa", "t-sofa", [("2-seat", 180, 95, 80, 60, False), ("3-seat", 240, 105, 80, 70, True), ("Corner curve", 300, 180, 80, 70, False)]),
         ("Armchair", "t-armchair", [("Compact", 70, 75, 80, 50, False), ("Standard", 80, 85, 85, 60, True), ("Wide", 95, 90, 85, 60, False)]),
         ("Bed", "t-bed", [("Single", 90, 200, 45, 60, False), ("Small double", 120, 200, 45, 60, False), ("Double", 140, 200, 45, 70, True), ("King", 160, 200, 45, 70, False), ("Super king", 180, 200, 45, 70, False)]),
         ("Coffee table", "t-coffee", [("Small", 80, 50, 40, 40, False), ("Medium", 110, 60, 40, 45, True), ("Large", 130, 70, 40, 45, False), ("Round", 90, 90, 40, 45, False)]),
         ("Console", "t-console", [("Narrow", 120, 35, 80, 60, True), ("Wide", 160, 40, 80, 60, False)]),
         ("Dining table", "t-dining", [("2 seats", 80, 80, 75, 90, False), ("4 seats", 140, 85, 75, 90, True), ("6 seats", 180, 90, 75, 90, False), ("8 seats", 220, 95, 75, 90, False), ("Round 4", 110, 110, 75, 90, False), ("Round 6", 140, 140, 75, 90, False)]),
         ("Floor lamp", "t-lamp", [("Straight", 30, 30, 160, 20, True), ("Arc", 40, 40, 190, 30, False)]),
         ("Lounge chair", "t-chair", [("Standard", 80, 85, 75, 60, True)]),
         ("Open shelving", "t-shelving", [("Narrow", 80, 35, 200, 60, False), ("Wide", 160, 35, 200, 60, True)]),
         ("Sideboard", "t-sideboard", [("Standard", 180, 45, 80, 70, True)]),
         ("Cabinet", "t-cabinet", [("Standard", 90, 40, 120, 70, True)]),
         ("Sofa", "t-sofa2", [("2-seat", 170, 90, 80, 60, False), ("3-seat", 220, 95, 80, 70, True), ("Corner", 260, 200, 80, 70, False), ("Chaise", 240, 160, 80, 70, False)])]
k = 0
for name, tid, rows in SPECS:
    for variant, w, d, h, c, default in rows:
        k += 1
        add("furniture_specs", {"id": f"fs-{k}", "name": name, "category": name, "category_term_id": tid, "variant": variant, "width_cm": w, "depth_cm": d, "height_cm": h,
                                "min_clearance_cm": c, "is_default": default, "must_against_wall": False, "default_orientation": "any", "extra_dims": {}, "grouping_key": None,
                                "companion_of": None, "source": "reference", "created_at": "@now-60d", "updated_at": "@now-60d"})
AREAS = ["furniture", "walls_finishes", "floors", "lighting", "built_ins", "electrical", "water_plumbing", "ac_ventilation", "heating", "data_tv_sound"]
for st in ["core_shell", "empty", "partially_furnished", "redo_all"]:
    for a in AREAS:
        mode = "in_scope" if st in ("core_shell", "redo_all") or a in ("furniture", "walls_finishes", "lighting") else ("kept_as_is" if st == "empty" else "on_request")
        if st == "redo_all" and a in ("water_plumbing", "ac_ventilation"):
            mode = "on_request"
        add("scope_defaults", {"room_type": "any", "starting_state": st, "area": a, "mode": mode, "hint": None})

# ------------------------------------------------------------------ shops & products
add("shops",
    {"id": "sh-p1", "name": "Atelier Nord", "domain": "ateliernord.example", "url": "https://ateliernord.example", "kind": "partner", "status": "approved", "product_count": 1240,
     "last_scraped_at": "@now-3h", "terms_checked": True, "owner_user_id": None, "added_by": ADMIN, "reviewed_at": None, "reviewed_by": None, "created_at": "@now-90d", "updated_at": "@now-3h"},
    {"id": "sh-p2", "name": "Maison Verre", "domain": "maisonverre.example", "url": "https://maisonverre.example", "kind": "partner", "status": "approved", "product_count": 860,
     "last_scraped_at": "@now-2d", "terms_checked": True, "owner_user_id": None, "added_by": ADMIN, "reviewed_at": None, "reviewed_by": None, "created_at": "@now-80d", "updated_at": "@now-2d"},
    {"id": "sh1", "name": "studio-oak.example", "domain": "studio-oak.example", "url": "https://studio-oak.example", "kind": "user_added", "status": "pending", "product_count": 46,
     "last_scraped_at": None, "terms_checked": False, "owner_user_id": MAYA, "added_by": MAYA, "reviewed_at": None, "reviewed_by": None, "created_at": "@now-1d", "updated_at": "@now-1d"},
    {"id": "sh2", "name": "vintage-finds.example", "domain": "vintage-finds.example", "url": "https://vintage-finds.example", "kind": "user_added", "status": "pending", "product_count": 0,
     "last_scraped_at": None, "terms_checked": False, "owner_user_id": MAYA, "added_by": MAYA, "reviewed_at": None, "reviewed_by": None, "created_at": "@now-1d", "updated_at": "@now-1d"},
)
for id, pid in [("pr-x1", "sh1"), ("pr-x2", "sh1")]:
    add("project_shops", {"project_id": id, "shop_id": pid, "added_at": "@now-1d"})
for i, (name, sku, img, scheme, dims, price) in enumerate([
    ("Moss panel sideboard", "AN-2231", "journey-sample/sofa-wall.jpg", "sc-sideboard", {"width_cm": 180, "depth_cm": 45, "height_cm": 80}, 1890),
    ("Embroidered wingback", "AN-1187", "journey-sample/insp-3.jpg", "sc-wingback", None, 1340),
    ("Inlaid cabinet", "AN-0954", "journey-sample/luxe-2.jpg", None, {"width_cm": 90, "depth_cm": 40, "height_cm": 120}, 2150),
    ("Arc rattan floor lamp", "AN-0412", "journey-sample/insp-2.jpg", "sc-lamp", {"width_cm": 40, "depth_cm": 40, "height_cm": 160}, 420),
]):
    add("shop_products", {"id": f"spr-{i}", "shop_id": "sh-p1", "name": name, "type": None, "price": price, "currency": "EUR", "image_urls": [f"/{img}"], "scheme_id": scheme,
                          "metadata": {"sku": sku, **({"dimensions": dims} if dims else {})}, "is_active": True, "source_url": None, "shop_ref": None, "style": None,
                          "description": None, "ai_image_description": None, "ai_style_tags": None, "created_at": f"@now-{i + 1}d", "updated_at": "@now-1d"})
    if scheme:
        add("product_scheme_links", {"product_id": f"spr-{i}", "scheme_id": scheme, "confidence": 0.9, "confirmed": True, "source": "ai", "created_at": "@now-1d"})

# ------------------------------------------------------------------ users
for uid, name, email, upd in [(MAYA, "Maya K.", "maya@example.test", "@now-1h"), (JONAS, "Jonas M.", "jonas@example.com", "@now-1d"), (LENA, "Lena S.", "lena@example.com", "@now-3d"),
                              (ADMIN, "Admin", "admin@example.test", "@now"), (TOM, "Tom B.", "tom@example.com", "@now-7d")]:
    add("profiles", {"id": f"pf-{uid[-4:]}", "user_id": uid, "display_name": name, "email": email, "avatar_url": None, "city": None, "country": None, "created_at": "@now-60d", "updated_at": upd})
for uid, role in [(MAYA, "user"), (JONAS, "designer"), (LENA, "furniture_shop"), (ADMIN, "admin"), (TOM, "user")]:
    add("user_roles", {"id": f"ur-{uid[-4:]}", "user_id": uid, "role": role, "created_at": "@now-60d"})
for i, (email, role, ago) in enumerate([("studio@example.com", "designer", "@now-2d"), ("shop@example.com", "furniture_shop", "@now-5d")]):
    add("role_invites", {"id": f"ri-{i}", "email": email, "role": role, "status": "pending", "token": f"tok-{i}", "created_by": ADMIN, "used_by": None, "created_at": ago, "expires_at": "@now-0d"})
add("projects", {"id": "pr-tom1", "owner_id": TOM, "name": "Studio flat", "intent": "new_space", "archived_at": None, "created_at": "@now-20d", "updated_at": "@now-7d", "currency": "EUR"},
    {"id": "pr-tom2", "owner_id": TOM, "name": "Parents' house", "intent": "new_space", "archived_at": None, "created_at": "@now-15d", "updated_at": "@now-8d", "currency": "EUR"})
for i in range(6):
    add("project_collaborators", {"id": f"pc-{i}", "project_id": f"pr-x{i}", "user_id": JONAS, "email": "jonas@example.com", "role": "designer", "invite_status": "accepted",
                                  "invite_token": None, "invited_at": "@now-10d", "accepted_at": "@now-9d"})
add("project_collaborators", {"id": "pc-demo", "project_id": "pr-demo", "user_id": None, "email": "studio@example.com", "role": "designer", "invite_status": "pending",
                              "invite_token": None, "invited_at": "@now-2d", "accepted_at": None})

# ------------------------------------------------------------------ the demo project (G1)
ROOMS = [("r-living", "Living room", "living_room", 10, "partially_furnished"), ("r-bed", "Bedroom", "bedroom", 2, "empty"), ("r-kitchen", "Kitchen", "kitchen", 1, "core_shell"),
         ("r-bath", "Bathroom", "bathroom", 1, "core_shell")]
for i, (id, name, rt, step, st) in enumerate(ROOMS):
    add("rooms", {"id": id, "project_id": "pr-demo", "user_id": MAYA, "name": name, "room_type": rt, "sequence_no": i + 1, "current_step": step, "starting_state": st,
                  "style": {"name": "Eclectic modern", "palette": "Plum & moss"} if i == 0 else {}, "layout": {"label": "Option B · sofa facing the window wall"} if i == 0 else None,
                  "walls": [], "furniture": [], "dimensions": {}, "shape": "rectangle", "schema_version": 2, "created_at": "@now-12d", "updated_at": "@now-1d"})
for i in range(2):
    add("rooms", {"id": f"r-tom{i}", "project_id": "pr-tom1", "user_id": TOM, "name": "Room", "room_type": "living_room", "sequence_no": i + 1, "current_step": 3, "starting_state": "empty",
                  "style": {}, "layout": None, "walls": [], "furniture": [], "dimensions": {}, "shape": "rectangle", "schema_version": 2, "created_at": "@now-12d", "updated_at": "@now-7d"})
add("rooms", {"id": "r-tom2", "project_id": "pr-tom2", "user_id": TOM, "name": "Room", "room_type": "bedroom", "sequence_no": 1, "current_step": 2, "starting_state": "empty",
              "style": {}, "layout": None, "walls": [], "furniture": [], "dimensions": {}, "shape": "rectangle", "schema_version": 2, "created_at": "@now-12d", "updated_at": "@now-8d"})
add("step_progress",
    {"id": "sp-1", "project_id": "pr-demo", "room_id": None, "step_no": 1, "status": "completed", "started_at": "@now-12d", "completed_at": "@now-12d", "sub_step": None, "summary": {}, "updated_at": "@now-12d"},
    {"id": "sp-2", "project_id": "pr-demo", "room_id": "r-living", "step_no": 10, "status": "completed", "started_at": "@now-3d", "completed_at": "@now-2d", "sub_step": None, "summary": {}, "updated_at": "@now-2d"},
    {"id": "sp-3", "project_id": "pr-demo", "room_id": "r-bed", "step_no": 2, "status": "in_progress", "started_at": "@now-1d", "completed_at": None, "sub_step": None, "summary": {}, "updated_at": "@now-1d"})
add("products", {"id": "prod-sofa", "name": "Curved sofa · plum", "image_url": "/journey-sample/sw-plum.jpg", "shop_name": "Atelier Nord", "shop_id": "sh-p1", "price": 2400, "currency": "EUR",
                 "is_active": True, "metadata": {}, "created_at": "@now-5d", "updated_at": "@now-5d"})
for i, it in enumerate([
    {"label": "Curved sofa · plum", "item_type": "furniture", "source": "proposed", "action": "buy", "product_id": "prod-sofa", "chosen_product_id": "prod-sofa", "quantity_note": "3-seat · size edited by user", "furniture_spec_id": "fs-2"},
    {"label": "Lounge chair · emerald", "item_type": "furniture", "source": "proposed", "action": "buy", "shop_product_id": "spr-1", "sourcing": "own_shop"},
    {"label": "Floor lamp", "item_type": "furniture", "source": "proposed", "action": "custom"},
    {"label": "Piano", "item_type": "kept", "source": "existing_kept", "action": "keep"},
    {"label": "Rug", "item_type": "kept", "source": "existing_kept", "action": "keep"},
]):
    base = {"id": f"ri-{i}", "room_id": "r-living", "sort_order": i, "quantity": 1, "currency": "EUR", "decision": "keep", "position_fixed": False, "created_at": "@now-2d", "updated_at": "@now-2d"}
    for col in ["chosen_product_id", "product_id", "shop_product_id", "furniture_spec_id", "sourcing", "quantity_note", "supplier", "scheme_id"]:
        base[col] = None
    add("room_items", {**base, **it})
add("room_scope", {"room_id": "r-living", "area": "electrical", "mode": "in_scope", "allow_changes": True, "note": None})
add("generated_designs", {"id": "gd-1", "room_id": "r-living", "user_id": MAYA, "image_url": "/journey-sample/room-hero.jpg", "is_kept": True, "prompt": "", "created_at": "@now-3d", "version_no": 3})
add("design_scheme_links", {"id": "dsl-1", "design_id": "gd-1", "combination_id": "co-2", "scheme_id": None, "design_item_id": None, "direction": "used", "confidence": 0.8, "created_at": "@now-3d"})
add("admin_audit_log",
    {"id": 1, "table_name": "taxonomy_terms", "action": "UPDATE", "row_id": "t-glass", "actor_id": ADMIN, "before": None, "after": {"label": "Tinted glass"}, "created_at": "@now-1h"},
    {"id": 2, "table_name": "scheme_combinations", "action": "UPDATE", "row_id": "co-1", "actor_id": ADMIN, "before": None, "after": {"name": "Sofa + walnut table"}, "created_at": "@now-5h"},
    {"id": 3, "table_name": "furniture_specs", "action": "INSERT", "row_id": "fs-3", "actor_id": ADMIN, "before": None, "after": {"name": "Curved sofa", "variant": "Corner curve"}, "created_at": "@now-1d"})
for i, (uid, ago) in enumerate([(MAYA, "@now-1h"), (JONAS, "@now-1d"), (LENA, "@now-3d"), (ADMIN, "@now"), (TOM, "@now-7d")]):
    add("analytics_events", {"id": f"ae-{i}", "user_id": uid, "event_type": "sign_in", "screen": "auth", "metadata": None, "created_at": ago})

# ------------------------------------------------------------------ settings
add("cms_content", {"id": "cms-scan", "key": "scan_settings", "content_type": "json", "value": json.dumps({"auto_save_threshold": 0.85, "max_pages_per_pdf": 20, "spot_check_sample": 10, "undo_days": 14}),
                    "metadata": None, "created_at": "@now-30d", "updated_at": "@now-3d", "updated_by": ADMIN})
add("settings_versions",
    {"id": 2, "key": "scan_settings", "content_type": "json", "value": json.dumps({"auto_save_threshold": 0.8, "max_pages_per_pdf": 20, "spot_check_sample": 10, "undo_days": 14}), "saved_by": ADMIN, "saved_at": "@now-3d"},
    {"id": 1, "key": "scan_settings", "content_type": "json", "value": json.dumps({"auto_save_threshold": 0.8, "max_pages_per_pdf": 20, "spot_check_sample": 5, "undo_days": 14}), "saved_by": JONAS, "saved_at": "@now-14d"})

with open(os.path.join(HERE, "tables.admin.json"), "w") as f:
    json.dump(T, f, indent=1, ensure_ascii=False)
with open(os.path.join(HERE, "storage.json"), "w") as f:
    json.dump(STORAGE, f, indent=1)
print("tables:", len(T), "rows:", sum(len(v) for v in T.values()))
