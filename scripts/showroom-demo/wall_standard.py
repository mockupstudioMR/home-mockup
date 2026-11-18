"""The wall standard (camera key wall-std-v1-L500): every wall rendered by one recipe.

Camera  : straight on, centred on the wall, eye height 140 cm, one-point perspective.
Canvas  : 1920 x 1080 (Generator PRO's default) for walls up to 5 m.
Scale   : back wall at 1 cm = 3 px, so outline boxes map straight onto the picture.
Frame   : 80 px of ceiling, 810 px of wall (2.70 m), 190 px of floor; side walls fill the rest of the width.
Light   : daylight from the window wall on the plan + soft ambient; corners darkened; contact and cast shadows.
Finish  : colour grade, slight softening and film grain so every part sits in one photo.
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

PX, T, F, EYE = 3, 80, 190, 140
CANVAS_W = 1920
PLASTER = None


def load_plaster(path):
  """A real plaster photo patch, as relative lightness around 1 (6× up-scaled, softened)."""
  global PLASTER
  im = Image.open(path).convert("L"); im = im.resize((im.width * 6, im.height * 6), Image.BICUBIC).filter(ImageFilter.GaussianBlur(2.5))
  a = np.asarray(im).astype(np.float32); a = a / a.mean()
  PLASTER = np.clip(1 + (a - 1) * 0.7, 0.85, 1.15)
WALL_H = 270
rng = np.random.default_rng(11)


def noise(h, w, scale, octaves=4, seed=None):
  g = np.random.default_rng(seed) if seed is not None else rng
  acc = np.zeros((h, w), np.float32); amp = 1.0; tot = 0.0
  for o in range(octaves):
    s = max(2, int(scale / (2 ** o)))
    small = g.random((h // s + 3, w // s + 3)).astype(np.float32)
    big = np.asarray(Image.fromarray((small * 255).astype(np.uint8)).resize(((w // s + 3) * s, (h // s + 3) * s), Image.BICUBIC), np.float32)[:h, :w] / 255
    acc += big * amp; tot += amp; amp *= 0.5
  return acc / tot


def hexrgb(h):
  h = h.lstrip("#"); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255


class Wall:
  def __init__(self, length, light="front", finish="#CDBFAE", side_finish=None, floor="#5C3E2A"):
    self.L = length
    self.W = CANVAS_W
    self.H = T + WALL_H * PX + F
    self.x0 = (CANVAS_W - length * PX) // 2         # back wall in the image, centred
    self.x1 = self.x0 + length * PX
    self.y0, self.y1 = T, T + WALL_H * PX
    self.cx = (self.x0 + self.x1) / 2
    self.yh = self.y1 - EYE * PX                   # horizon
    self.light = light                             # "left" | "right" | "front" | "back" (window in this wall)
    self.finish, self.side_finish, self.floor_c = hexrgb(finish), hexrgb(side_finish or finish), hexrgb(floor)
    self.img = np.zeros((self.H, self.W, 3), np.float32)
    self.yy, self.xx = np.mgrid[0:self.H, 0:self.W].astype(np.float32)
    self.later = []

  # wall coordinates (cm on the back wall, y from the ceiling) to image px
  def p(self, x, y): return (self.x0 + x * PX, self.y0 + y * PX)

  def plaster(self, colour, h, w, seed):
    n = noise(h, w, 220, 5, seed)[..., None]; fine = noise(h, w, 10, 2, seed + 1)[..., None]; trow = noise(h, w, 60, 3, seed + 2)[..., None]
    base = colour * (0.9 + 0.13 * n) * (0.98 + 0.04 * fine) * (0.97 + 0.05 * trow)
    if PLASTER is not None:
      ph, pw = PLASTER.shape[:2]
      tile = np.concatenate([PLASTER, PLASTER[:, ::-1]], 1); tile = np.concatenate([tile, tile[::-1]], 0)
      reps = (h // tile.shape[0] + 2, w // tile.shape[1] + 2)
      big = np.tile(tile, (reps[0], reps[1]))
      off = (seed * 37) % tile.shape[0]
      big = big[off:off + h, :w]
      base = base * (0.75 + 0.25 * big[..., None])
    return base

  def shell(self):
    H, W = self.H, self.W
    xx, yy = self.xx, self.yy
    # back wall
    self.img[:] = self.plaster(self.finish, H, W, 3)
    # perspective factor of the floor / ceiling at row y
    kf = (yy - self.yh) / (self.y1 - self.yh)
    kc = (self.yh - yy) / (self.yh - self.y0)
    floor = (yy >= self.y1)
    ceil = (yy < self.y0)
    # x on the back wall plane that row y / column x projects from
    with np.errstate(divide="ignore", invalid="ignore"):
      uf = self.cx + (xx - self.cx) / np.where(floor, kf, 1)
      uc = self.cx + (xx - self.cx) / np.where(ceil, kc, 1)
    left_side = ((yy >= self.y0) & (yy < self.y1) & (xx < self.x0)) | (floor & (uf < self.x0)) | (ceil & (uc < self.x0))
    right_side = ((yy >= self.y0) & (yy < self.y1) & (xx >= self.x1)) | (floor & (uf >= self.x1)) | (ceil & (uc >= self.x1))
    # side walls: same plaster, turned away from the light
    side = self.plaster(self.side_finish, H, W, 9)
    self.img = np.where((left_side | right_side)[..., None], side * 0.86, self.img)
    # ceiling: warm white, a touch darker at the back
    cw = hexrgb("#F2EDE6") * (0.92 + 0.06 * noise(H, W, 300, 3, 5)[..., None])
    self.img = np.where((ceil & ~left_side & ~right_side)[..., None], cw * np.clip(0.9 + 0.1 * (self.y0 - yy) / self.y0, 0.85, 1)[..., None], self.img)
    # floor: planks running towards the camera, in perspective
    with np.errstate(divide="ignore", invalid="ignore"):
      ucm = (uf - self.x0) / PX                           # cm along the wall
      depth = np.where(floor, (1 / np.maximum(kf, 1e-3)), 1)  # 1 at the wall, smaller towards the camera
      zcm = np.where(floor, (1 - depth) * 900, 0)            # pseudo distance from the wall
    plank = np.floor(ucm / 19)
    seed_col = (np.sin(plank * 12.9898) * 43758.5453) % 1
    joint = np.floor((zcm + (seed_col * 260)) / 260)
    tone = 0.9 + 0.12 * ((np.sin((plank * 7.1 + joint * 3.3)) * 0.5 + 0.5))
    # grain runs along the planks (towards the camera): stretch noise in depth
    g1 = noise(H, W, 3, 2, 21); g2 = noise(H, W, 40, 3, 22)
    grain = 0.55 * g1 + 0.45 * g2
    wood = self.floor_c * (tone * (0.86 + 0.24 * grain))[..., None]
    seam = (np.abs((ucm / 19) - np.round(ucm / 19)) * 19 * PX * np.maximum(kf, 1) < 1.1) | (np.abs(((zcm + seed_col * 260) / 260) - np.round((zcm + seed_col * 260) / 260)) < 0.006)
    wood = np.where(seam[..., None], wood * 0.72, wood)
    # satin finish: a soft, blurred reflection of the bottom of the wall
    refl_h = 120
    strip = self.img[int(self.y1) - refl_h:int(self.y1)][::-1]
    refl = np.zeros_like(self.img); refl[int(self.y1):int(self.y1) + refl_h] = strip
    refl = np.asarray(Image.fromarray((np.clip(refl, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255
    fade = np.clip(1 - (yy - self.y1) / refl_h, 0, 1)[..., None] * 0.22
    wood = wood * (1 - fade) + refl * fade
    self.img = np.where((floor & ~left_side & ~right_side)[..., None], wood, self.img)
    self.masks = dict(floor=floor & ~left_side & ~right_side, ceil=ceil & ~left_side & ~right_side, left=left_side, right=right_side,
                      back=(yy >= self.y0) & (yy < self.y1) & (xx >= self.x0) & (xx < self.x1))
    # cornice and skirting on the back wall
    d = self.draw()
    d.rectangle([self.x0, self.y0, self.x1, self.y0 + 5 * PX], fill=(244, 240, 233))
    d.line([self.x0, self.y0 + 5 * PX, self.x1, self.y0 + 5 * PX], fill=(200, 192, 182), width=2)
    d.rectangle([self.x0, self.y1 - 10 * PX, self.x1, self.y1], fill=(238, 232, 222))
    d.line([self.x0, self.y1 - 10 * PX, self.x1, self.y1 - 10 * PX], fill=(196, 186, 172), width=2)
    self.commit()

  # drawing via PIL on the current image
  def draw(self):
    self._pil = Image.fromarray(np.clip(self.img * 255, 0, 255).astype(np.uint8)); return ImageDraw.Draw(self._pil, "RGBA")

  def commit(self):
    self.img = np.asarray(self._pil).astype(np.float32) / 255

  def paste(self, rgba, x, y):
    im = Image.fromarray(np.clip(self.img * 255, 0, 255).astype(np.uint8)).convert("RGBA")
    im.alpha_composite(rgba, (int(x), int(y)))
    self.img = np.asarray(im.convert("RGB")).astype(np.float32) / 255

  def shade(self, mask, amount, blur, colour=(0.12, 0.09, 0.08)):
    m = Image.fromarray((np.clip(mask, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(blur))
    a = np.asarray(m).astype(np.float32)[..., None] / 255 * amount
    self.img = self.img * (1 - a) + np.array(colour, np.float32) * a

  def glow(self, mask, amount, blur, colour=(1.0, 0.86, 0.62)):
    m = Image.fromarray((np.clip(mask, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(blur))
    a = np.asarray(m).astype(np.float32)[..., None] / 255 * amount
    self.img = 1 - (1 - self.img) * (1 - a * np.array(colour, np.float32))

  def ellipse_mask(self, box):
    m = Image.new("L", (self.W, self.H), 0); ImageDraw.Draw(m).ellipse(box, fill=255); return np.asarray(m).astype(np.float32) / 255

  def rect_mask(self, box, r=0):
    m = Image.new("L", (self.W, self.H), 0); ImageDraw.Draw(m).rounded_rectangle(box, r, fill=255); return np.asarray(m).astype(np.float32) / 255

  def light_pass(self):
    """Daylight from the window on the plan, darker corners that follow the real edges
    (the side walls meet the floor on a diagonal), skirting along the side walls, floor bounce."""
    xx, yy = self.xx, self.yy
    u = (xx - self.x0) / (self.x1 - self.x0)
    g = {"left": 1.10 - 0.22 * u, "right": 0.88 + 0.22 * u, "front": 1.02 - 0.05 * np.abs(u - 0.5), "back": 0.9 + 0.04 * u}[self.light]
    self.img *= np.clip(g, 0.7, 1.2)[..., None]
    self.img *= (1 - 0.1 * np.clip((yy - self.y0) / (self.y1 - self.y0), 0, 1) ** 2)[..., None]
    m = self.masks
    side = (m["left"] | m["right"]).astype(np.float32); fl = m["floor"].astype(np.float32)
    ce = m["ceil"].astype(np.float32); back = m["back"].astype(np.float32)
    grow = lambda a, r: np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(r))).astype(np.float32) / 255
    edges = np.clip(grow(side, 3) * (back + fl + ce) + grow(fl, 3) * (back + side) + 0.6 * grow(ce, 3) * back, 0, 1)
    self.shade(edges, 0.55, 45); self.shade(edges, 0.3, 10)
    sk = np.clip(grow(fl, 61) - fl, 0, 1) * side
    self.img = self.img * (1 - sk[..., None]) + np.array([0.9, 0.88, 0.84], np.float32) * 0.86 * sk[..., None]
    self.shade(np.clip(grow(fl, 63) - grow(fl, 59), 0, 1) * side, 0.35, 1.5)
    bleed = np.clip(1 - (self.y1 - yy) / 135, 0, 1) * ((yy < self.y1) & (yy > self.y0)) * back
    self.img = self.img * (1 - 0.12 * bleed[..., None]) + (self.floor_c * 1.2)[None, None] * 0.12 * bleed[..., None]

  def finish_pass(self):
    # warm grade, vignette, slight softening, grain
    self.img = self.img ** 0.97 * np.array([1.02, 1.0, 0.96], np.float32)
    vx = (self.xx - self.W / 2) / self.W; vy = (self.yy - self.H * 0.45) / self.H
    self.img *= (1 - 0.32 * (vx ** 2 + vy ** 2) * 2)[..., None]
    im = Image.fromarray(np.clip(self.img * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.45))
    a = np.asarray(im).astype(np.float32) / 255
    a += (rng.standard_normal(a.shape[:2]).astype(np.float32) * 0.012)[..., None]
    self.img = np.clip(a, 0, 1)

  def save(self, path):
    Image.fromarray(np.clip(self.img * 255, 0, 255).astype(np.uint8)).save(path, quality=90)


# ---------------------------------------------------------------- materials for pieces
def fabric(h, w, colour, seed, sheen=0.18):
  n = noise(h, w, 30, 3, seed); fine = noise(h, w, 4, 1, seed + 3)
  return hexrgb(colour) * (0.86 + 0.18 * n + 0.08 * fine)[..., None], n


def shade_box(rgb, top_light=0.25, side=0.18, rim=0.35):
  h, w = rgb.shape[:2]
  yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
  v = 1 + top_light * (0.5 - yy / max(h, 1))
  u = 1 - side * np.abs(xx / max(w, 1) - 0.45) * 2
  e = np.minimum(np.minimum(xx, w - 1 - xx), np.minimum(yy, h - 1 - yy))
  r = 1 - rim * np.exp(-e / 6)
  return rgb * (v * u * r)[..., None]


def to_rgba(rgb, alpha):
  a = np.dstack([np.clip(rgb, 0, 1), np.clip(alpha, 0, 1)])
  return Image.fromarray((a * 255).astype(np.uint8), "RGBA")


def rounded_alpha(h, w, r):
  m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], r, fill=255)
  return np.asarray(m.filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32) / 255


def sofa(w, h, colour="#5E2F52"):
  """Curved-back velvet sofa, front view: back, arms, two seat cushions, brass legs."""
  W_, H_ = w, h
  out = Image.new("RGBA", (W_, H_), (0, 0, 0, 0))
  leg = int(H_ * 0.1)
  body_h = H_ - leg
  def part(x, y, pw, ph, r, seed, light=0.25, c=colour, rim=0.4):
    rgb, _ = fabric(ph, pw, c, seed)
    rgb = shade_box(rgb, light, 0.15, rim)
    # velvet sheen across the top
    yy = np.arange(ph, dtype=np.float32)[:, None]
    rgb = rgb * (1 + 0.22 * np.exp(-((yy - ph * 0.12) / (ph * 0.12)) ** 2))[..., None]
    out.alpha_composite(to_rgba(rgb, rounded_alpha(ph, pw, r)), (x, y))
  part(0, 0, W_, int(body_h * 0.62), int(body_h * 0.3), 1, 0.35)                        # curved back
  arm_w = int(W_ * 0.12)
  part(0, int(body_h * 0.28), arm_w, int(body_h * 0.72), int(arm_w * 0.45), 2, 0.2)       # arms
  part(W_ - arm_w, int(body_h * 0.28), arm_w, int(body_h * 0.72), int(arm_w * 0.45), 3, 0.2)
  part(arm_w - 6, int(body_h * 0.62), W_ - 2 * arm_w + 12, int(body_h * 0.38), 10, 4, 0.1)  # base
  cw = (W_ - 2 * arm_w) // 2
  for i in range(2):
    part(arm_w + i * cw + 2, int(body_h * 0.5), cw - 4, int(body_h * 0.24), 14, 5 + i, 0.4, rim=0.5)  # seat cushions
  d = ImageDraw.Draw(out)
  for x in (arm_w + 8, W_ - arm_w - 14):
    d.polygon([(x, body_h), (x + 8, body_h), (x + 6, H_), (x + 2, H_)], fill=(176, 141, 87, 255))
  return out


def piano(w, h):
  """Upright piano in dark walnut, keys and music desk."""
  rgb = hexrgb("#3A2418") * (0.85 + 0.25 * noise(h, w, 8, 2, 31))[..., None]
  rgb = shade_box(rgb, 0.3, 0.2, 0.3)
  yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
  rgb = rgb * (1 + 0.35 * np.exp(-((xx - w * 0.3) / (w * 0.05)) ** 2))[..., None]   # varnish highlight
  out = to_rgba(rgb, rounded_alpha(h, w, 4))
  d = ImageDraw.Draw(out)
  ky = int(h * 0.46)
  d.rectangle([4, ky - 6, w - 5, ky], fill=(30, 18, 12, 255))
  d.rectangle([6, ky, w - 7, ky + 14], fill=(240, 236, 226, 255))
  kw = (w - 12) / 52
  for i in range(52):
    if i % 7 not in (2, 6):
      x = 6 + (i + 0.65) * kw; d.rectangle([x, ky, x + kw * 0.6, ky + 8], fill=(20, 16, 14, 255))
  d.rectangle([4, ky + 14, w - 5, ky + 26], fill=(46, 30, 20, 255))
  d.rectangle([int(w * 0.25), int(h * 0.12), int(w * 0.75), int(h * 0.3)], outline=(70, 46, 30, 255), width=2)
  for x in (10, w - 18):
    d.rectangle([x, h - 18, x + 8, h], fill=(30, 18, 12, 255))
  return out


def shelving(w, h, seed=41):
  """Walnut shelving with books, vases and a plant."""
  r = np.random.default_rng(seed)
  rgb = hexrgb("#4A3022") * (0.85 + 0.25 * noise(h, w, 10, 2, seed))[..., None]
  out = to_rgba(shade_box(rgb, 0.2, 0.1, 0.25), np.ones((h, w), np.float32))
  d = ImageDraw.Draw(out)
  shelves = 5; t = 8; inner = (h - t) / shelves
  for i in range(shelves):
    y0 = int(t + i * inner); y1 = int(t + (i + 1) * inner - t)
    d.rectangle([t, y0, w - t, y1], fill=(46, 32, 24, 255))             # back of the bay, in shadow
    x = t + 4
    while x < w - t - 10:
      kind = r.random()
      if kind < 0.65:
        bw = int(r.integers(6, 13)); bh = int((y1 - y0) * r.uniform(0.55, 0.9))
        c = [(120, 50, 60), (60, 80, 70), (170, 140, 90), (90, 70, 110), (200, 190, 170), (140, 90, 60)][int(r.integers(0, 6))]
        d.rectangle([x, y1 - bh, x + bw, y1], fill=(*c, 255)); d.line([x + bw, y1 - bh, x + bw, y1], fill=(0, 0, 0, 90))
        x += bw + 1
      elif kind < 0.82:
        vw = int(r.integers(14, 22)); vh = int((y1 - y0) * r.uniform(0.4, 0.7))
        c = [(176, 141, 87), (230, 222, 205), (62, 90, 51)][int(r.integers(0, 3))]
        d.ellipse([x, y1 - vh, x + vw, y1 + 4], fill=(*c, 255)); x += vw + 6
      else:
        x += int(r.integers(10, 20))
  # plant on the top shelf
  d.ellipse([w * 0.55, t - 2, w * 0.95, inner * 0.9], fill=(58, 92, 52, 255))
  d.ellipse([w * 0.62, t + 6, w * 0.88, inner * 0.7], fill=(80, 120, 66, 255))
  d.rectangle([w * 0.65, inner * 0.62, w * 0.85, inner - t], fill=(176, 141, 87, 255))
  return out.filter(ImageFilter.GaussianBlur(0.4))


def art(w, h, seed=5, frame=(28, 22, 20)):
  """Framed abstract print in the moodboard colours."""
  r = np.random.default_rng(seed)
  im = Image.new("RGBA", (w, h), (*frame, 255)); d = ImageDraw.Draw(im)
  m = 7; d.rectangle([m, m, w - m, h - m], fill=(246, 240, 230, 255))
  m2 = m + 10
  cols = [(94, 66, 104), (176, 141, 87), (62, 90, 51), (180, 87, 46), (205, 180, 160)]
  for i in range(6):
    c = cols[int(r.integers(0, len(cols)))]; x = r.uniform(m2, w - m2 - 20); y = r.uniform(m2, h - m2 - 20); s = r.uniform(18, min(w, h) * 0.45)
    if r.random() < 0.5: d.ellipse([x, y, min(x + s, w - m2), min(y + s, h - m2)], fill=(*c, 230))
    else: d.rectangle([x, y, min(x + s * 1.3, w - m2), min(y + s * 0.6, h - m2)], fill=(*c, 230))
  return im


def floor_lamp(w, h):
  im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
  cx = w // 2
  d.rectangle([cx - 2, int(h * 0.3), cx + 2, h - 6], fill=(176, 141, 87, 255))
  d.ellipse([cx - 22, h - 10, cx + 22, h], fill=(150, 116, 64, 255))
  d.polygon([(cx - 26, 6), (cx + 26, 6), (cx + 38, int(h * 0.3)), (cx - 38, int(h * 0.3))], fill=(236, 222, 196, 255), outline=(200, 184, 156, 255))
  return im


def radiator(w, h):
  im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
  d.rounded_rectangle([0, 0, w - 1, h - 1], 5, fill=(236, 233, 228, 255))
  for x in range(8, w - 6, 12):
    d.rectangle([x, 4, x + 6, h - 5], fill=(214, 210, 204, 255)); d.line([x + 6, 4, x + 6, h - 5], fill=(190, 186, 180, 255))
  return im


def side_table(w, h):
  im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
  d.ellipse([0, 0, w - 1, 14], fill=(120, 80, 52, 255)); d.rectangle([0, 6, w - 1, 12], fill=(100, 66, 44, 255))
  d.rectangle([w // 2 - 3, 12, w // 2 + 3, h - 6], fill=(176, 141, 87, 255)); d.ellipse([w // 2 - 18, h - 8, w // 2 + 18, h], fill=(150, 116, 64, 255))
  d.ellipse([w * 0.3, -18, w * 0.62, 6], fill=(62, 90, 51, 255))
  return im


def plate(w):
  im = Image.new("RGBA", (w, w), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
  d.rounded_rectangle([0, 0, w - 1, w - 1], 4, fill=(240, 236, 228, 255), outline=(190, 182, 170, 255))
  d.ellipse([w * 0.3, w * 0.3, w * 0.7, w * 0.7], fill=(160, 150, 138, 255)); return im
