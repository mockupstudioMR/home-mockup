"""
Sample floor plans with known answers, for testing public/py/floorplan.py.

Each plan is drawn like an architect's plan: thick walls, door gaps with a leaf and a swing arc, window gaps
with thin glazing lines, neighbouring rooms, furniture outlines, room labels, dimension lines with text, and
optionally a scan look (tilt, blur, grain, JPEG). The answer — the room's inside size and every opening on its
walls — is saved next to each image.

Run:  python3 qa/floorplan/make_plans.py [out dir] [count]
"""
import json
import math
import os
import random
import sys

import cv2
import numpy as np

PX_PER_M = (60, 110)


def draw_door(img, wall, x0, y0, x1, y1, a, b, t, inward, swing_ok=True):
    """Clear a gap [a, b] in a wall and draw the leaf + swing arc into the room."""
    w = b - a
    if wall in "AC":
        ys = (y0 - t, y0) if wall == "A" else (y1, y1 + t)
        cv2.rectangle(img, (x0 + a, ys[0]), (x0 + b, ys[1] - 1), 255, -1)
        hinge_x = x0 + a
        hy = y0 if wall == "A" else y1
        d = 1 if wall == "A" else -1
        if swing_ok:
            cv2.line(img, (hinge_x, hy), (hinge_x, hy + d * w), 0, 2)
            cv2.ellipse(img, (hinge_x, hy), (w, w), 0, 0 if d == 1 else 270, 90 if d == 1 else 360, 0, 1)
    else:
        xs = (x0 - t, x0) if wall == "D" else (x1, x1 + t)
        cv2.rectangle(img, (xs[0], y0 + a), (xs[1] - 1, y0 + b), 255, -1)
        hinge_y = y0 + a
        hx = x0 if wall == "D" else x1
        d = 1 if wall == "D" else -1
        if swing_ok:
            cv2.line(img, (hx, hinge_y), (hx + d * w, hinge_y), 0, 2)
            cv2.ellipse(img, (hx, hinge_y), (w, w), 0, 0 if d == 1 else 90, 90 if d == 1 else 180, 0, 1)


def draw_window(img, wall, x0, y0, x1, y1, a, b, t):
    """Clear a gap and draw three thin glazing lines along the wall."""
    if wall in "AC":
        ys = (y0 - t, y0) if wall == "A" else (y1, y1 + t)
        cv2.rectangle(img, (x0 + a, ys[0]), (x0 + b, ys[1] - 1), 255, -1)
        for f in (0.15, 0.5, 0.85):
            y = int(ys[0] + f * (t - 1))
            cv2.line(img, (x0 + a, y), (x0 + b, y), 0, 1)
        cv2.line(img, (x0 + a, ys[0]), (x0 + a, ys[1] - 1), 0, 1)
        cv2.line(img, (x0 + b, ys[0]), (x0 + b, ys[1] - 1), 0, 1)
    else:
        xs = (x0 - t, x0) if wall == "D" else (x1, x1 + t)
        cv2.rectangle(img, (xs[0], y0 + a), (xs[1] - 1, y0 + b), 255, -1)
        for f in (0.15, 0.5, 0.85):
            x = int(xs[0] + f * (t - 1))
            cv2.line(img, (x, y0 + a), (x, y0 + b), 0, 1)
        cv2.line(img, (xs[0], y0 + a), (xs[1] - 1, y0 + a), 0, 1)
        cv2.line(img, (xs[0], y0 + b), (xs[1] - 1, y0 + b), 0, 1)


STYLES = ["solid", "grey", "outline", "hatched"]


def restyle(img, t, style, rnd):
    """Draw the walls the way different plans do: solid black, grey fill, a double outline, or hatched."""
    if style == "solid":
        return img
    wall = cv2.morphologyEx((img < 128).astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (max(3, int(t * 0.6)),) * 2))
    out = img.copy()
    if style == "grey":
        out[wall > 0] = rnd.randint(150, 200)
        return out
    out[wall > 0] = 255
    edge = cv2.morphologyEx(wall, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8))
    out[edge > 0] = 0
    if style == "hatched":
        hatch = np.zeros_like(img)
        step = max(5, t // 3)
        for k in range(-img.shape[0], img.shape[1], step):
            cv2.line(hatch, (k, 0), (k + img.shape[0], img.shape[0]), 1, 1)
        out[(hatch > 0) & (wall > 0)] = 0
    return out


def make(seed, scan=False, style=None):
    rnd = random.Random(seed)
    style = style or STYLES[seed % len(STYLES)]
    ppm = rnd.uniform(*PX_PER_M)
    wm, lm = rnd.uniform(2.6, 6.5), rnd.uniform(2.6, 6.5)
    t = max(6, int(round(rnd.uniform(0.12, 0.25) * ppm)))
    W, H = int(wm * ppm), int(lm * ppm)
    margin = int(2.6 * ppm)
    side_room = int(rnd.uniform(1.8, 3.0) * ppm)
    img_w = W + 2 * margin + side_room + 2 * t
    img_h = H + 2 * margin + 2 * t
    img = np.full((img_h, img_w), 255, np.uint8)
    x0, y0 = margin + t, margin + t              # inside top-left of the room
    x1, y1 = x0 + W, y0 + H
    # the room's walls + a neighbouring room on the right
    cv2.rectangle(img, (x0 - t, y0 - t), (x1 + t - 1, y1 + t - 1), 0, -1)
    cv2.rectangle(img, (x0, y0), (x1 - 1, y1 - 1), 255, -1)
    nx1 = x1 + t + side_room
    cv2.rectangle(img, (x1, y0 - t), (nx1 + t - 1, y0 - 1), 0, -1)
    cv2.rectangle(img, (x1, y1), (nx1 + t - 1, y1 + t - 1), 0, -1)
    cv2.rectangle(img, (nx1, y0 - t), (nx1 + t - 1, y1 + t - 1), 0, -1)

    openings = []
    occupied = {k: [] for k in "ABCD"}

    def free_spot(wall, width):
        L = W if wall in "AC" else H
        for _ in range(50):
            a = rnd.randint(int(0.06 * L), max(int(0.06 * L) + 1, int(L - width - 0.06 * L)))
            b = a + width
            if b >= L - 4:
                continue
            if all(b + t < oa or a - t > ob for oa, ob in occupied[wall]):
                occupied[wall].append((a, b))
                return a, b, L
        return None

    door_m = rnd.uniform(0.8, 0.95)
    for wall in rnd.sample("ABCD", rnd.randint(1, 2)):
        spot = free_spot(wall, int(door_m * ppm))
        if spot:
            a, b, L = spot
            draw_door(img, wall, x0, y0, x1, y1, a, b, t, True, swing_ok=rnd.random() > 0.15)
            openings.append({"type": "door", "wall": wall, "pos": round(100 * (a + b) / 2 / L, 1)})
    for wall in rnd.sample("ABCD", rnd.randint(1, 3)):
        spot = free_spot(wall, int(rnd.uniform(0.9, 2.0) * ppm))
        if spot:
            a, b, L = spot
            draw_window(img, wall, x0, y0, x1, y1, a, b, t)
            openings.append({"type": "window", "wall": wall, "pos": round(100 * (a + b) / 2 / L, 1)})

    # furniture outlines (thin) inside, some touching walls, like a real plan
    for _ in range(rnd.randint(1, 4)):
        fw, fh = int(rnd.uniform(0.5, 2.2) * ppm), int(rnd.uniform(0.4, 1.0) * ppm)
        fx = rnd.randint(x0 + 2, max(x0 + 3, x1 - fw - 2))
        fy = rnd.randint(y0 + 2, max(y0 + 3, y1 - fh - 2))
        cv2.rectangle(img, (fx, fy), (fx + fw, fy + fh), 0, 1)
    # label + area
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(img, rnd.choice(["Living", "Bedroom", "Wohnen", "Kitchen", "Office"]), (x0 + W // 3, y0 + H // 2), font, ppm / 90, 0, 1, cv2.LINE_AA)
    cv2.putText(img, f"{wm * lm:.1f} m2", (x0 + W // 3, y0 + H // 2 + int(ppm * 0.4)), font, ppm / 120, 0, 1, cv2.LINE_AA)
    # dimension lines outside, with ticks and the length
    dy = y0 - t - int(0.8 * ppm)
    cv2.line(img, (x0, dy), (x1, dy), 0, 1)
    for xx in (x0, x1):
        cv2.line(img, (xx - 6, dy + 6), (xx + 6, dy - 6), 0, 1)
    cv2.putText(img, f"{wm:.2f}", ((x0 + x1) // 2 - 30, dy - 8), font, ppm / 140, 0, 1, cv2.LINE_AA)
    dx = x0 - t - int(0.8 * ppm)
    cv2.line(img, (dx, y0), (dx, y1), 0, 1)

    img = restyle(img, t, style, rnd)
    centre = ((x0 + x1) / 2 / img_w, (y0 + y1) / 2 / img_h)   # where the person would tap their room
    tilt = 0.0
    if scan:
        tilt = rnd.uniform(-3, 3)
        m = cv2.getRotationMatrix2D((img_w / 2, img_h / 2), tilt, 1.0)
        img = cv2.warpAffine(img, m, (img_w, img_h), borderValue=255)
        img = cv2.GaussianBlur(img, (3, 3), 0.8)
        noise = np.random.default_rng(seed).normal(0, 9, img.shape)
        img = np.clip(img.astype(float) * rnd.uniform(0.85, 1.0) + rnd.uniform(0, 25) + noise, 0, 255).astype(np.uint8)
    truth = {"width_m": round(W / ppm, 3), "length_m": round(H / ppm, 3), "ratio": round(W / H, 4), "wall_px": t,
             "door_m": round(door_m, 3), "openings": openings, "tilt_deg": round(tilt, 2), "scan": scan, "style": style,
             "tap": [round(centre[0], 4), round(centre[1], 4)]}
    return img, truth


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "qa/floorplan/samples"
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 40
    os.makedirs(out, exist_ok=True)
    for i in range(n):
        img, truth = make(i, scan=(i // 4) % 2 == 1)
        cv2.imwrite(os.path.join(out, f"plan-{i:02d}.jpg"), img, [cv2.IMWRITE_JPEG_QUALITY, 80 if truth["scan"] else 95])
        with open(os.path.join(out, f"plan-{i:02d}.json"), "w") as f:
            json.dump(truth, f, indent=1)
    print(f"{n} plans in {out}")
