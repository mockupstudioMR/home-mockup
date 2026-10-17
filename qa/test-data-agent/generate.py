#!/usr/bin/env python3
"""
Test-data agent for home-mockup: makes randomized test cases, one folder per test user.

Each case folder has
  README.md          the user's story and every answer to give, step by step, room by room
  answers.json       the same answers with the app's own field names (JourneyState in src/journey/state.tsx)
  floorplan/         plan image + SOURCE.md (link, author, licence, Swiss or not, real room sizes when known)
  inspiration/       uploaded inspiration photos + SOURCES.md (only for users who choose "Upload")

Run (on a computer with internet):
  python3 qa/test-data-agent/generate.py --out ~/HomeMockUp-TestData --n 10
  options: --seed 123  --swiss 0.35  --offline  --no-hannah  --repo <path to home-mockup>
"""
import argparse
import csv
import datetime as dt
import json
import os
import random
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import options as O  # noqa: E402
import personas as P  # noqa: E402
import sources as S  # noqa: E402

SCOPE_ON = {  # mirrors STATES[].scope[].on in src/journey/data.ts
    "core-shell": ["Furniture", "Walls", "Floors", "Lighting", "Electrical features", "Water & plumbing", "AC & ventilation", "Heating", "Data, TV & sound", "Built-ins & niches"],
    "empty": ["Furniture", "Walls", "Lighting"],
    "partial": ["Furniture", "Walls", "Lighting"],
    "redoing": ["Furniture", "Walls", "Floors", "Lighting", "Electrical features", "Water & plumbing", "AC & ventilation", "Heating", "Data, TV & sound", "Built-ins & niches"],
}
IN_WALLS = ["Electrical features", "Water & plumbing", "AC & ventilation", "Heating", "Data, TV & sound"]
SCOPE_ORDER = ["Furniture", "Walls", "Floors", "Lighting", "Electrical features", "Water & plumbing", "AC & ventilation", "Heating", "Data, TV & sound", "Built-ins & niches"]


def slug(s):
    import unicodedata
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


# ------------------------------------------------------------------------------------------------ the person
def make_person(rnd, swiss, forced=None):
    place = rnd.choice(P.SWISS_PLACES if swiss else P.PLACES)
    city, country, climate, ceil, lang = place
    name = rnd.choice(P.NAMES[country])
    household, people, kids = rnd.choice(P.HOUSEHOLDS)
    person = {"name": name, "initial": rnd.choice(P.SURNAME_INITIAL), "city": city, "country": country, "climate": climate,
              "ceiling_range": ceil, "language": lang if rnd.random() < 0.6 else "en", "household": household, "people": people,
              "kids": kids, "job": rnd.choice(P.JOBS), "pet": rnd.choice(P.PETS)}
    person["style"] = rnd.choice(list(O.STYLE_KEYWORDS))
    if forced:
        person.update(forced)
    return person


def pick_project(rnd, person, plan_rooms, whole_home=False):
    intent = person.get("intent") or rnd.choices(list(O.INTENTS), weights=[5, 4, 1])[0]
    prop = person.get("property") or ("apartment" if plan_rooms else rnd.choices(list(O.PROPERTIES), weights=[6, 3, 1, 1])[0])
    if prop == "studio":
        available = ["living-room", "kitchen", "bathroom", "hallway"]
    else:
        available = [r for r in O.ROOMS if r != "kids-room" or person["kids"]]
    if plan_rooms:  # the floor plan decides which rooms exist
        mapped = {re.sub(r"-\d+$", "", k) for k in plan_rooms}
        available = [r for r in available if r in mapped] or available
    if whole_home:
        rooms = [r for r in available if r in ("living-room", "bedroom", "kitchen", "dining-room", "bathroom", "hallway", "office", "kids-room")]
    else:
        rooms = rnd.sample(available, k=rnd.randint(1, min(5, len(available))))
    rooms.sort(key=list(O.ROOMS).index)
    start = rnd.choice(rooms) if not whole_home else rooms[0]
    tested = [start] + [r for r in rooms if r != start]
    tested = tested if whole_home else tested[: rnd.randint(1, min(3, len(tested)))]
    state = rnd.choice(O.STATE_FOR_INTENT[intent])
    allow = state in ("partial", "empty") and rnd.random() < 0.3
    owner = state in ("core-shell", "redoing") or rnd.random() < (0.35 if person["country"] in ("Switzerland", "Germany", "Austria") else 0.75)
    brief = {
        "budget": rnd.choice(O.BUDGETS if intent != "exploring" else O.BUDGETS[:2]),
        "when": rnd.choice(O.TIMINGS if intent != "exploring" else ["Not decided yet", "6+ months"]),
        "city": person["city"],
        "restrictions": rnd.choice(["None — I own it", "Building rules apply"] if owner else ["Rented — limited changes", "Not sure"]),
    }
    scope = [t for t in SCOPE_ORDER if t in SCOPE_ON[state] or (allow and t in IN_WALLS)]
    return {"intent": intent, "propertyType": prop, "rooms": rooms, "startRoom": start, "tested": tested, "houseState": state,
            "allowInWalls": allow, "brief": brief, "scope": scope}


# ------------------------------------------------------------------------------------------------ one room
def make_room(rnd, person, project, room, plan, used, folder, offline, n_room):
    style = person["style"] if rnd.random() < 0.8 else rnd.choice(list(O.STYLE_KEYWORDS))
    mode = rnd.choices(["upload", "describe", "discover"], weights=[6, 3, 2])[0]
    r = {"room": room, "style": style, "visionMode": mode, "photos": [], "quickNotes": [], "note": None, "discoverPicks": []}
    # step 2 — inspiration
    if mode == "upload":
        want = rnd.randint(3, 7)
        hits = [] if offline else S.find_images(
            [f"{O.STYLE_KEYWORDS[style]} {O.ROOM_SEARCH[room]}", f"{style} {O.ROOM_SEARCH[room]}", O.STYLE_KEYWORDS[style]], want, rnd, used)
        sub = os.path.join(folder, "inspiration", f"{n_room}-{room}")
        os.makedirs(sub, exist_ok=True)
        r["photos"] = S.save_inspiration(hits, sub) if hits else []
        r["photoFolder"] = os.path.relpath(sub, folder)
        if rnd.random() < 0.5:
            r["note"] = rnd.choice(["Love the light in these.", "Not too cluttered please.", "The colours are what I like most.",
                                    "I like the sofa in photo 2.", "Warmer than this, but the same feel."])
    elif mode == "describe":
        r["note"] = P.DESCRIBE_NOTES[style]
    else:
        r["discoverPicks"] = rnd.sample(O.DISCOVER_STYLES, k=rnd.randint(1, 2))
    notes = []
    if person["pet"]:
        notes.append("Pet friendly")
    if person["kids"]:
        notes.append("Kid friendly")
    notes += [q for q in ("Keep it cosy", "Not too dark") if rnd.random() < 0.35]
    r["quickNotes"] = notes
    # step 3 — daily life
    pool = [x for x in O.ACTIVITIES[room] if person["kids"] or x != "Kids play"]
    acts = rnd.sample(pool, k=rnd.randint(1, min(4, len(pool))))
    if person["kids"] and "Kids play" in O.ACTIVITIES[room] and "Kids play" not in acts:
        acts.append("Kids play")
    r["activities"] = acts
    base = O.BASE_PRIORITIES if room in ("living-room", "dining-room", "kitchen") else ["Lots of storage", "Calm, clutter-free", "Easy to keep clean"]
    prios = O.activity_priorities(acts) + rnd.sample(base, k=rnd.randint(1, 2))
    if person["pet"] or person["kids"]:
        prios.append("Easy to keep clean")
    r["priorities"] = list(dict.fromkeys(prios))[:4]
    keep = []
    if project["houseState"] in ("partial", "redoing") or project["intent"] == "redesign":
        pool = {"living-room": ["Sofa", "Rug", "Bookshelf", "TV", "Artwork", "Upright piano"], "bedroom": ["Bed", "Wardrobe", "Rug", "Artwork"],
                "dining-room": ["Dining table", "Sideboard", "Artwork"], "office": ["Desk", "Bookshelf"], "kids-room": ["Bed", "Bookshelf", "Rug"],
                "hallway": ["Sideboard", "Artwork"], "kitchen": ["Dining table"], "bathroom": []}[room]
        for item in rnd.sample(pool, k=min(len(pool), rnd.randint(0, 2))):
            w, d, h = O.KEEP_SIZES[item]
            keep.append({"name": item, "measured": rnd.random() < 0.6, "w": w, "d": d, "h": h, "wall": rnd.choice(O.WALLS), "fixedSpot": rnd.random() < 0.3})
    r["keeping"], r["nothingKept"] = keep, not keep
    hot = person["climate"] == "hot"
    fixed = {"windows": rnd.randint(1, 3), "doors": rnd.randint(1, 2)}
    if hot:
        fixed["ac"] = rnd.randint(0, 1) if project["houseState"] != "core-shell" else 1
    else:
        fixed["radiators"] = rnd.randint(0, 2)
    if rnd.random() < 0.3:
        fixed["columns"] = 1
    if room in ("kitchen", "bathroom"):
        fixed["water"] = rnd.randint(1, 3)
        if rnd.random() < 0.4:
            fixed["stacks"] = 1
    if room == "hallway" and rnd.random() < 0.6:
        fixed["panels"] = 1
    if rnd.random() < 0.4:
        fixed["builtins"] = 1
    r["fixedCounts"] = {k: v for k, v in fixed.items() if v}
    # step 4 — layout
    lo, hi = person["ceiling_range"]
    r["ceilingM"] = round(rnd.uniform(lo, hi), 2)
    known = (plan or {}).get("rooms") or {}
    size = known.get(room)
    if plan and plan["kind"] == "synthetic" and n_room == 1:
        size = {"width_m": plan["answer"].get("width_m"), "length_m": plan["answer"].get("length_m")}
    plan_usable = plan and not (plan["kind"] == "synthetic" and n_room > 1)
    if plan_usable and rnd.random() < 0.8:
        r["input"] = "plan"
        r["scaleRef"] = rnd.choice(O.SCALE_REFS)
    else:
        r["input"] = rnd.choice(["photos", "draw"])
        r["scaleRef"] = "Typed width and length"
    if size and size.get("width_m"):
        r["widthM"], r["lengthM"], r["sizeKnown"] = size["width_m"], size["length_m"], True
    else:
        w = round(rnd.uniform(2.6, 4.5) if room in ("bathroom", "hallway", "office", "kids-room") else rnd.uniform(3.2, 6.5), 2)
        r["widthM"], r["lengthM"], r["sizeKnown"] = w, round(w * rnd.uniform(1.0, 1.6), 2), False
    if r["input"] == "photos":
        r["wallPhotosNote"] = "Take 4 photos, one per wall A–D (any room photos work — or reuse inspiration photos to test the error path)."
    # step 5 — main furniture
    kind = O.ANCHOR_BY_ROOM[room]
    r["anchor"] = {"kind": kind, "shape": rnd.choice(O.SHAPES[kind]), "material": rnd.choice(O.MATERIALS[kind])}
    # steps 6–9
    r["colours"] = rnd.choice(["Accept the moodboard palette", "Swap the accent colour", "Make it warmer", "Make the walls lighter"])
    r["lighting"] = {"dimmer": rnd.random() < 0.6, "blind": rnd.random() < 0.4, "decision": rnd.choice(["Keep all three layers", "Change the accent light"])}
    r["details"] = rnd.choice(["Keep every wall as suggested", "Change one wall (cycle an item to Use mine)", "Mark one item TBC"])
    return r


# ------------------------------------------------------------------------------------------------ texts
def story(person, project, rooms):
    p = person
    pet = f" and {p['pet']}" if p["pet"] else ""
    trigger = random.Random(p["name"] + p["city"]).choice(P.TRIGGERS[project["intent"]])
    room_names = ", ".join(O.ROOMS[r].lower() for r in project["rooms"])
    tested = ", ".join(O.ROOMS[r["room"]].lower() for r in rooms)
    styles = "; ".join(f"for the {O.ROOMS[r['room']].lower()} {pre(r)}" for r in rooms)
    s = (f"{p['name']} {p['initial']}. is based in {p['city']}, {p['country']} and {p['household']}{pet}. "
         f"{p['name']} {p['job']} and {trigger}. "
         f"State of the {O.PROPERTIES[project['propertyType']].lower()}: {O.HOUSE_STATES[project['houseState']].lower()}"
         f"{', and they are fine with changes inside the walls' if project['allowInWalls'] else ''}. "
         f"They want to do the {room_names}; in this test {p['name']} designs the {tested}. "
         f"Budget: {project['brief']['budget'].lower()}, timing: {project['brief']['when'].lower()}. ")
    s += f"Style: {styles}."
    return s


def pre(r):
    t = P.STYLE_STORIES[r["style"]]
    return {"upload": f"{t} and uploads {len(r['photos']) or 'a few'} photos", "describe": f"{t} and describes it in words",
            "discover": f"{t} but starts from Discover ({', '.join(r['discoverPicks'])})"}[r["visionMode"]]


def readme(case_id, person, project, plan, rooms):
    p = person
    flag = " 🇨🇭" if plan and plan["swiss"] else ""
    L = [f"# {case_id} · {p['name']} {p['initial']}. · {p['city']}, {p['country']}{flag}", ""]
    tags = [O.INTENTS[project["intent"]], O.PROPERTIES[project["propertyType"]], f"{len(rooms)} room(s) to test",
            "Swiss home" if plan and plan["swiss"] else None, f"app language: {'Arabic' if p['language'] == 'ar' else 'English'}"]
    L += ["`" + "` · `".join(t for t in tags if t) + "`", "", "## Story", "", story(person, project, rooms), ""]
    if plan:
        L += ["## Floor plan", "", f"![floor plan](floorplan/{plan['file']})", "",
              f"- Source: {plan['page']}" + (f" — apartment `{plan['apartment_id']}`" if plan.get("apartment_id") else ""),
              f"- Licence: {plan['licence']} · Author: {plan['author']}",
              f"- Swiss home: **{'yes — real Swiss apartment' if plan['swiss'] else 'no'}**", ""]
    else:
        L += ["## Floor plan", "", "No plan for this user — they measure or photograph the rooms instead.", ""]
    b = project["brief"]
    L += ["## Step 1 · Your project (once)", "", "| Question | Answer |", "|---|---|",
          f"| What are you doing? | **{O.INTENTS[project['intent']]}** |",
          f"| Type of home | **{O.PROPERTIES[project['propertyType']]}** |",
          f"| Rooms | **{', '.join(O.ROOMS[r] for r in project['rooms'])}** |",
          f"| Start with | **{O.ROOMS[project['startRoom']]}** |",
          f"| State of the home | **{O.HOUSE_STATES[project['houseState']]}** |",
          f"| Allow changes inside the walls | **{'Yes' if project['allowInWalls'] else 'No'}** |",
          f"| Budget | **{b['budget']}** |", f"| When | **{b['when']}** |", f"| City | **{b['city']}** |",
          f"| Restrictions | **{b['restrictions']}** |", "",
          f"Expected “In scope” on the brief: {', '.join(project['scope'])}", ""]
    for i, r in enumerate(rooms, 1):
        nm = O.ROOMS[r["room"]]
        L += [f"## Room {i} · {nm}" + (" (start room)" if i == 1 else " (via “Add another room”)"), ""]
        L += ["**Step 2 · Inspiration**", "", f"- Capture the vision: **{O.VISION_MODES[r['visionMode']]}** — style in mind: *{r['style']}*"]
        if r["visionMode"] == "upload":
            if r["photos"]:
                L.append(f"- Upload these {len(r['photos'])} photos from `{r['photoFolder']}/`: " + ", ".join(f"[{x['file']}]({r['photoFolder']}/{x['file']})" for x in r["photos"]))
            else:
                L.append(f"- Photos: none downloaded yet — run without --offline (folder `{r.get('photoFolder')}/`)")
        if r["discoverPicks"]:
            L.append(f"- Pick: **{', '.join(r['discoverPicks'])}**")
        if r["note"]:
            L.append(f"- Note: “{r['note']}”")
        L.append(f"- Quick notes: **{', '.join(r['quickNotes']) or '—'}**")
        L += ["", "**Step 3 · How you use the space**", "", f"- Activities: **{', '.join(r['activities'])}**",
              f"- Priorities: **{', '.join(r['priorities'])}**"]
        if r["keeping"]:
            for k in r["keeping"]:
                L.append(f"- Keeping: **{k['name']}** {k['w']}×{k['d']}×{k['h']} cm ({'measured' if k['measured'] else 'standard size'}), wall {k['wall']}"
                         + (", must stay in its spot" if k["fixedSpot"] else ""))
        else:
            L.append("- Keeping: **Nothing**")
        L.append("- Fixed features: " + ", ".join(f"{O.FIXED[k]} × {v}" for k, v in r["fixedCounts"].items()))
        L += ["", "**Step 4 · Your layout**", "", f"- How: **{O.ROOM_INPUTS[r['input']]}**" + (f" → `floorplan/{plan['file']}`" if r["input"] == "plan" and plan else "")]
        if r.get("wallPhotosNote"):
            L.append(f"- {r['wallPhotosNote']}")
        if r["input"] == "plan" and r["sizeKnown"]:
            size_note = " — real inside size from the plan: the reader should land within ~5 %; correct it to this if not"
        elif r["sizeKnown"]:
            size_note = " — type this in (it is the real size from the plan)"
        else:
            size_note = " — type this in"
        L += [f"- Size: **{r['widthM']} × {r['lengthM']} m**{size_note}",
              f"- Ceiling: **{r['ceilingM']} m** · Scale: {r['scaleRef']}", "",
              "**Step 5 · Main furniture**", "", f"- {r['anchor']['kind'].title()}: **{r['anchor']['shape']}**, {r['anchor']['material']}", "",
              "**Steps 6–9**", "", f"- Colours & materials: {r['colours']}",
              f"- Lighting: {r['lighting']['decision']}; dimmer **{'yes' if r['lighting']['dimmer'] else 'no'}**, blind **{'yes' if r['lighting']['blind'] else 'no'}**",
              f"- Finishing details: {r['details']}", "- Make it happen: check the buying list and invite one team member (use a test email)", ""]
    L += ["## What to check", "",
          "- [ ] Every answer above can be given; nothing forces a different choice",
          "- [ ] Project brief shows the budget, timing, city and the expected “In scope” tags",
          "- [ ] Style detector / moodboard reflects the inspiration (photos, note or picks)",
          "- [ ] Layout fits the room size and keeps the kept pieces on their walls",
          "- [ ] Fixed features appear on the right walls; nothing blocks doors or windows",
          "- [ ] Adding the next room starts fresh but keeps the project answers"]
    if p["language"] == "ar":
        L.append("- [ ] Arabic UI: right-to-left layout and translated labels on every screen")
    if plan and plan["swiss"]:
        L.append("- [ ] Plan reader picks the right room on a multi-room Swiss plan and the sizes match the table in `floorplan/SOURCE.md`")
    L += ["", "## Files", "", "- `answers.json` — these answers with the app's field names",
          "- `floorplan/SOURCE.md` — where the plan comes from", "- `inspiration/*/SOURCES.md` — where each photo comes from", ""]
    return "\n".join(L)


def answers_json(person, project, plan, rooms):
    first = rooms[0]
    def room_state(r):
        return {"visionMode": r["visionMode"], "photos": [f"{r.get('photoFolder')}/{x['file']}" for x in r["photos"]], "note": r["note"],
                "quickNotes": r["quickNotes"], "activities": r["activities"], "priorities": r["priorities"],
                "keeping": [{"name": k["name"], "measured": k["measured"], "w": k["w"], "d": k["d"], "h": k["h"], "wall": k["wall"], "fixedSpot": k["fixedSpot"]} for k in r["keeping"]],
                "nothingKept": r["nothingKept"], "fixedCounts": r["fixedCounts"],
                "room": {"input": r["input"], "planImage": f"floorplan/{plan['file']}" if plan and r["input"] == "plan" else None,
                         "widthM": r["widthM"], "lengthM": r["lengthM"], "ceilingM": r["ceilingM"], "scaleRef": r["scaleRef"]},
                "anchor": r["anchor"], "lighting": {"dimmer": r["lighting"]["dimmer"], "blind": r["lighting"]["blind"]},
                "_discoverPicks": r["discoverPicks"], "_style": r["style"]}
    return {"v": 1, "intent": project["intent"], "propertyType": project["propertyType"], "rooms": project["rooms"],
            "startRoom": project["startRoom"], "houseState": project["houseState"], "allowInWalls": project["allowInWalls"],
            "brief": project["brief"], **room_state(first), "current": first["room"],
            "_rooms": {r["room"]: room_state(r) for r in rooms},
            "_person": {k: person[k] for k in ("name", "city", "country", "language", "household", "pet")},
            "_plan": {k: plan.get(k) for k in ("page", "licence", "swiss", "kind", "apartment_id")} if plan else None}


# ------------------------------------------------------------------------------------------------ main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=os.path.expanduser("~/HomeMockUp-TestData"))
    ap.add_argument("--n", type=int, default=10, help="number of test users")
    ap.add_argument("--seed", type=int, default=None, help="same seed = same cases (omit for a new random batch)")
    ap.add_argument("--swiss", type=float, default=0.35, help="share of users living in a real Swiss apartment")
    ap.add_argument("--no-plan", type=float, default=0.15, help="share of users without a floor plan")
    ap.add_argument("--offline", action="store_true", help="no downloads: synthetic plans, empty inspiration folders")
    ap.add_argument("--no-hannah", action="store_true", help="skip the fixed first case (Hannah, Cairo, whole home)")
    ap.add_argument("--repo", default=os.path.abspath(os.path.join(HERE, "..", "..")))
    ap.add_argument("--cache", default=os.path.expanduser("~/.cache/home-mockup-testdata"))
    a = ap.parse_args()

    seed = a.seed if a.seed is not None else random.SystemRandom().randint(1, 10**6)
    rnd = random.Random(seed)
    for w in O.check_against_app(a.repo):
        print("WARNING:", w)

    batch = os.path.join(os.path.expanduser(a.out), f"batch-{dt.date.today():%Y-%m-%d}-seed{seed}")
    os.makedirs(batch, exist_ok=True)
    print(f"Writing {a.n} test users to {batch}")

    sd = None
    if not a.offline and a.swiss > 0:
        try:
            sd = S.SwissDwellings(a.cache)
            sd.ready()
        except Exception as e:
            print(f"  Swiss Dwellings not available ({e}) — Swiss users get a web or synthetic plan instead.")
            sd = None

    used, rows = set(), []
    for i in range(1, a.n + 1):
        hannah = i == 1 and not a.no_hannah
        swiss = (not hannah) and rnd.random() < a.swiss
        forced = {"name": "Hannah", "city": "Cairo", "country": "Egypt", "climate": "hot", "ceiling_range": (2.8, 3.2),
                  "intent": "new_space", "property": "apartment", "language": "en", "household": "lives with her husband",
                  "people": 2, "kids": False, "pet": "a cat", "job": "is a dentist"} if hannah else None
        person = make_person(rnd, swiss, forced)
        case_id = f"TC-{i:03d}"
        folder = os.path.join(batch, f"{case_id}-{slug(person['name'])}-{slug(person['city'])}")
        os.makedirs(os.path.join(folder, "floorplan"), exist_ok=True)

        plan = None
        if hannah or swiss or rnd.random() >= a.no_plan:
            pf = os.path.join(folder, "floorplan")
            try:
                if swiss and sd:
                    plan = S.swiss_plan(sd, pf, rnd, used, need_rooms=2)
                elif not a.offline:
                    plan = S.web_plan(pf, rnd, used, hint="apartment" if hannah else "")
            except Exception as e:
                print(f"  {case_id}: plan download failed ({e}) — using a synthetic plan")
            if not plan:
                plan = S.synthetic_plan(a.repo, pf, seed + i)
            S.write_plan_source(pf, plan)
        else:
            os.rmdir(os.path.join(folder, "floorplan"))

        project = pick_project(rnd, person, plan.get("rooms") if plan else None, whole_home=hannah)
        rooms = [make_room(rnd, person, project, r, plan, used, folder, a.offline, n) for n, r in enumerate(project["tested"], 1)]

        with open(os.path.join(folder, "README.md"), "w", encoding="utf-8") as f:
            f.write(readme(case_id, person, project, plan, rooms))
        with open(os.path.join(folder, "answers.json"), "w", encoding="utf-8") as f:
            json.dump(answers_json(person, project, plan, rooms), f, indent=2, ensure_ascii=False)
        rows.append({"case": case_id, "folder": os.path.basename(folder), "name": person["name"], "city": person["city"], "country": person["country"],
                     "swiss_plan": "yes" if plan and plan["swiss"] else "no", "plan": plan["kind"] if plan else "none",
                     "intent": project["intent"], "property": project["propertyType"], "state": project["houseState"],
                     "rooms_tested": " + ".join(r["room"] for r in rooms),
                     "vision": " + ".join(r["visionMode"] for r in rooms), "photos": sum(len(r["photos"]) for r in rooms),
                     "language": person["language"]})
        print(f"  {case_id} {person['name']} · {person['city']} · {rows[-1]['rooms_tested']} · plan: {rows[-1]['plan']}")

    with open(os.path.join(batch, "cases.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader(); w.writerows(rows)
    with open(os.path.join(batch, "README.md"), "w", encoding="utf-8") as f:
        f.write(f"# home-mockup test data · {dt.date.today():%d %b %Y} · seed {seed}\n\n"
                f"{len(rows)} test users. Same seed → same cases: `python3 qa/test-data-agent/generate.py --seed {seed}`.\n\n"
                "| Case | User | Home | Swiss | Rooms to test | Inspiration | Lang |\n|---|---|---|---|---|---|---|\n")
        for r in rows:
            f.write(f"| [{r['case']}]({r['folder']}/README.md) | {r['name']}, {r['city']} | {r['intent']} · {r['property']} · {r['state']} | "
                    f"{'🇨🇭' if r['swiss_plan'] == 'yes' else ''} | {r['rooms_tested']} | {r['vision']} ({r['photos']} photos) | {r['language']} |\n")
        f.write("\nPlan sources: Swiss Dwellings (Archilyse, CC BY 4.0) for Swiss homes, Wikimedia Commons / Openverse for the rest, "
                "synthetic plans from qa/floorplan/make_plans.py when offline. Every file's link is in its SOURCE(S).md.\n")
    print(f"Done → {batch}")


if __name__ == "__main__":
    main()
