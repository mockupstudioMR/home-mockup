"""Sample living room, walls A–D, prepared as Generator PRO scenes (camera key wall-std-v1-L500).

Each wall is one scene, the way the showroom renderer already composites:
  background          the empty room in the standard light (architecture, corners, light from the window)
  wall / floor        one shared shadow (black where the surface is) + one colour image per finish
  each piece          a shadow sprite (multiply: the shade it throws, black under itself) and a colour sprite
                      (lighten: the lit piece on black), drawn at its box (renderer patch: layer.box)
Pieces are rendered on a neutral room, with and without the piece, so their shadows work on every finish.
Measurements match the step-5 outlines of the sample living room (A/C 3.75 m, B/D 4.90 m, 2.70 m high).

  python3 scripts/showroom-demo/make_walls.py            -> public/showroom-demo/walls/{a,b,c,d}/
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import wall_standard as ws
from wall_standard import PX, hexrgb, noise, to_rgba, plate, radiator, side_table, sofa

ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(HERE, "wall-sources")
OUT = os.path.join(ROOT, "public", "showroom-demo", "walls")
URL = "/showroom-demo/walls"
ws.load_plaster(os.path.join(SRC, "plaster.png"))
DX = {"left": 1, "right": -1, "front": 0.4, "back": 0}

FINISHES = [("Warm limewash", "#CDBFAE"), ("Sage", "#A7B19A"), ("Terracotta", "#C28B6F"), ("Mauve", "#7A6070")]
FLOORS = [("Walnut", "#5C3E2A"), ("Oak", "#9A754F"), ("Pale oak", "#C3A57F")]
NEUTRAL = ("#C8C4BE", "#8A7A6A")  # pieces are rendered on this room


class W(ws.Wall):
  """A wall that also records which pixels the pieces cover."""
  def __init__(self, *a, **k):
    super().__init__(*a, **k)
    self.alpha = np.zeros((self.H, self.W), np.float32)

  def paste(self, rgba, x, y, piece=True):
    super().paste(rgba, x, y)
    if not piece: return
    a = np.zeros((self.H, self.W), np.float32)
    al = np.asarray(rgba.split()[3]).astype(np.float32) / 255
    x, y = int(x), int(y); h, w = al.shape
    y0, y1, x0, x1 = max(y, 0), min(y + h, self.H), max(x, 0), min(x + w, self.W)
    if y1 > y0 and x1 > x0: a[y0:y1, x0:x1] = al[y0 - y:y1 - y, x0 - x:x1 - x]
    self.alpha = np.maximum(self.alpha, a)


def grade(img, w):
  """The standard's finish, deterministic so every pass of a wall gets the same grade."""
  img = np.clip(img, 0, 1) ** 0.97 * np.array([1.02, 1.0, 0.96], np.float32)
  vx = (w.xx - w.W / 2) / w.W; vy = (w.yy - w.H * 0.45) / w.H
  return np.clip(img * (1 - 0.32 * (vx ** 2 + vy ** 2) * 2)[..., None], 0, 1)


def blur(a, r):
  return np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255


def src(name):
  im = Image.open(os.path.join(SRC, name)).convert("RGBA"); return im.crop(im.getbbox())


def match_light(piece, warm=1.0, gain=1.0):
  a = np.asarray(piece).astype(np.float32) / 255
  rgb = a[..., :3] * gain * np.array([1.0 * warm, 1.0, 0.97 / warm], np.float32)
  return Image.fromarray((np.dstack([np.clip(rgb, 0, 1), a[..., 3:]]) * 255).astype(np.uint8), "RGBA")


# ---------------------------------------------------------------- drawn pieces (placeholders until a real front view exists)
def velvet_sofa(wpx, hpx):
  s = sofa(wpx, hpx, "#4A2340")
  a = np.asarray(s).astype(np.float32) / 255
  a[..., :3] *= (0.84 + 0.24 * noise(hpx, wpx, 21, 3, 99))[..., None]
  g = a[..., :3].mean(-1, keepdims=True); a[..., :3] = a[..., :3] * 0.82 + g * 0.18
  return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8), "RGBA").filter(ImageFilter.GaussianBlur(0.8))


def built_in_shelves(w_px, h_px):
  im = Image.open(os.path.join(SRC, "shelving.png")).convert("RGB")
  im = im.resize((w_px, int(im.height * w_px / im.width)), Image.LANCZOS)
  out = Image.new("RGB", (w_px, h_px)); y = 0; k = 0
  while y < h_px:
    tile = im if k % 2 == 0 else im.transpose(Image.FLIP_LEFT_RIGHT)
    out.paste(tile, (0, y)); y += tile.height - 9; k += 1
  return out.convert("RGBA")


def gallery_pair(w_px, h_px):
  big, small = src("art-big.png"), src("art-small.png")
  bh = h_px; bw = int(big.width * bh / big.height); sh = int(h_px * 0.72); sw = int(small.width * sh / small.height)
  gap = max(15, w_px - bw - sw)
  out = Image.new("RGBA", (bw + gap + sw, h_px), (0, 0, 0, 0))
  out.alpha_composite(big.resize((bw, bh), Image.LANCZOS), (0, 0)); out.alpha_composite(small.resize((sw, sh), Image.LANCZOS), (bw + gap, (h_px - sh) // 2))
  return out


def lamp(w_px, h_px):
  im = Image.new("RGBA", (w_px, h_px), (0, 0, 0, 0)); d = ImageDraw.Draw(im); cx = w_px // 2
  for i in range(7):
    c = 150 + i * 10; d.line([cx - 3 + i, int(h_px * 0.28), cx - 3 + i, h_px - 12], fill=(c, int(c * 0.8), int(c * 0.47), 255))
  d.ellipse([cx - 36, h_px - 18, cx + 36, h_px], fill=(140, 108, 60, 255)); d.ellipse([cx - 36, h_px - 21, cx + 36, h_px - 6], fill=(186, 150, 92, 255))
  sh = int(h_px * 0.3); yy, xx = np.mgrid[0:sh, 0:w_px].astype(np.float32)
  half = w_px * 0.275 + (w_px * 0.49 - w_px * 0.275) * yy / sh
  inside = np.abs(xx - cx) < half
  lin = hexrgb("#EFE2C8") * (1.0 + 0.08 * np.sin(xx / 4))[..., None] * (0.92 + 0.12 * (1 - np.abs(xx - cx) / np.maximum(half, 1)))[..., None]
  im.alpha_composite(to_rgba(lin, inside.astype(np.float32)), (0, 6))
  return im


def window_pair(w_px, h_px):
  sash = Image.open(os.path.join(SRC, "window.png")).convert("RGB")
  sw = w_px // 2 + 9; s = sash.resize((sw, h_px), Image.LANCZOS)
  out = Image.new("RGB", (w_px, h_px), (246, 244, 240)); out.paste(s, (0, 0)); out.paste(s.transpose(Image.FLIP_LEFT_RIGHT), (w_px - sw, 0))
  return out.convert("RGBA")


def curtain(w_px, h_px, flip=False):
  c = Image.open(os.path.join(SRC, "curtain.png")).convert("RGB").resize((w_px, h_px), Image.LANCZOS)
  c = c.transpose(Image.FLIP_LEFT_RIGHT) if flip else c
  a = np.asarray(c).astype(np.float32) / 255 * (0.95 + 0.1 * np.linspace(0, 1, h_px))[:, None, None]
  return to_rgba(a, np.ones((h_px, w_px), np.float32))


# ---------------------------------------------------------------- placing pieces (cm on the wall -> px)
def stand(w, piece, x_cm, w_cm, h_cm, depth_cm, shadow=0.42):
  """Standing piece against the wall; x_cm is its left edge along the wall."""
  dx = DX[w.light]
  base_y = w.y1 + depth_cm * 0.42 * PX / 2
  s = (base_y - w.yh) / (w.y1 - w.yh)
  pw, ph = int(w_cm * PX * s), int(h_cm * PX * s)
  X = w.cx + (w.x0 + (x_cm + w_cm / 2) * PX - w.cx) * s - pw / 2; Y = base_y - ph
  p = piece.resize((pw, ph), Image.LANCZOS)
  al = np.asarray(p.split()[3]).astype(np.float32) / 255
  m = np.zeros((w.H, w.W), np.float32); sx, sy = int(X + dx * 33), int(Y - 6)
  y0, y1, x0, x1 = max(sy, 0), min(sy + ph, w.H), max(sx, 0), min(sx + pw, w.W)
  m[y0:y1, x0:x1] = al[y0 - sy:y1 - sy, x0 - sx:x1 - sx]; m[int(w.y1):, :] = 0
  w.shade(m, shadow, 33)
  w.shade(w.ellipse_mask([X - 6, base_y - 18, X + pw + 6, base_y + 9]), 0.7, 9)
  w.shade(w.ellipse_mask([X - 45 + dx * 39, base_y - 33, X + pw + 45 + dx * 39, base_y + 39]), 0.35, 30)
  w.paste(p, X, Y)
  return dict(x=int(X + pw / 2), y=int(Y + ph * 0.45))


def hang(w, piece, x_cm, y_cm, w_cm, h_cm, depth=7, shadow=0.42):
  """Piece on the wall; x_cm, y_cm = its top-left (y from the ceiling)."""
  dx = DX[w.light]; X, Y = w.p(x_cm, y_cm); pw, ph = int(w_cm * PX), int(h_cm * PX)
  w.shade(w.rect_mask([X + dx * depth * 1.5, Y + depth * 1.5, X + pw + dx * depth * 1.5, Y + ph + depth * 1.5], 4), shadow, 10)
  w.paste(piece.resize((pw, ph), Image.LANCZOS), X, Y)
  return dict(x=int(X + pw / 2), y=int(Y + ph / 2))


def points(w, pts):
  for x, y in pts:
    X, Y = w.p(x, y); w.shade(w.rect_mask([X - 12, Y - 9, X + 16, Y + 18], 4), 0.3, 4); w.paste(plate(27), X - 13, Y - 13)
  X, Y = w.p(*pts[0]); return dict(x=int(X), y=int(Y))


def mirror(w, x, y, dcm):
  dx = DX[w.light]; X, Y = w.p(x, y); r = int(dcm * PX / 2)
  w.shade(w.ellipse_mask([X + dx * 18, Y + 21, X + 2 * r + dx * 18, Y + 2 * r + 21]), 0.45, 18)
  refl = Image.open(os.path.join(ROOT, "public", "journey-sample", "piano-wall.jpg")).convert("RGB")
  refl = refl.resize((2 * r, int(refl.height * 2 * r / refl.width))).crop((0, 0, 2 * r, 2 * r)).filter(ImageFilter.GaussianBlur(2.4))
  rr = np.asarray(refl).astype(np.float32) / 255 * 0.82 + 0.06
  yy, xx = np.mgrid[0:2 * r, 0:2 * r].astype(np.float32)
  dist = np.hypot(xx - r + 0.5, yy - r + 0.5); glass = dist < r - 13
  rr = rr + (np.clip(1 - np.hypot(xx - r * 0.5, yy - r * 0.4) / (r * 0.8), 0, 1) * 0.12)[..., None]
  brass = np.array([0.74, 0.58, 0.33], np.float32) * (0.72 + 0.55 * np.clip(1 - (xx + yy) / (4 * r), 0, 1))[..., None]
  w.paste(to_rgba(np.where(glass[..., None], rr, brass), np.clip(r - dist, 0, 1)), X, Y)
  return dict(x=int(X + r), y=int(Y + r))


# ---------------------------------------------------------------- architecture (part of the background, never painted over)
def arch_mask(w, pad):
  x0, x1 = w.p(60, 0)[0], w.p(170, 0)[0]; top = w.p(0, 50)[1]; r = (x1 - x0) // 2
  m = Image.new("L", (w.W, w.H), 0); d = ImageDraw.Draw(m)
  d.rectangle([x0 - pad, top + r, x1 + pad, w.y1 + 6], fill=255); d.ellipse([x0 - pad, top - pad, x1 + pad, top + 2 * r + pad], fill=255)
  return blur(np.asarray(m).astype(np.float32) / 255, 0.8)


def doorway(w):
  x0, x1 = w.p(60, 0)[0], w.p(170, 0)[0]; top = w.p(0, 50)[1]; r = (x1 - x0) // 2
  reveal = arch_mask(w, 24)
  paint = hexrgb("#2F5A4A")[None, None] * (0.92 + 0.12 * noise(w.H, w.W, 80, 2, 4))[..., None] * (1.05 - 0.15 * (w.xx - x0) / (x1 - x0 + 1))[..., None]
  w.img = w.img * (1 - reveal[..., None]) + paint * reveal[..., None]
  hall = Image.open(os.path.join(SRC, "hall.png")).convert("RGB")
  ow, oh = x1 - x0, w.y1 - top
  hall = hall.resize((ow, int(hall.height * ow / hall.width)), Image.LANCZOS)
  if hall.height < oh: hall = hall.resize((int(hall.width * oh / hall.height), oh), Image.LANCZOS)
  hall = hall.crop(((hall.width - ow) // 2, hall.height - oh, (hall.width - ow) // 2 + ow, hall.height))
  hm = Image.new("L", (ow, oh), 0); hd = ImageDraw.Draw(hm); hd.rectangle([0, r, ow, oh], fill=255); hd.ellipse([0, 0, ow, 2 * r], fill=255)
  w.paste(to_rgba(np.asarray(hall).astype(np.float32) / 255 * 0.82, np.asarray(hm).astype(np.float32) / 255), x0, top, piece=False)
  w.shade(w.rect_mask([x1 - 40, top + r, x1, w.y1]), 0.5, 15)
  w.shade(w.rect_mask([x0, top + r - 30, x1, top + r + 60]), 0.2, 45)
  d = w.draw(); d.rectangle([x0 - 24, w.y1 - 4, x1 + 24, w.y1 + 6], fill=(176, 141, 87)); w.commit()


def window_rect(w):
  (X0, Y0), (X1, Y1) = w.p(86, 40), w.p(266, 180); return X0, Y0, X1, Y1


def window_mask(w):
  X0, Y0, X1, Y1 = window_rect(w)
  m = Image.new("L", (w.W, w.H), 0); d = ImageDraw.Draw(m)
  d.rectangle([X0 - 18, Y0 - 18, X1 + 18, Y1 + 30], fill=255)
  return blur(np.asarray(m).astype(np.float32) / 255, 0.8)


def window(w):
  X0, Y0, X1, Y1 = window_rect(w)
  d = w.draw(); d.rectangle([X0 - 18, Y0 - 18, X1 + 18, Y1 + 18], fill=(246, 244, 240)); w.commit()
  w.paste(window_pair(X1 - X0, Y1 - Y0), X0, Y0, piece=False)
  d = w.draw(); d.rectangle([X0 - 33, Y1 + 12, X1 + 33, Y1 + 30], fill=(250, 248, 244)); d.line([X0 - 33, Y1 + 30, X1 + 33, Y1 + 30], fill=(200, 194, 186), width=2); w.commit()


def window_light(w):
  X0, Y0, X1, Y1 = window_rect(w)
  w.img *= 0.93
  w.glow(w.rect_mask([X0, Y0, X1, Y1]), 0.45, 68, (1.0, 0.98, 0.92))
  spill = Image.new("L", (w.W, w.H), 0)
  ImageDraw.Draw(spill).polygon([(X0, w.y1), (X1, w.y1), (X1 + 225, w.H), (X0 - 225, w.H)], fill=150)
  w.glow(np.asarray(spill).astype(np.float32) / 255, 0.5, 51, (1.0, 0.95, 0.85))


def lamp_glow(w, x_cm, y_cm, rx, ry_up, ry_down):
  X, Y = w.p(x_cm, y_cm); w.glow(w.ellipse_mask([X - rx, Y - ry_up, X + rx, Y + ry_down]), 0.3, 68)


# ---------------------------------------------------------------- the four walls
def item(name, title, group, draw, products=None):
  return dict(name=name, title=title, group=group, draw=draw, products=products)


WALLS = {
  "a": dict(role="Sofa", length=375, light="front", arch=None, keep=None, glow=None, items=[
    item("shelves", "Built-in shelves", "furniture", lambda w: (w.shade(w.rect_mask([w.p(12, 40)[0] - 9, w.p(12, 40)[1] - 6, w.p(92, 40)[0] + 9, w.p(0, 270)[1]]), 0.45, 15),
                                                                w.paste(built_in_shelves(80 * PX, 230 * PX), *w.p(12, 40)), dict(x=int(w.p(52, 0)[0]), y=int(w.p(0, 120)[1])))[-1]),
    item("art", "Gallery pair", "decor", lambda w: hang(w, gallery_pair(110 * PX, 70 * PX), 175, 85, 110, 70)),
    item("points", "Sockets", "lighting", lambda w: points(w, [(100, 240), (362, 240)])),
    item("sofa", "Sofa", "furniture", lambda w: stand(w, velvet_sofa(240 * PX, 85 * PX), 110, 240, 85, 95)),
  ]),
  "b": dict(role="Piano", length=490, light="right", arch=None, keep=None, glow=lambda w: lamp_glow(w, 390, 112, 225, 45, 420), items=[
    item("art", "Art", "decor", lambda w: hang(w, src("art-big.png"), 205, 40, 80, 82)),
    item("points", "Socket", "lighting", lambda w: points(w, [(345, 240)])),
    item("piano", "Piano", "furniture", lambda w: stand(w, match_light(src("piano-cut.png"), 1.02, 1.12), 170, 150, 125, 60)),
    item("lamp", "Floor lamp", "lighting", lambda w: stand(w, lamp(40 * PX, 160 * PX), 370, 40, 160, 40, shadow=0.22)),
  ]),
  "c": dict(role="Window", length=375, light="back", arch=window, keep=window_mask, glow=window_light, items=[
    item("radiator", "Radiator", "decor", lambda w: hang(w, radiator(140 * PX, 38 * PX), 106, 212, 140, 38, depth=4, shadow=0.3)),
    item("points", "Socket", "lighting", lambda w: points(w, [(356, 240)])),
    item("curtains", "Curtains", "decor", lambda w: curtains(w)),
    item("chair", "Armchair", "furniture", lambda w: stand(w, match_light(src("chair-cut.png"), 1.0, 1.05), 4, 84, 67, 70)),
    item("side-table", "Side table", "furniture", lambda w: stand(w, side_table(45 * PX, 55 * PX), 300, 45, 55, 30, shadow=0.2)),
  ]),
  "d": dict(role="Entry", length=490, light="left", arch=doorway, keep=lambda w: arch_mask(w, 24), glow=lambda w: lamp_glow(w, 425, 110, 165, 135, 225), items=[
    item("mirror", "Mirror", "decor", lambda w: mirror(w, 295, 40, 80)),
    item("sconce", "Wall light", "lighting", lambda w: sconce(w)),
    item("points", "Switch & socket", "lighting", lambda w: points(w, [(200, 150), (405, 240)])),
    item("cabinet", "Cabinet", "furniture", None, products=[
      ("cabinet-inlaid", "Inlaid cabinet", lambda w: stand(w, src("cabinet-inlaid.png"), 290, 90, 115, 40)),
      ("sideboard-moss", "Moss sideboard", lambda w: stand(w, src("sideboard-moss.png"), 260, 150, 82, 45)),
    ]),
  ]),
}


def curtains(w):
  for x_cm, flip in ((60, False), (268, True)):
    X, Y = w.p(x_cm, 18); cw, ch = int(30 * PX), int(252 * PX)
    w.shade(w.rect_mask([X + 15, Y, X + cw + 15, Y + ch]), 0.3, 18)
    w.paste(curtain(cw, ch, flip), X, Y)
  X, Y = w.p(52, 16); X2, _ = w.p(306, 16)
  rail = Image.new("RGBA", (int(X2 - X) + 20, 20), (0, 0, 0, 0)); d = ImageDraw.Draw(rail)
  d.rectangle([10, 6, X2 - X + 10, 13], fill=(160, 124, 70, 255)); d.ellipse([1, 1, 19, 19], fill=(150, 116, 64, 255)); d.ellipse([X2 - X + 1, 1, X2 - X + 19, 19], fill=(150, 116, 64, 255))
  w.paste(rail, X - 10, Y - 10)
  return dict(x=int(w.p(75, 0)[0]), y=int(w.p(0, 120)[1]))


def sconce(w):
  sc = src("sconce2-cut.png"); hang(w, sc, 418, 96, 14, 36, depth=3, shadow=0.25)
  X, Y = w.p(425, 114); return dict(x=int(X), y=int(Y))


def room(spec, finish, floor):
  """The empty wall in the standard light: shell, architecture, corners, light."""
  w = W(spec["length"], light=spec["light"], finish=finish, floor=floor); w.shell()
  if spec["arch"]: spec["arch"](w)
  w.light_pass()
  if spec["glow"]: spec["glow"](w)
  return w


def save(arr, path, lossless=False):
  Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8)).save(path, "WEBP", quality=88, lossless=lossless, method=6)


def thumb(rgb, box, path, size=160, bg=(246, 242, 236)):
  x0, y0, x1, y1 = box
  im = Image.fromarray((np.clip(rgb[y0:y1, x0:x1], 0, 1) * 255).astype(np.uint8)); im.thumbnail((size, size))
  out = Image.new("RGB", (size, size), bg); out.paste(im, ((size - im.width) // 2, (size - im.height) // 2)); out.save(path, quality=86)


def build(key, spec):
  out = os.path.join(OUT, key); os.makedirs(out, exist_ok=True)
  for f in os.listdir(out): os.remove(os.path.join(out, f))
  url = lambda f: f"{URL}/{key}/{f}"
  base = room(spec, FINISHES[0][1], FLOORS[0][1])
  save(grade(base.img, base), os.path.join(out, "background.webp"))
  m = base.masks
  keep = spec["keep"](base) if spec["keep"] else 0
  wall_m = blur(np.clip((m["back"] | m["left"] | m["right"]).astype(np.float32) - keep, 0, 1), 0.7)
  floor_m = m["floor"].astype(np.float32)
  if key == "d":  # keep the brass threshold under the doorway
    x0, x1 = base.p(60, 0)[0], base.p(170, 0)[0]; floor_m[int(base.y1) - 4:int(base.y1) + 8, int(x0) - 26:int(x1) + 26] = 0
  floor_m = blur(floor_m, 0.7)
  layers = {}

  def surface(name, title, group, order, mask, options, make, hotspot):
    save(np.repeat((1 - mask)[..., None], 3, -1), os.path.join(out, f"{name}-shadow.webp"), lossless=True)
    ys, xs = np.nonzero(mask > 0.99); cy, cx = int(np.median(ys)), int(np.median(xs))
    for i, (_, hexc) in enumerate(options, 1):
      w = make(hexc); g = grade(w.img, w)
      save(g * mask[..., None], os.path.join(out, f"{name}-{i}.webp"))
      thumb(g, (cx - 70, cy - 70, cx + 70, cy + 70), os.path.join(out, f"{name}-{i}-thumb.jpg"), 120)
    layers[name] = dict(title=title, group=group, order=order, visible=True, shadow=url(f"{name}-shadow.webp"),
                        variations=[url(f"{name}-{i}.webp") for i in range(1, len(options) + 1)],
                        thumbnails=[url(f"{name}-{i}-thumb.jpg") for i in range(1, len(options) + 1)],
                        variationNames=[n for n, _ in options], hotspot=dict(id=name, title=title, visible=True, position=hotspot))

  surface("wall", "Wall colour", "walls", 10, wall_m, FINISHES, lambda c: room(spec, c, FLOORS[0][1]), dict(x=int(base.p(spec["length"] * 0.5, 0)[0]), y=int(base.p(0, 25)[1])))
  surface("floor", "Floor", "floor", 11, floor_m, FLOORS, lambda c: room(spec, FINISHES[0][1], c), dict(x=int(base.W * 0.3), y=int(base.y1 + 120)))

  ref = room(spec, *NEUTRAL)

  def sprite(fname, draw):
    """Render a piece on the neutral room and cut its shadow + colour to the smallest box."""
    w = room(spec, *NEUTRAL); hot = draw(w); a = w.alpha
    shadow = np.clip(w.img.mean(-1) / np.maximum(ref.img.mean(-1), 1e-3), 0, 1)
    shadow = np.where(shadow > 0.985, 1.0, shadow) * (1 - a)
    ys, xs = np.nonzero((shadow < 0.999) | (a > 0.003))
    x0, y0 = max(int(xs.min()) - 4, 0), max(int(ys.min()) - 4, 0); x1, y1 = min(int(xs.max()) + 5, w.W), min(int(ys.max()) + 5, w.H)
    colour = grade(w.img, w) * a[..., None]
    save(np.repeat(shadow[y0:y1, x0:x1, None], 3, -1), os.path.join(out, f"{fname}-shadow.webp"), lossless=True)
    save(colour[y0:y1, x0:x1], os.path.join(out, f"{fname}-1.webp"), lossless=True)
    ay, ax = np.nonzero(a > 0.5)
    rgb = grade(w.img, w); bg = np.array([246, 242, 236], np.float32) / 255
    thumb(rgb * a[..., None] + bg * (1 - a[..., None]), (int(ax.min()), int(ay.min()), int(ax.max()) + 1, int(ay.max()) + 1), os.path.join(out, f"{fname}-thumb.jpg"))
    return hot, dict(x=x0, y=y0, w=x1 - x0, h=y1 - y0)

  for order, it in enumerate(spec["items"], 20):
    if it["products"]:
      products, hot = [], None
      for pid, pname, draw in it["products"]:
        h, box = sprite(pid, draw); hot = hot or h
        products.append(dict(id=pid, name=pname, poster=url(f"{pid}-thumb.jpg"),
                             materials=[dict(id="as-shown", name="As shown", poster=url(f"{pid}-thumb.jpg"), shadow=url(f"{pid}-shadow.webp"),
                                             variations=[url(f"{pid}-1.webp")], box=box)]))
      layers[it["name"]] = dict(title=it["title"], group="product-layer", order=order, visible=True, products=products,
                                hotspot=dict(id=it["name"], title=it["title"], visible=True, position=hot))
    else:
      hot, box = sprite(it["name"], it["draw"])
      layers[it["name"]] = dict(title=it["title"], group=it["group"], order=order, visible=True, shadow=url(f"{it['name']}-shadow.webp"),
                                variations=[url(f"{it['name']}-1.webp")], thumbnails=[url(f"{it['name']}-thumb.jpg")], box=box,
                                hotspot=dict(id=it["name"], title=it["title"], visible=True, position=hot))
  manifest = dict(background="background.webp", imageSize=dict(width=base.W, height=base.H),
                  cameraKey="wall-std-v1-L500", wall=key.upper(), role=spec["role"], lengthCm=spec["length"],
                  enhancements=dict(brightness=100, contrast=100, saturation=100), layers=layers)
  json.dump(manifest, open(os.path.join(out, "manifest.json"), "w"), indent=1)
  print(key, base.W, base.H, len(layers), "layers")


for key in (sys.argv[1:] or WALLS):
  build(key, WALLS[key])
