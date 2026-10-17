"""Random people, homes and stories for test cases. Everything here is invented; no real person is described."""

PLACES = [  # city, country, climate (decides AC vs radiators), typical ceiling (m), app language
    ("Cairo", "Egypt", "hot", (2.8, 3.2), "ar"), ("New Cairo", "Egypt", "hot", (2.8, 3.1), "ar"),
    ("Alexandria", "Egypt", "hot", (2.9, 3.4), "ar"), ("Sahel, North Coast", "Egypt", "hot", (2.7, 3.0), "en"),
    ("Dubai", "United Arab Emirates", "hot", (2.7, 3.0), "en"), ("Berlin", "Germany", "cold", (2.6, 3.6), "en"),
    ("Darmstadt", "Germany", "cold", (2.5, 2.8), "en"), ("Munich", "Germany", "cold", (2.5, 2.9), "en"),
    ("Vienna", "Austria", "cold", (2.7, 3.6), "en"), ("London", "United Kingdom", "cold", (2.4, 3.0), "en"),
]
SWISS_PLACES = [("Zürich", "Switzerland", "cold", (2.4, 2.7), "en"), ("Basel", "Switzerland", "cold", (2.4, 2.8), "en"),
                ("Bern", "Switzerland", "cold", (2.4, 2.7), "en"), ("Geneva", "Switzerland", "cold", (2.5, 2.8), "en"),
                ("Lausanne", "Switzerland", "cold", (2.4, 2.7), "en"), ("Lucerne", "Switzerland", "cold", (2.4, 2.6), "en"),
                ("Winterthur", "Switzerland", "cold", (2.4, 2.6), "en")]

NAMES = {
    "Egypt": ["Nour", "Yasmin", "Omar", "Karim", "Laila", "Mariam", "Youssef", "Salma", "Hana", "Tarek", "Farida", "Adham"],
    "United Arab Emirates": ["Aisha", "Rania", "Zaid", "Priya", "Daniel", "Leila", "Sami"],
    "Germany": ["Lena", "Jonas", "Mia", "Felix", "Sophie", "Lukas", "Clara", "Paul"],
    "Austria": ["Anna", "Maximilian", "Katharina", "Florian", "Theresa", "Elias"],
    "Switzerland": ["Lea", "Noah", "Elena", "Luca", "Chiara", "Matteo", "Nina", "Reto", "Céline", "Julien"],
    "United Kingdom": ["Olivia", "James", "Amelia", "Harry", "Grace", "Oliver"],
}
SURNAME_INITIAL = "ABCDEFGHKLMNPRST"

HOUSEHOLDS = [
    ("lives alone", 1, False), ("lives with a partner", 2, False), ("shares the home with a flatmate", 2, False),
    ("lives with a partner and a toddler", 3, True), ("lives with a partner and two school-age kids", 4, True),
    ("is a single parent with a teenager", 2, True), ("lives with an elderly parent", 2, False),
]
JOBS = ["works from home as a UX designer", "is a doctor on shifts", "teaches at a primary school", "runs a small bakery",
        "is an architect", "works in finance and travels a lot", "is a software engineer, mostly remote", "is a university student",
        "is retired and paints", "is a nurse", "works in marketing", "is a freelance photographer", "runs an online shop from home"]
PETS = [None, None, None, "a cat", "a dog", "two cats", "a large dog"]
TRIGGERS = {
    "new_space": ["just got the keys to a new-build flat", "bought their first home", "moved for a new job and the place is bare",
                  "took over a core-and-shell unit from the developer", "is moving in after the wedding"],
    "redesign": ["has lived here for six years and is tired of the look", "wants the home to work for a baby on the way",
                 "inherited furniture that doesn't fit the style", "started working from home and needs it to work differently"],
    "exploring": ["is browsing ideas before deciding whether to move", "is curious what the place could look like",
                  "is saving up and wants to plan ahead"],
}
STYLE_STORIES = {
    "Modern Minimal": "likes calm, uncluttered rooms with clean lines", "Bohemian Eclectic": "collects things from travels and loves plants and pattern",
    "Glam & Luxe": "loves velvet, brass and a bit of drama", "Rustic Nature": "wants wood, linen and stone, a bit like a holiday cabin",
    "Mediterranean": "dreams of lime plaster, arches and terracotta", "Classic Historical": "loves mouldings, panelling and antiques",
    "Japandi": "wants Japanese calm with Scandinavian warmth", "Scandinavian": "likes light wood, white walls and soft textiles",
    "Industrial": "likes exposed brick, metal and leather", "Mid-century": "loves teak, tapered legs and 60s shapes",
    "Biophilic": "wants the home full of plants and natural light", "Dark & moody": "wants deep colours and low, warm light",
}
DESCRIBE_NOTES = {
    "Modern Minimal": "Clean and calm, white and greige, no clutter, hidden storage, one statement lamp.",
    "Bohemian Eclectic": "Warm and layered — rugs on rugs, rattan, lots of plants, colourful cushions, things from travels.",
    "Glam & Luxe": "Velvet sofa, brass details, marble side tables, deep green or navy, a big mirror.",
    "Rustic Nature": "Oak and linen, stone, handmade ceramics, earthy colours, feels like a cabin.",
    "Mediterranean": "Lime plaster walls, arches, terracotta floor, rattan lamps, sun-washed colours.",
    "Classic Historical": "Panelled walls, mouldings, antique pieces mixed with a modern sofa, rich wood.",
    "Japandi": "Low furniture, light oak, paper lamps, beige and charcoal, very calm.",
    "Scandinavian": "Bright, white walls, light wood, wool throws, simple and cosy.",
    "Industrial": "Black metal, leather armchair, concrete look, Edison bulbs.",
    "Mid-century": "Teak sideboard, tapered legs, mustard and olive, a sunburst mirror.",
    "Biophilic": "Plants everywhere, natural textures, curved shapes, lots of daylight.",
    "Dark & moody": "Dark green walls, velvet, low warm lights, not too cluttered.",
}
