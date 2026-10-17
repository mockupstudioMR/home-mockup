"""
Reads rooms on real floor plans (see real.json) and compares with the sizes printed on the plans.

Run:  python3 qa/floorplan/real_check.py [folder for the cloned repos]
Plans list room sizes as "a x b" without saying which way is across, so proportions are compared long side
to short side. Printed sizes are rounded and sometimes measured to the widest point, so a few % is normal.
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "public", "py"))
from floorplan import read_plan  # noqa: E402


def main(cache):
    spec = json.load(open(os.path.join(HERE, "real.json")))
    rows, errs, size_errs, n = [], [], [], 0
    for plan in spec["plans"]:
        repo_dir = os.path.join(cache, plan["repo"].replace("/", "_"))
        if not os.path.isdir(repo_dir):
            subprocess.run(["git", "clone", "-q", "--depth", "1", f"https://github.com/{plan['repo']}.git", repo_dir], check=True)
        img = os.path.join(repo_dir, plan["path"])
        rows.append(f"\n{plan['repo']}/{plan['path']} · {plan['style']}")
        for room in plan["rooms"]:
            n += 1
            got = read_plan(img, tap=room["tap"])
            want = max(room["m"]) / min(room["m"])
            if not got.get("ok") or got.get("picked") != "tap":
                rows.append(f"  MISS {room['name']}: {got.get('message') or 'that room is not closed off'}")
                errs.append(1.0)
                continue
            r = got["ratio"]
            have = max(r, 1 / r)
            e = abs(have - want) / want
            errs.append(e)
            size = ""
            if got.get("scale"):
                long_m = max(got["scale"]["width_m"], got["scale"]["length_m"])
                se = abs(long_m - max(room["m"])) / max(room["m"])
                size_errs.append(se)
                size = f" · size from door {got['scale']['width_m']}×{got['scale']['length_m']} m ({100 * se:.0f}% off)"
            doors = sum(o["type"] == "door" for o in got["openings"])
            wins = sum(o["type"] == "window" for o in got["openings"])
            rows.append(f"  {'PASS' if e <= 0.05 else 'FAIL'} {room['name']}: {have:.2f} vs {want:.2f} ({100 * e:.0f}%) · {doors} doors, {wins} windows{size}")
    print("\n".join(rows))
    ok = sum(e <= 0.05 for e in errs)
    print(f"\n{n} rooms on real plans · proportions within 5%: {ok}/{n}")
    if size_errs:
        size_errs.sort()
        print(f"size from the door alone: median {100 * size_errs[len(size_errs) // 2]:.0f}% off")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, ".real-plans"))
