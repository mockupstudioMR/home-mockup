"""
Runs the floor-plan reader on every sample plan and compares it with the known answer.

Run:  python3 qa/floorplan/check.py [samples dir]
Prints one line per plan and a summary; exits 1 if the reader misses the targets below.
"""
import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "public", "py"))
from floorplan import read_plan  # noqa: E402

TARGET_RATIO = 0.02     # room proportions within 2 %
TARGET_POS = 4.0        # an opening's position within 4 % of its wall
TARGET_FOUND = 0.9      # at least 90 % of openings found with the right type and wall


def main(folder):
    rows, ratio_err, size_err, found, total, extra = [], [], [], 0, 0, 0
    for img in sorted(glob.glob(os.path.join(folder, "*.jpg")) + glob.glob(os.path.join(folder, "*.png"))):
        truth_file = os.path.splitext(img)[0] + ".json"
        if not os.path.exists(truth_file):
            continue
        truth = json.load(open(truth_file))
        got = read_plan(img, tap=truth.get("tap"))
        name = os.path.basename(img)
        if not got.get("ok"):
            rows.append(f"MISS {name}: {got.get('message')}")
            total += len(truth["openings"])
            ratio_err.append(1.0)
            continue
        r_err = abs(got["ratio"] - truth["ratio"]) / truth["ratio"]
        ratio_err.append(r_err)
        if got.get("scale"):
            size_err.append(abs(got["scale"]["width_m"] - truth["width_m"]) / truth["width_m"])
        unmatched = list(got["openings"])
        hit = 0
        for o in truth["openings"]:
            m = next((g for g in unmatched if g["wall"] == o["wall"] and g["type"] == o["type"] and abs(g["pos"] - o["pos"]) <= TARGET_POS), None)
            if m:
                unmatched.remove(m)
                hit += 1
        found += hit
        total += len(truth["openings"])
        extra += len(unmatched)
        ok = r_err <= TARGET_RATIO and hit == len(truth["openings"]) and not unmatched
        rows.append(
            f"{'PASS' if ok else 'FAIL'} {name}: ratio {got['ratio']:.3f} vs {truth['ratio']:.3f} ({100 * r_err:.1f}%) · "
            f"openings {hit}/{len(truth['openings'])}{f' + {len(unmatched)} extra' if unmatched else ''} · "
            f"{got['shape']} · tilt {got['tilt_deg']} vs {truth['tilt_deg']}"
            + ("" if ok else f"\n     got {[(g['type'], g['wall'], g['pos']) for g in got['openings']]}\n     want {[(g['type'], g['wall'], g['pos']) for g in truth['openings']]}")
        )
    print("\n".join(rows))
    n = len(ratio_err)
    within = sum(e <= TARGET_RATIO for e in ratio_err)
    rate = found / max(1, total)
    print(f"\n{n} plans · proportions within 2%: {within}/{n} · openings found: {found}/{total} ({100 * rate:.0f}%) · extra openings: {extra}")
    if size_err:
        size_err.sort()
        print(f"size from the door alone (before the person's measurement): median error {100 * size_err[len(size_err) // 2]:.0f}%")
    good = n and within / n >= 0.95 and rate >= TARGET_FOUND
    sys.exit(0 if good else 1)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "samples"))
