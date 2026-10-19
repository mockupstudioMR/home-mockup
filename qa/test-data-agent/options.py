"""
The answers a person can give in the journey, mirrored from the app so test cases only use real choices.

Source of truth: src/journey/data.ts (step 1), src/journey/screens/Step2.tsx (vision, quick notes, discover styles),
Step3.tsx (activities, priorities, things to keep, fixed features), Step5.tsx (anchor piece and shapes).
`check_against_app()` greps every id/label below in those files and warns when the app has changed.
"""
import os
import re

INTENTS = {
    "new_space": "Setting up a new space",
    "redesign": "Redesigning what I have",
    "exploring": "Just exploring for now",
}
PROPERTIES = {
    "apartment": "Apartment",
    "house": "House",
    "studio": "Studio",
    "loft": "Loft",
}
ROOMS = {
    "living-room": "Living room",
    "bedroom": "Bedroom",
    "kitchen": "Kitchen",
    "dining-room": "Dining room",
    "office": "Home office",
    "bathroom": "Bathroom",
    "kids-room": "Kids' room",
    "hallway": "Hallway & entry",
}
HOUSE_STATES = {
    "core-shell": "Core & shell",
    "empty": "Empty",
    "partial": "Partially furnished",
    "redoing": "Redoing it all",
}
BUDGETS = ["Not decided yet", "Under €5,000", "€5,000 – €15,000", "€15,000 – €30,000", "€30,000+"]
TIMINGS = ["Not decided yet", "Within 1 month", "1–3 months", "3–6 months", "6+ months"]
RESTRICTIONS = ["Not sure", "None — I own it", "Rented — limited changes", "Building rules apply"]

VISION_MODES = {
    "upload": "Upload (inspiration photos)",
    "describe": "Describe your vision (in words)",
    "discover": "Discover (pick from the six styles)",
}
QUICK_NOTES = ["Keep it cosy", "Not too dark", "Pet friendly", "Kid friendly"]
DISCOVER_STYLES = ["Modern Minimal", "Bohemian Eclectic", "Glam & Luxe", "Rustic Nature", "Mediterranean", "Classic Historical"]

ACTIVITIES = {
    "living-room": ["Relax", "Host friends", "Play piano", "Watch films", "Read", "Work", "Paint & craft", "Kids play", "Eat here", "Yoga & stretch"],
    "bedroom": ["Sleep", "Read", "Get dressed", "Work", "Watch films", "Yoga & stretch", "Relax", "Kids play"],
    "kitchen": ["Cook", "Bake", "Eat here", "Host friends", "Work", "Kids play"],
    "dining-room": ["Eat here", "Host friends", "Work", "Kids play", "Play board games"],
    "office": ["Work", "Video calls", "Read", "Paint & craft", "Play piano"],
    "bathroom": ["Shower", "Bath", "Get ready", "Laundry"],
    "kids-room": ["Sleep", "Kids play", "Read", "Study", "Paint & craft"],
    "hallway": ["Arrive & leave", "Store coats & shoes", "Read the post"],
}
BASE_PRIORITIES = ["Comfortable seating", "Seats for guests", "Lots of storage", "Calm, clutter-free", "Easy to keep clean"]


def activity_priorities(acts):
    """Same rules as activityPrios() in Step3.tsx: some activities add their own priority."""
    out = []
    for a in acts:
        n = a.lower()
        if re.search(r"piano|guitar|instrument|music", n):
            out.append("Space to play the " + (re.sub(r"^play (the )?", "", n) if "play " in n else "instrument"))
        elif re.search(r"work|study", n):
            out.append("A proper place to work")
        elif re.search(r"film|tv|movie", n):
            out.append("A great screen setup")
        elif "read" in n:
            out.append("A reading corner")
        elif re.search(r"paint|craft", n):
            out.append("Room to make things")
        elif "kid" in n:
            out.append("Space for the kids")
        elif re.search(r"yoga|stretch", n):
            out.append("Clear floor space")
        elif re.search(r"eat|dine", n):
            out.append("A place to eat")
    return list(dict.fromkeys(out))


KEEP_CHIPS = ["Sofa", "Rug", "Bookshelf", "TV", "Artwork"]
KEEP_SIZES = {  # w × d × h in cm, for things people keep
    "Sofa": (220, 95, 85), "Rug": (200, 300, 1), "Bookshelf": (80, 35, 200), "TV": (145, 8, 85),
    "Artwork": (90, 4, 120), "Upright piano": (150, 60, 125), "Bed": (180, 210, 100), "Wardrobe": (200, 60, 220),
    "Desk": (140, 70, 75), "Dining table": (180, 90, 75), "Sideboard": (180, 45, 80),
}
WALLS = ["A", "B", "C", "D"]
FIXED = {
    "windows": "Windows", "doors": "Doors", "radiators": "Radiators", "columns": "Columns",
    "sockets": "Sockets & switches", "builtins": "Built-ins", "water": "Water supply & drains",
    "stacks": "Soil stack & risers", "ac": "AC units & vents", "panels": "Fuse box, meters & panels",
}
ROOM_INPUTS = {"plan": "Upload a floorplan", "photos": "Photos of the walls", "draw": "Draw it / type the sizes"}
SCALE_REFS = ["Typed width and length", "Door width (standard 80–90 cm)", "One measured wall"]

ANCHOR_BY_ROOM = {"living-room": "sofa", "bedroom": "bed", "dining-room": "dining table", "office": "desk",
                  "kitchen": "dining table", "kids-room": "bed", "hallway": "sideboard", "bathroom": "vanity"}
SHAPES = {"sofa": ["3-seater", "L-shape", "Curved"], "bed": ["Double", "King", "Daybed"],
          "dining table": ["Rectangular", "Round", "Oval"], "desk": ["Straight", "Corner", "Wall-mounted"],
          "sideboard": ["Straight", "Wall-mounted"], "vanity": ["Straight", "Wall-mounted"]}
MATERIALS = {"sofa": ["plum velvet", "oat bouclé", "cognac leather", "sage linen"], "bed": ["natural oak", "upholstered linen", "walnut", "rattan"],
             "dining table": ["solid oak", "travertine", "walnut", "white marble"], "desk": ["oak veneer", "black steel", "walnut"],
             "sideboard": ["fluted oak", "lacquered green", "walnut"], "vanity": ["terrazzo top", "oak", "micro-cement"]}

STYLE_KEYWORDS = {  # what to search for when a person uploads inspiration in this style
    "Modern Minimal": "minimalist interior", "Bohemian Eclectic": "bohemian interior plants",
    "Glam & Luxe": "luxury velvet interior", "Rustic Nature": "rustic wood interior",
    "Mediterranean": "mediterranean interior arches", "Classic Historical": "classic interior panelling mouldings",
    "Japandi": "japandi interior", "Scandinavian": "scandinavian interior", "Industrial": "industrial loft interior",
    "Mid-century": "mid-century modern interior", "Biophilic": "biophilic interior plants", "Dark & moody": "dark moody interior",
}
ROOM_SEARCH = {"living-room": "living room", "bedroom": "bedroom", "kitchen": "kitchen", "dining-room": "dining room",
               "office": "home office", "bathroom": "bathroom", "kids-room": "kids room", "hallway": "entrance hallway"}

STATE_FOR_INTENT = {"new_space": ["core-shell", "empty"], "redesign": ["partial", "redoing"], "exploring": ["empty", "partial"]}


def check_against_app(repo):
    """Warn about any choice above that no longer appears in the app's source."""
    files = ["src/journey/data.ts", "src/journey/screens/Step2.tsx", "src/journey/screens/Step3.tsx", "src/journey/screens/Step5.tsx"]
    text = ""
    for f in files:
        p = os.path.join(repo, f)
        if os.path.exists(p):
            text += open(p, encoding="utf-8").read()
    if not text:
        return ["App source not found — skipped the check (pass --repo)."]
    wanted = list(INTENTS) + list(PROPERTIES) + list(ROOMS) + list(HOUSE_STATES) + BUDGETS + TIMINGS + RESTRICTIONS
    wanted += QUICK_NOTES + DISCOVER_STYLES + BASE_PRIORITIES + KEEP_CHIPS + list(FIXED) + list(ANCHOR_BY_ROOM)
    wanted += sorted({a for acts in ACTIVITIES.values() for a in acts}) + sorted({s for v in SHAPES.values() for s in v})
    return [f"Not found in the app any more: {w!r}" for w in wanted if w not in text]
