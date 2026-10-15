import json, re, os, sys
from playwright.sync_api import sync_playwright
from PIL import Image

PROJ = sys.argv[1]          # .../hm/project
ASSETS = sys.argv[2]        # /home/claude/assets
FONT = sys.argv[3]          # caveat woff2
OUT = sys.argv[4]           # output dir

BLOBS = {
 "93f4c7352835609f10aa3c90d8e2eb83":"room-hero","b89831f41c0486b83a4566e0205019d2":"moodboard",
 "a479bb0e26affbc3a6a9b26ad8cc5d7a":"piano-wall","4d3e5d9b0d235e9c079eb4d7071a0c80":"sofa-wall",
 "27935a944a4a09c1513a53166678d7bd":"window-wall","eee06c4c0fdd6f1a1bd2b801a19a53df":"entry-wall",
 "10a336124216898c2ad73de1c4af03bc":"electrical","81b5bf30ac914e4213a1861c9f96afe1":"wall-by-wall",
 "b9c2c1c4419ed2c99335d9a0f7ba0abf":"sw-plum","c7db63c9079f62b8aa1b30d148d6fdd1":"sw-green",
 "3e51c9c95a608df18f348fba66189f00":"sw-walnut","0ad24496b53dae69c51e8c3d3880b5fb":"sw-brass",
 "8ee44172c4fa601b4efc824b96c2cf63":"sw-plaster","30c3a897247c5eccaf44611e4e81795e":"insp-1",
 "d1e700ea31e0d580c033d10183ea60fe":"insp-2","e64c9cc5561c0f27a6fbe10c3c2df0d1":"insp-3",
 "6c0a72e0b3bbc915e2efacb47a497c4d":"luxe-1","4fabaf81da75731e1ab66e32c062aa46":"luxe-2",
 "765f494db116983e334b6e7ca2f344d6":"luxe-3","ba4942c72161c0603769b5dc8c468668":"luxe-4",
 "bff2e0bbcd81ab1c1f517c94150acc2b":"bio-1","eabaafbebcb48f92c48d5aa2cbb344c3":"bio-2",
 "e8dda365a6b4cb2283f7eea5ab06db1c":"bio-3","3960827084a009633d0893c3a386176f":"bio-4",
}

canvas = json.load(open(os.path.join(PROJ, "canvas.json")))
order = canvas["order"]
boards = canvas["boards"]
font_face = f"<style>@font-face{{font-family:'Caveat';src:url('file://{FONT}') format('woff2');font-weight:500}}</style>"

os.makedirs(OUT, exist_ok=True)
shots = []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1.5)
    for name in order:
        html = open(os.path.join(PROJ, name), encoding="utf-8").read()
        html = html.replace('<script src="./support.js"></script>', "")
        html = re.sub(r'<script type="text/x-dc".*?</script>', "", html, flags=re.S)
        html = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>', font_face, html)
        html = re.sub(r'/_blob/([0-9a-f]{32})', lambda m: f"file://{ASSETS}/{BLOBS[m.group(1)]}.jpg", html)
        tmp = os.path.join(PROJ, "_render_" + name.replace(".dc.html", ".html"))
        open(tmp, "w", encoding="utf-8").write(html)
        pg.goto("file://" + tmp)
        pg.wait_for_load_state("networkidle")
        pg.evaluate("document.fonts.ready")
        png = os.path.join(OUT, name.replace(".dc.html", ".png"))
        pg.screenshot(path=png, full_page=True)
        jpg = png[:-4] + ".jpg"
        im = Image.open(png).convert("RGB"); im.save(jpg, quality=86); os.remove(png)
        os.remove(tmp)
        shots.append({"file": jpg, "title": boards[name]["title"], "w": im.width, "h": im.height})
        print(name, im.size)
    b.close()
json.dump(shots, open(os.path.join(OUT, "shots.json"), "w"), indent=1)
