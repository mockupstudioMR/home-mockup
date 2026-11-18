"""Builds a small, real Generator PRO demo scene from the sample living-room photo:
camera-aligned, full-canvas transparent variation layers made by masking and
recolouring pixels of the photo itself (no pasted product photos).

Usage:
  python3 scripts/showroom-demo/make_scene.py public/journey-sample/room-hero.jpg \
    public/showroom-demo/living-room /showroom-demo/living-room
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter

SRC, OUT, PREFIX = sys.argv[1], sys.argv[2], sys.argv[3].rstrip("/") + "/"
os.makedirs(OUT, exist_ok=True)
im = Image.open(SRC).convert("RGB")
# the sample photo has a numbered badge in its top-left corner: cover it with the
# neighbouring stretch of ceiling and cornice before anything is derived from it
import cv2
_a = np.asarray(im).copy(); _m = np.zeros(_a.shape[:2], np.uint8)
cv2.circle(_m, (44, 60), 36, 255, -1)
im = Image.fromarray(cv2.inpaint(_a, _m, 9, cv2.INPAINT_TELEA))
W, H = im.size
rgb = np.asarray(im).astype(np.float32) / 255
hsv = np.asarray(im.convert("HSV")).astype(np.float32)
h, s, v = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
yy, xx = np.mgrid[0:H, 0:W]

def soft(mask, r=1.4, close=5):
  m = Image.fromarray((mask * 255).astype(np.uint8))
  m = m.filter(ImageFilter.MaxFilter(close)).filter(ImageFilter.MinFilter(close))   # close small holes
  m = m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))           # drop specks
  m = m.filter(ImageFilter.GaussianBlur(r))
  return np.asarray(m).astype(np.float32) / 255

# sofa: plum/magenta velvet, lower right
sofa = ((h > 285) | (h < 8)) & (s > .28) & (v > .12) & (xx > 790) & (yy > 600) & (yy < 905)
# arch wall + door paint: teal, left side, excluding the green chair
wall = (h > 135) & (h < 205) & (s > .12) & (v > .06) & (xx < 500) & (yy > 150) & (yy < 800)
chair = (xx > 350) & (xx < 625) & (yy > 625) & (h < 168)   # leather is greener than the teal paint
wall &= ~chair
sofa_a, wall_a = soft(sofa.astype(np.float32)), soft(wall.astype(np.float32), close=9)

def recolor(target_rgb, keep_light=True, sat=None):
  """Shade a flat colour by the photo's own lightness, so folds and light stay."""
  lum = (0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2])
  base = np.array(target_rgb, np.float32) / 255
  ref = 0.299 * base[0] + 0.587 * base[1] + 0.114 * base[2]
  out = np.clip(base[None, None, :] * (lum / max(ref, .05))[..., None] * 0.92, 0, 1)
  grey = lum[..., None].repeat(3, 2)
  return np.clip(out * 0.82 + grey * 0.18, 0, 1)

def layer(name, alpha, colours):
  paths, thumbs = [], []
  ys, xs = np.nonzero(alpha > .5)
  box = (max(xs.min() - 20, 0), max(ys.min() - 20, 0), min(xs.max() + 20, W), min(ys.max() + 20, H))
  for i, (label, col) in enumerate(colours, 1):
    px = rgb if col is None else recolor(col)
    rgba = np.dstack([px, alpha])
    img = Image.fromarray((rgba * 255).astype(np.uint8), "RGBA")
    p = f"{name}-{i}.webp"; img.save(os.path.join(OUT, p), "WEBP", quality=88, method=6)
    comp = Image.alpha_composite(im.convert("RGBA"), img).convert("RGB").crop(box)
    comp.thumbnail((260, 260)); t = f"{name}-{i}-thumb.jpg"; comp.save(os.path.join(OUT, t), quality=84)
    paths.append(p); thumbs.append(t)
  cy, cx = (box[1] + box[3]) / 2, (box[0] + box[2]) / 2
  return paths, thumbs, (int(cx), int(cy)), [c[0] for c in colours]

sofa_v = layer("sofa", sofa_a, [("Plum velvet", None), ("Emerald velvet", (34, 92, 70)), ("Ochre velvet", (176, 128, 44)), ("Dove grey", (150, 146, 142)), ("Blush", (206, 150, 140))])
wall_v = layer("arch-wall", wall_a, [("Teal", None), ("Plum", (88, 56, 80)), ("Terracotta", (170, 92, 62)), ("Warm greige", (196, 182, 164))])
im.save(os.path.join(OUT, "background.jpg"), quality=88)

def L(title, group, order, v, hotspot):
  paths, thumbs, centre, names = v
  return {"title": title, "group": group, "order": order, "visible": True,
          "variations": [PREFIX + p for p in paths], "thumbnails": [PREFIX + t for t in thumbs], "variationNames": names,
          "hotspot": {"id": title.lower().replace(" ", "-"), "title": title, "visible": True, "position": {"x": hotspot[0], "y": hotspot[1]}}}

manifest = {"background": "background.jpg", "imageSize": {"width": W, "height": H},
            "layers": {"arch-wall": L("Arch wall", "walls", 10, wall_v, (250, 300)),
                       "sofa": L("Sofa", "furniture", 20, sofa_v, (1060, 760))}}
json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w"), indent=2)
print("sofa px", int(sofa.sum()), "wall px", int(wall.sum()))
