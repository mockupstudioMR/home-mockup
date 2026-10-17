"""
Floor-plan reader: measures a room on a plan image with computer vision, instead of asking an AI to estimate it.

Runs the same in the browser (Pyodide + OpenCV, see src/journey/planReader.ts) and on a computer
(`python3 public/py/floorplan.py plan.jpg`). Pure geometry, no AI:

1. straighten the plan (small scan tilts),
2. find the walls: the thick dark strokes (furniture, text and dimension lines are thin, so they drop out),
3. close door and window gaps along each wall, so every room becomes an enclosed white area,
4. pick the room (the largest, or the one the person tapped), measure its inside edges,
5. walk along each of its four walls and read every gap: a window (thin parallel lines across the gap)
   or a door (an opening, usually with its swing arc inside the room),
6. estimate the scale from the doors (a door is about 0.85 m wide), to be confirmed with one real measurement.

Walls follow the journey's names: A top, B right, C bottom, D left. Positions are 0–100 along the wall,
A and C left to right, B and D top to bottom. Width = wall A, length = wall B.
"""
import json
import math

import cv2
import numpy as np

MAX_SIDE = 1600          # plans are resized so the longer side is about this many pixels
DOOR_M = 0.85            # a typical interior door leaf, for the scale estimate


def _load(data):
    """Bytes or a path → grayscale image, resized to MAX_SIDE."""
    if isinstance(data, (bytes, bytearray, memoryview)):
        arr = np.frombuffer(bytes(data), dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
    else:
        img = cv2.imread(str(data), cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError("This file isn't an image we can read. Try a JPG or PNG of the plan.")
    h, w = img.shape
    k = MAX_SIDE / max(h, w)
    if abs(k - 1) > 0.05:
        img = cv2.resize(img, (round(w * k), round(h * k)), interpolation=cv2.INTER_AREA if k < 1 else cv2.INTER_CUBIC)
    return img


def _ink(gray):
    """Dark strokes as 1, paper as 0. Anything clearly darker than the paper counts, so grey-filled walls do too."""
    blur = cv2.GaussianBlur(gray, (3, 3), 0)
    otsu, _ = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    paper = float(np.percentile(blur, 90))
    thr = max(otsu, paper - 45) if paper - 45 > otsu else otsu
    return (blur < thr).astype(np.uint8)


def _fill_thin(ink):
    """Walls drawn as a double outline or hatched are hollow: fill every small enclosed strip of paper
    narrower than a wall, so they read like solid walls. Rooms are far wider and stay paper."""
    h, w = ink.shape
    paper = (1 - ink).astype(np.uint8)
    widest = 0.025 * max(h, w)                   # half the thickest wall we expect
    n, labels, stats, _ = cv2.connectedComponentsWithStats(paper, connectivity=4)
    dist = cv2.distanceTransform(paper, cv2.DIST_L2, 3)
    peak = np.zeros(n, np.float32)
    np.maximum.at(peak, labels.ravel(), dist.ravel())
    area = stats[:, cv2.CC_STAT_AREA].astype(np.float32)
    elongated = area / np.maximum(1.0, (2 * peak) ** 2) >= 5      # a wall's hollow is a long thin strip
    small = (peak <= 6) | ((peak <= widest) & elongated)            # hatch pieces are tiny; rooms are neither
    small[0] = False
    # never fill what touches the image edge (the outside)
    edge = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    small[edge] = False
    return np.where(small[labels], 1, ink).astype(np.uint8)


def _deskew(gray):
    """Rotate so walls run horizontal and vertical. Plans are drawn square; scans tilt a few degrees."""
    ink = _ink(gray)
    edges = cv2.Canny(ink * 255, 50, 150)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 720, threshold=120, minLineLength=gray.shape[1] // 8, maxLineGap=5)
    if lines is None:
        return gray, 0.0
    angles, weights = [], []
    for x1, y1, x2, y2 in np.asarray(lines).reshape(-1, 4):
        a = math.degrees(math.atan2(y2 - y1, x2 - x1))
        a = ((a + 45) % 90) - 45           # fold onto (-45, 45]: horizontal and vertical lines agree
        angles.append(a)
        weights.append(math.hypot(x2 - x1, y2 - y1))
    angles, weights = np.array(angles), np.array(weights)
    # weighted median, robust to the odd diagonal line
    order = np.argsort(angles)
    cum = np.cumsum(weights[order])
    angle = float(angles[order][np.searchsorted(cum, cum[-1] / 2)])
    if abs(angle) < 0.15 or abs(angle) > 15:
        return gray, 0.0
    h, w = gray.shape
    m = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
    return cv2.warpAffine(gray, m, (w, h), flags=cv2.INTER_LINEAR, borderValue=255), angle


def _runs(line):
    """Lengths of consecutive 1s in a 1-D 0/1 array."""
    d = np.diff(np.concatenate(([0], line, [0])))
    starts, ends = np.where(d == 1)[0], np.where(d == -1)[0]
    return ends - starts


def _wall_thickness(ink):
    """Most common stroke thickness among the thick strokes. Walls dominate it; text and furniture are 1–4 px."""
    hist = np.zeros(200)
    step = max(1, ink.shape[0] // 400)
    for r in range(0, ink.shape[0], step):
        for n in _runs(ink[r]):
            if 5 <= n < 200:
                hist[n] += n
    for c in range(0, ink.shape[1], step):
        for n in _runs(ink[:, c]):
            if 5 <= n < 200:
                hist[n] += n
    if hist.sum() == 0:
        return 0
    hist = np.convolve(hist, [1, 2, 1], mode="same")
    return int(np.argmax(hist))


def _walls(ink, t):
    """Thick strokes only: an opening with a square about half a wall wide keeps walls and drops thin lines."""
    k = max(3, int(round(t * 0.6)))
    return cv2.morphologyEx(ink, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (k, k)))


def _close_gaps(walls, t, span):
    """Bridge door and window gaps along each wall, so rooms become enclosed. Horizontal walls are closed
    only horizontally and vertical walls only vertically, so a narrow corridor between two walls stays open."""
    long_ = max(int(1.6 * t), 9)
    horiz = cv2.morphologyEx(walls, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (long_, 1)))
    vert = cv2.morphologyEx(walls, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (1, long_)))
    horiz = cv2.morphologyEx(horiz, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (span, 1)))
    vert = cv2.morphologyEx(vert, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (1, span)))
    closed = walls | horiz | vert
    # a wall that stops short of a corner (a corner opening) still has to meet its neighbour
    return cv2.dilate(closed, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3)))


def _rooms(closed, min_area):
    """Enclosed white areas that don't touch the edge of the image (that is the outside)."""
    free = (1 - closed).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(free, connectivity=4)
    h, w = closed.shape
    rooms = []
    for i in range(1, n):
        x, y, bw, bh, area = stats[i]
        if area < min_area or x == 0 or y == 0 or x + bw >= w or y + bh >= h:
            continue
        rooms.append({"label": i, "bbox": [int(x), int(y), int(bw), int(bh)], "area": int(area)})
    rooms.sort(key=lambda r: -r["area"])
    return labels, rooms


def _edges(mask):
    """Inside edges of a room: robust bounds that ignore thin slivers (a door swing that leaked into the mask)."""
    cols = mask.sum(axis=0)
    rows = mask.sum(axis=1)
    def bounds(prof):
        thr = 0.25 * prof.max()
        idx = np.where(prof >= thr)[0]
        return int(idx[0]), int(idx[-1]) + 1
    x0, x1 = bounds(cols)
    y0, y1 = bounds(rows)
    return x0, y0, x1, y1


def _shape(mask, t):
    cnts, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    c = max(cnts, key=cv2.contourArea)
    poly = cv2.approxPolyDP(c, max(2.0, t * 0.8), True)[:, 0, :]
    x, y, w, h = cv2.boundingRect(c)
    fill = cv2.contourArea(c) / float(w * h)
    corners = len(poly)
    if fill > 0.93:
        name = "Rectangular"
    elif corners == 6 and fill > 0.55:
        name = "L-shaped"
    elif corners == 8 and fill > 0.55:
        name = "T- or U-shaped"
    else:
        name = "Irregular"
    return name, poly, fill


def _gaps(present, min_len):
    """Runs of 0 in a 0/1 profile, as (start, end), ignoring ones shorter than min_len."""
    out, start = [], None
    for i, v in enumerate(list(present) + [1]):
        if not v and start is None:
            start = i
        elif v and start is not None:
            if i - start >= min_len:
                out.append((start, i))
            start = None
    return out


def _strip(img, wall, box, depth):
    """Unroll the band outside one wall: row d = d px out from the room's inside edge, column = along the wall
    (A and C left to right, B and D top to bottom). Pixels past the image edge read as paper."""
    x0, y0, x1, y1 = box
    h, w = img.shape
    pad = np.pad(img, depth + 1, mode="constant", constant_values=255 if img.dtype == np.uint8 and img.max() > 1 else 0)
    o = depth + 1
    if wall == "A":
        return pad[o + y0 - 1 - np.arange(depth)[:, None], o + np.arange(x0, x1)[None, :]]
    if wall == "C":
        return pad[o + y1 + np.arange(depth)[:, None], o + np.arange(x0, x1)[None, :]]
    if wall == "D":
        return pad[o + np.arange(y0, y1)[None, :], o + x0 - 1 - np.arange(depth)[:, None]]
    return pad[o + np.arange(y0, y1)[None, :], o + x1 + np.arange(depth)[:, None]]


def _openings(gray, walls, box, t):
    """Walk each of the room's four walls and read every opening in it.

    A gap in the wall is a door, unless glazing lines run through it. Windows also hide inside what reads as
    wall (hollow and hatched walls are filled in first), so the middle of each wall's thickness is checked too:
    a long thin line there, on an otherwise light wall, is glazing.
    """
    paper = float(np.percentile(gray, 90))
    depth = int(2.5 * t) + 2
    found = []
    for wall in "ABCD":
        ws = _strip(walls, wall, box, depth)
        gs = _strip(gray, wall, box, depth).astype(np.float32)
        length = ws.shape[1]
        if length < 4:
            continue
        near = ws[: max(3, int(0.8 * t))]
        present = (near.mean(axis=0) > 0.5).astype(np.uint8)
        margin = max(2, t // 2)                      # corners: the wall run ends just inside them
        present[:margin] = 1
        present[-margin:] = 1
        # this wall's own position and thickness (the room edge sits a pixel or two off the wall face)
        starts, thick = [], []
        for c in np.where(present[margin:-margin] > 0)[0][:: max(1, length // 200)] + margin:
            col = ws[:, c]
            on = np.where(col > 0)[0]
            if not on.size:
                continue
            s0 = on[0]
            off = np.where(col[s0:] == 0)[0]
            starts.append(s0)
            thick.append(off[0] if off.size else depth - s0)
        s0 = int(np.median(starts)) if starts else 0
        tw = int(np.median(thick)) if thick else t
        tw = max(4, min(tw, depth - 1 - s0))
        lo, hi = s0 + max(1, int(round(0.3 * tw))), s0 + max(2, int(round(0.7 * tw)))
        mid = (paper - gs[lo:hi]) > 50                # dark enough to be a drawn line
        k = max(3, int(1.5 * t))
        longl = cv2.morphologyEx(mid.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (k, 1)))
        solid = mid.mean(axis=0) > 0.8
        glazing = (longl.any(axis=0) & ~solid)
        min_len = max(int(1.5 * t), 6)
        spans = []
        for a, b in _gaps(present, min_len):
            kind = "window" if glazing[a:b].mean() > 0.4 else "door"
            spans.append((a, b, kind))
        for a, b in _gaps(1 - glazing.astype(np.uint8), min_len):
            if not any(not (b <= sa or a >= sb) for sa, sb, _ in spans):
                spans.append((a, b, "window"))
        for a, b, kind in sorted(spans):
            found.append({
                "type": kind,
                "wall": wall,
                "pos": round(100 * ((a + b) / 2) / length, 1),
                "start": round(100 * a / length, 1),
                "end": round(100 * b / length, 1),
                "len_px": int(b - a),
            })
    return found


def read_plan(data, tap=None):
    """Read one room of a plan.

    data: image bytes or a file path. tap: optional (x, y) in 0..1 of the original image — the room the
    person tapped; without it the largest room is used. Returns a JSON-ready dict.
    """
    gray0 = _load(data)
    gray, angle = _deskew(gray0)
    raw = _ink(gray)
    ink = _fill_thin(raw)
    t = _wall_thickness(ink)
    if t < 4:
        return {"ok": False, "reason": "no_walls", "message": "We couldn't find thick wall lines on this plan. A clearer, straight-on image helps."}
    walls = _walls(ink, t)
    h, w = gray.shape
    span = int(max(25 * t, min(h, w) * 0.2))      # widest opening we bridge (a wide window or patio door)
    closed = _close_gaps(walls, t, span)
    labels, rooms = _rooms(closed, min_area=(h * w) // 400)
    if not rooms:
        return {"ok": False, "reason": "no_room", "message": "We found walls but no closed room. Try a plan that shows the whole room.", "wall_px": t}
    pick, picked = rooms[0], "largest"
    if tap is not None:
        # the tap is in the original image; the plan was straightened about its centre, so turn the point too
        cx, cy = w / 2.0, h / 2.0
        px, py = tap[0] * w - cx, tap[1] * h - cy
        r = math.radians(angle)
        tx, ty = int(cx + px * math.cos(r) + py * math.sin(r)), int(cy - px * math.sin(r) + py * math.cos(r))
        hit = labels[min(h - 1, max(0, ty)), min(w - 1, max(0, tx))]
        tapped = next((r for r in rooms if r["label"] == hit), None)
        pick, picked = (tapped, "tap") if tapped else (pick, "tap_missed")
    mask = (labels == pick["label"]).astype(np.uint8)
    x0, y0, x1, y1 = _edges(mask)
    shape, poly, fill = _shape(mask, t)
    openings = _openings(gray, walls, (x0, y0, x1, y1), t)
    W, H = x1 - x0, y1 - y0
    doors = [o["len_px"] for o in openings if o["type"] == "door"]
    scale = None
    if doors:
        m_per_px = DOOR_M / float(np.median(doors))
        scale = {"m_per_px": m_per_px, "from": "door", "width_m": round(W * m_per_px, 2), "length_m": round(H * m_per_px, 2)}
    # confidence: a clean room is a near-rectangle, clearly bigger than the wall thickness, with walls all round
    conf = 0.5 + 0.3 * min(1.0, fill) + (0.2 if 0.15 < W / float(max(H, 1)) < 6 else 0)
    return {
        "ok": True,
        "width_px": int(W),
        "length_px": int(H),
        "ratio": round(W / float(H), 4),
        "shape": shape,
        "fill": round(float(fill), 3),
        "wall_px": int(t),
        "tilt_deg": round(angle, 2),
        "image": [int(w), int(h)],
        "box": [round(x0 / w, 4), round(y0 / h, 4), round(x1 / w, 4), round(y1 / h, 4)],
        "outline": [[round(float(px) / w, 4), round(float(py) / h, 4)] for px, py in poly],
        "openings": openings,
        "scale": scale,
        "rooms": [{"box": [round(r["bbox"][0] / w, 4), round(r["bbox"][1] / h, 4), round((r["bbox"][0] + r["bbox"][2]) / w, 4), round((r["bbox"][1] + r["bbox"][3]) / h, 4)], "area": r["area"]} for r in rooms[:12]],
        "confidence": round(min(1.0, conf), 2),
        "picked": picked,
    }


def read_plan_json(data, tap_x=None, tap_y=None):
    """Entry point for the browser: bytes in, a JSON string out (errors become ok:false)."""
    try:
        tap = (tap_x, tap_y) if tap_x is not None and tap_y is not None else None
        return json.dumps(read_plan(data, tap))
    except Exception as e:  # noqa: BLE001 — the page shows the message and falls back to the AI reader
        return json.dumps({"ok": False, "reason": "error", "message": str(e)})


if __name__ == "__main__" and len(__import__("sys").argv) > 1:   # in the browser there are no arguments
    import sys
    print(json.dumps(read_plan(sys.argv[1]), indent=1))
