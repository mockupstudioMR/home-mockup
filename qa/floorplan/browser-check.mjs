/**
 * Runs the floor-plan reader the way the app does — Pyodide + OpenCV in a Web Worker in Chromium — on a few
 * sample plans, and compares with the Python run. Pyodide's files are served from a local copy, so the test
 * doesn't depend on the network.
 *
 *   node qa/floorplan/browser-check.mjs <pyodide dir> <samples dir> [app url]
 * The app must be running (npx vite) at the app url (default http://127.0.0.1:8091).
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const [pyDir, samples, app = "http://127.0.0.1:8091"] = process.argv.slice(2);
const TYPES = { ".mjs": "text/javascript", ".js": "text/javascript", ".wasm": "application/wasm", ".json": "application/json", ".zip": "application/zip", ".whl": "application/zip", ".tar": "application/x-tar" };

const browser = await chromium.launch();
const ctx = await browser.newContext();
await ctx.route("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/**", (route) => {
  const file = path.join(pyDir, new URL(route.request().url()).pathname.split("/full/")[1]);
  if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: "missing" });
  route.fulfill({ status: 200, body: fs.readFileSync(file), headers: { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream", "access-control-allow-origin": "*" } });
});
await ctx.route("**/__plans/**", (route) => {
  const file = path.join(samples, decodeURIComponent(new URL(route.request().url()).pathname.split("/__plans/")[1]));
  route.fulfill({ status: 200, body: fs.readFileSync(file), headers: { "content-type": "image/jpeg" } });
});
const page = await ctx.newPage();
page.on("console", (m) => m.type() === "error" && console.log("console:", m.text()));
await page.goto(app + "/", { waitUntil: "domcontentloaded" });

const names = fs.readdirSync(samples).filter((f) => f.endsWith(".jpg")).sort().slice(0, Number(process.env.N ?? 6));
const t0 = Date.now();
let ok = 0, found = 0, total = 0, extra = 0, within = 0;
for (const name of names) {
  const truth = JSON.parse(fs.readFileSync(path.join(samples, name.replace(".jpg", ".json")), "utf8"));
  const s = Date.now();
  const got = await page.evaluate(async ([n, tap]) => {
    const m = await import("/src/journey/plan/reader.ts");
    const blob = await (await fetch(`/__plans/${n}`)).blob();
    return m.readPlan(blob, tap);
  }, [name, truth.tap]);
  const ratioErr = got.ok ? Math.abs(got.ratio - truth.ratio) / truth.ratio : 1;
  const left = got.ok ? [...got.openings] : [];
  let hit = 0;
  for (const o of truth.openings) {
    const i = left.findIndex((g) => g.wall === o.wall && g.type === o.type && Math.abs(g.pos - o.pos) <= 4);
    if (i >= 0) { left.splice(i, 1); hit++; }
  }
  found += hit; total += truth.openings.length; extra += left.length; within += ratioErr < 0.02 ? 1 : 0;
  const good = got.ok && ratioErr < 0.02 && hit === truth.openings.length && !left.length;
  if (good) ok++;
  console.log(`${good ? "PASS" : "FAIL"} ${name}: ${got.ok ? `ratio ${got.ratio} vs ${truth.ratio}, openings ${hit}/${truth.openings.length}${left.length ? ` + ${left.length} extra` : ""} (${truth.style}${truth.scan ? ", scan" : ""})` : got.message} · ${((Date.now() - s) / 1000).toFixed(1)} s`);
}
console.log(`\nproportions within 2%: ${within}/${names.length} · openings found ${found}/${total} · extra ${extra}`);
console.log(`${ok}/${names.length} fully right in the browser · total ${((Date.now() - t0) / 1000).toFixed(1)} s (first one includes loading Pyodide + OpenCV)`);
await browser.close();
process.exit(within / names.length >= 0.95 && found / Math.max(1, total) >= 0.9 ? 0 : 1);
