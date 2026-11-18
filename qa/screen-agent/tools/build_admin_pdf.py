import json, sys, html, re
from playwright.sync_api import sync_playwright

SHOTS, HERO, FONT, OUT = sys.argv[1:5]
shots = json.load(open(SHOTS + "/shots.json"))

STEPS = {
 "A0": ("", "Overview", "Admin home"),
 "A": ("", "Feed", "Scan & upload"), "B": ("", "Feed", "Review"),
 "C": ("", "Curate", "Vocabulary"), "D": ("", "Curate", "Schemes & combinations"),
 "E": ("", "Curate", "Styles, palettes & rules"), "F": ("", "Curate", "Sizes, scope & config"),
 "X2": ("", "Curate", "Products & shops"),
 "G": ("", "Run", "Projects support"), "X1": ("", "Run", "Users & invites"), "X3": ("", "Run", "CMS & settings"),
}
def step_of(title):
    k = title.split(" · ")[0]
    return STEPS.get(k) or STEPS[k[0]]

W = 1280; IMG_W = 1200; HEAD = 120
pages_css, body = [], []

# cover
body.append(f"""<section class="pg cover" style="page: cover; height: 900px">
 <div class="cv-l">
  <div class="brand"><span class="bm"></span>Home Mockup</div>
  <div><p class="eyebrow">Admin journey</p>
  <h1>Feed, curate<br>and run the library</h1>
  <p class="lead">Screen-by-screen design · 17 admin screens: scan and upload designs, AI detection of furniture schemes, the review queue, and the tools that keep vocabulary, schemes, sizes and shops right.</p></div>
  <p class="meta">MockUp Studio · October 2026 · Counts, names and shops shown are sample data</p>
 </div>
 <div class="cv-r"><img src="file://{HERO}" alt=""></div>
</section>""")

# contents
rows, last = [], None
for i, s in enumerate(shots):
    st = step_of(s["title"])
    if st != last:
        rows.append(f'<div class="ct-step"><span>{st[1]}</span><b>{html.escape(st[2])}</b></div>')
        last = st
    name = html.escape(s["title"].split(" · ", 1)[1])
    rows.append(f'<div class="ct-row"><span class="no">{html.escape(s["title"].split(" · ")[0])}</span><span>{name}</span><span class="pg-no">{i + 3}</span></div>')
body.append(f"""<section class="pg toc" style="page: toc; height: 900px">
 <p class="eyebrow" style="text-align:left">Contents</p><h2>The admin, screen by screen</h2>
 <div class="cols">{''.join(rows)}</div></section>""")

for i, s in enumerate(shots):
    st = step_of(s["title"])
    h = round(s["h"] * IMG_W / s["w"])
    ph = HEAD + h + 40
    no, name = s["title"].split(" · ", 1)
    body.append(f"""<section class="pg scr" style="page: p{i}; height: {ph}px">
 <header><div><span class="stp">{st[1]} · {html.escape(st[2])}</span><h3><span>{html.escape(no)}</span>{html.escape(name)}</h3></div><span class="pn">{i + 3}</span></header>
 <img src="file://{s['file']}" style="width:{IMG_W}px;height:{h}px" alt=""></section>""")

doc = f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:'Caveat';src:url('file://{FONT}')}}
{chr(10).join(pages_css)}
*{{box-sizing:border-box}} body{{margin:0;font-family:'Inter',sans-serif;color:#3B3350;background:#F4EDE8;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.pg{{width:{W}px;overflow:hidden;break-after:page;position:relative}}
.cover{{display:flex;background:#F4EDE8}}
.cv-l{{flex:0 0 560px;padding:64px 56px;display:flex;flex-direction:column;justify-content:space-between;background:radial-gradient(circle at 0 0,rgba(176,163,190,.55),rgba(244,237,232,0) 60%)}}
.cv-r{{flex:1}} .cv-r img{{width:100%;height:100%;object-fit:cover;display:block}}
.brand{{display:flex;align-items:center;gap:12px;font-weight:800;font-size:22px;letter-spacing:-.02em}}
.bm{{width:40px;height:40px;border-radius:12px;background:#665A85}}
.eyebrow{{margin:0;font-size:15px;font-weight:500;letter-spacing:.34em;text-transform:uppercase;color:#665A80}}
h1{{margin:18px 0 0;font-size:66px;line-height:1.02;font-weight:800;letter-spacing:-.04em}}
.lead{{margin:24px 0 0;font-size:21px;line-height:1.5;color:#665A80}}
.meta{{margin:0;font-size:14px;color:#7C7090;line-height:1.5}}
.toc{{padding:72px 80px}} .toc h2{{margin:12px 0 40px;font-size:48px;font-weight:800;letter-spacing:-.035em}}
.cols{{columns:2;column-gap:64px}}
.ct-step{{break-inside:avoid;break-after:avoid;margin-top:22px;padding-bottom:8px;border-bottom:2px solid #665A85;display:flex;gap:12px;align-items:baseline}}
.ct-step span{{font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#665A85}} .ct-step b{{font-size:20px;letter-spacing:-.02em}}
.ct-row{{break-inside:avoid;display:flex;gap:14px;padding:9px 0;border-bottom:1px dashed #D9CED6;font-size:17px}}
.ct-row .no{{width:40px;color:#7C7090;font-weight:600}} .ct-row .pg-no{{margin-left:auto;color:#7C7090}}
.scr{{padding:0 40px}} .scr header{{height:{HEAD}px;display:flex;align-items:center;justify-content:space-between}}
.stp{{font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#665A85}}
.scr h3{{margin:6px 0 0;font-size:30px;font-weight:800;letter-spacing:-.03em}} .scr h3 span{{color:#9D90B4;margin-right:14px}}
.pn{{font-size:15px;color:#7C7090;font-weight:600}}
.scr img{{display:block;border-radius:18px;box-shadow:0 20px 50px -30px rgba(59,51,80,.55)}}
</style></head><body>{''.join(body)}</body></html>"""
open(OUT + ".html", "w").write(doc)
import pypdf, os
secs = re.findall(r'<section class="pg[^"]*" style="page: [^;]+; height: (\d+)px">.*?</section>', doc, flags=re.S)
blocks = re.findall(r'(<section class="pg.*?</section>)', doc, flags=re.S)
head = doc[:doc.index('<body>')+6]
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": W, "height": 900})
    w = pypdf.PdfWriter()
    for i, blk in enumerate(blocks):
        hgt = int(re.search(r'height: (\d+)px', blk).group(1))
        f = OUT + f".part{i}.html"; open(f, "w").write(head + blk + "</body></html>")
        pg.goto("file://" + f); pg.wait_for_load_state("networkidle"); pg.evaluate("document.fonts.ready")
        part = OUT + f".part{i}.pdf"
        pg.pdf(path=part, print_background=True, width=f"{W}px", height=f"{hgt}px", margin={"top":"0","bottom":"0","left":"0","right":"0"})
        r = pypdf.PdfReader(part); w.add_page(r.pages[0]); os.remove(f)
    w.add_metadata({"/Title": "Home Mockup — Admin screens", "/Author": "MockUp Studio"})
    w.write(OUT)
    for i in range(len(blocks)): os.remove(OUT + f".part{i}.pdf")
    b.close()
os.remove(OUT + ".html")
print("ok", len(blocks))
