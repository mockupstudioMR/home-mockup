#!/usr/bin/env node
/**
 * Screen-check agent: opens every screen of the app, compares it with its design board and reports what is missing.
 *
 *   npm run qa:screens                       # all screens, starts the dev server itself
 *   npm run qa:screens -- --only S4-Layouts  # one or more boards (comma separated)
 *   npm run qa:screens -- --area admin       # journey | admin
 *   npm run qa:screens -- --url http://localhost:8080   # use a server that is already running
 *   npm run qa:screens -- --ai               # also ask Claude to compare each pair of images (needs ANTHROPIC_API_KEY)
 *
 * Output: qa/screen-agent/out/report.html (side by side), report.md (summary), report.json (everything).
 * Exit code 1 when a screen is missing or below the pass mark, so it can run in CI.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { MOCK_URL, STORAGE_KEY, fakeSession, fakeUser, installMock, loadFixtures } from "./lib/mock-supabase.mjs";
import { writeReports } from "./lib/report.mjs";
import { aiReview } from "./lib/ai-review.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const OUT = path.join(HERE, "out");
const PASS_TEXT = 0.9; // share of required words found
const PASS_LOOK = 0.55; // visual similarity of the first screen height

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const only = opt("only")?.split(",").map((s) => s.trim());
const area = opt("area");
const useAi = args.includes("--ai");
let baseUrl = opt("url");

const config = JSON.parse(fs.readFileSync(path.join(HERE, "screens.config.json"), "utf8"));
const fixtures = loadFixtures(path.join(HERE, "fixtures"));

const norm = (t) =>
  (t || "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

async function startServer() {
  const port = 8090;
  const env = { ...process.env, VITE_SUPABASE_URL: MOCK_URL, VITE_SUPABASE_PUBLISHABLE_KEY: "mock-anon-key", VITE_SUPABASE_PROJECT_ID: "mock", BROWSER: "none" };
  const child = spawn("npx", ["vite", "--port", String(port), "--strictPort", "--host", "127.0.0.1"], { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
  let logs = "";
  child.stdout.on("data", (d) => (logs += d));
  child.stderr.on("data", (d) => (logs += d));
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const r = await fetch(url);
      if (r.ok) return { url, stop: () => child.kill("SIGTERM") };
    } catch { /* not up yet */ }
  }
  child.kill("SIGTERM");
  throw new Error(`Dev server did not start:\n${logs.slice(-2000)}`);
}

/** Similarity 0..1 of two screenshots, compared in the browser on a small grey-scale grid of the first screen height. */
async function similarity(page, aPath, bPath, viewportH, width) {
  const toData = (p) => `data:image/${p.endsWith(".png") ? "png" : "jpeg"};base64,${fs.readFileSync(p).toString("base64")}`;
  return page.evaluate(
    async ({ a, b, h, w }) => {
      const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      const W = 144, H = Math.round((144 * h) / w);
      const grid = (img) => {
        const c = document.createElement("canvas"); c.width = W; c.height = H;
        const x = c.getContext("2d");
        const sh = Math.min(img.naturalHeight, (img.naturalWidth * h) / w);
        x.drawImage(img, 0, 0, img.naturalWidth, sh, 0, 0, W, Math.round((W * sh) / img.naturalWidth));
        const d = x.getImageData(0, 0, W, H).data, g = new Float32Array(W * H);
        for (let i = 0; i < W * H; i++) g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
        return g;
      };
      // Compare where the edges are (text, cards, buttons), not the background colour, so an empty page scores low.
      const edges = (g) => {
        const e = new Float32Array(W * H);
        for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
          const i = y * W + x;
          e[i] = Math.abs(g[i + 1] - g[i - 1]) + Math.abs(g[i + W] - g[i - W]);
        }
        // blur 3x3 so a box a few pixels off still counts
        const b = new Float32Array(W * H);
        for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
          let s = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += e[(y + dy) * W + x + dx];
          b[y * W + x] = s / 9;
        }
        return b;
      };
      const ea = edges(grid(ia)), eb = edges(grid(ib));
      let diff = 0, tot = 0;
      for (let i = 0; i < ea.length; i++) { diff += Math.abs(ea[i] - eb[i]); tot += ea[i] + eb[i]; }
      return tot ? 1 - diff / tot : 1;
    },
    { a: toData(aPath), b: toData(bPath), h: viewportH, w: width },
  );
}

async function checkScreen(browser, base, areaName, board, spec, entry) {
  const vp = config.viewport;
  const context = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await context.newPage();
  const calls = [], errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message || e).slice(0, 300)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 300)); });
  await installMock(page, { role: entry.role || "user", fixtures, log: calls });

  let seed = null;
  if (entry.seed) {
    seed = JSON.parse(fs.readFileSync(path.join(HERE, "fixtures", entry.seed), "utf8"));
    if (entry.patch) seed = { ...seed, ...entry.patch };
  }
  const session = entry.role ? fakeSession(fakeUser(entry.role)) : null;
  await context.addInitScript(
    ({ key, session, seed }) => {
      try {
        if (session) localStorage.setItem(key, JSON.stringify(session));
        if (seed) localStorage.setItem("hm_journey_v1", JSON.stringify(seed));
        localStorage.setItem("hm_qa", "1");
      } catch { /* ignore */ }
    },
    { key: STORAGE_KEY, session, seed },
  );

  const result = { area: areaName, board, title: spec.title, route: entry.route, status: "ok", errors, calls: calls.length };
  try {
    await page.goto(base + entry.route, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    for (const a of entry.actions || []) {
      if (a.click) await page.getByText(a.click, { exact: false }).first().click({ timeout: 5000 });
      if (a.wait) await page.waitForTimeout(a.wait);
    }
    await page.waitForTimeout(600);
    result.finalUrl = page.url().replace(base, "");
    const text = norm(await page.evaluate(() => document.body.innerText));
    result.wrongPage = !page.url().startsWith(base + entry.route.split("?")[0]) && !entry.allowRedirect;
    const checked = spec.items.map((it) => {
      const found = it.match ? new RegExp(norm(it.match), "i").test(text) : text.includes(norm(it.text));
      return { ...it, found };
    });
    result.items = checked;
    const must = checked.filter((i) => i.must);
    result.mustFound = must.filter((i) => i.found).length;
    result.mustTotal = must.length;
    result.missing = must.filter((i) => !i.found).map((i) => i.text);
    result.sampleMissing = checked.filter((i) => !i.must && !i.found).map((i) => i.text);
    result.textScore = must.length ? result.mustFound / must.length : 1;
    const shot = path.join(OUT, "app", `${areaName}-${board}.png`);
    await page.screenshot({ path: shot, fullPage: true });
    result.appImage = path.relative(OUT, shot);
    const design = path.join(HERE, spec.design);
    result.designImage = path.relative(OUT, design);
    result.lookScore = fs.existsSync(design) ? await similarity(page, design, shot, vp.height, vp.width) : null;
    if (useAi) result.ai = await aiReview(design, shot, spec, result.missing);
  } catch (e) {
    result.status = "error";
    result.error = String(e.message || e).slice(0, 500);
    result.textScore = 0;
    result.lookScore = 0;
    result.missing = spec.items.filter((i) => i.must).map((i) => i.text);
  }
  result.pass = result.status === "ok" && !result.wrongPage && result.textScore >= PASS_TEXT && (result.lookScore ?? 1) >= PASS_LOOK;
  await context.close();
  return result;
}

async function main() {
  fs.mkdirSync(path.join(OUT, "app"), { recursive: true });
  let server = null;
  if (!baseUrl) {
    process.stdout.write("Starting the app with a fake database… ");
    server = await startServer();
    baseUrl = server.url;
    console.log(baseUrl);
  }
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const areaName of ["journey", "admin"]) {
      if (area && area !== areaName) continue;
      const specs = JSON.parse(fs.readFileSync(path.join(HERE, "specs", `${areaName}.json`), "utf8"));
      for (const spec of specs) {
        if (only && !only.includes(spec.board)) continue;
        const entry = config[areaName][spec.board];
        if (!entry) { results.push({ area: areaName, board: spec.board, title: spec.title, status: "unmapped", pass: false, missing: [], textScore: 0 }); continue; }
        const r = await checkScreen(browser, baseUrl, areaName, spec.board, spec, entry);
        results.push(r);
        const pct = (x) => (x == null ? "  -" : `${Math.round(x * 100)}%`.padStart(4));
        console.log(`${r.pass ? "PASS" : "MISS"}  ${spec.title.padEnd(42)} words ${pct(r.textScore)}  look ${pct(r.lookScore)}  ${r.status === "error" ? "ERROR " + r.error.split("\n")[0] : r.wrongPage ? "→ ended on " + r.finalUrl : r.missing.length ? "missing: " + r.missing.slice(0, 4).join(" | ") + (r.missing.length > 4 ? ` (+${r.missing.length - 4})` : "") : ""}`);
      }
    }
  } finally {
    await browser.close();
    server?.stop();
  }
  writeReports(OUT, results, { passText: PASS_TEXT, passLook: PASS_LOOK });
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed} of ${results.length} screens match. Report: ${path.relative(ROOT, path.join(OUT, "report.html"))}`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
