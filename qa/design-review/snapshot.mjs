#!/usr/bin/env node
/**
 * Design snapshot: opens every screen of the app as it is on the current checkout (with the screen agent's
 * fake database, so nothing touches the live project) and saves a desktop and a mobile screenshot of each.
 *
 *   node qa/design-review/snapshot.mjs                    # starts the app itself
 *   node qa/design-review/snapshot.mjs --url http://127.0.0.1:8080
 *   node qa/design-review/snapshot.mjs --only S4-Layouts,Main --out /tmp/shots
 *
 * Writes <out>/shots.json plus <out>/desktop/<id>.jpg and <out>/mobile/<id>.jpg.
 * Screens come from qa/screen-agent/screens.config.json (journey, admin) plus extra-screens.json (public pages).
 * Set PW_CHROMIUM to a Chromium binary when Playwright's own browser can't be downloaded.
 */
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { MOCK_URL, STORAGE_KEY, fakeSession, fakeUser, installMock, loadFixtures } from "../screen-agent/lib/mock-supabase.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const SA = path.resolve(HERE, "../screen-agent");

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const only = opt("only")?.split(",").map((s) => s.trim());
const OUT = path.resolve(opt("out") || path.join(HERE, "out", "shots"));
let baseUrl = opt("url");

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const MAX_H = { desktop: 3600, mobile: 5200 }; // very long pages are cut so the PDF stays readable

const config = JSON.parse(fs.readFileSync(path.join(SA, "screens.config.json"), "utf8"));
const extra = JSON.parse(fs.readFileSync(path.join(HERE, "extra-screens.json"), "utf8"));
const fixtures = loadFixtures(path.join(SA, "fixtures"));
const titles = {};
for (const area of ["journey", "admin"]) {
  for (const s of JSON.parse(fs.readFileSync(path.join(SA, "specs", `${area}.json`), "utf8"))) titles[`${area}/${s.board}`] = s.title;
}

function screens() {
  const list = [];
  for (const [board, e] of Object.entries(extra.screens)) list.push({ area: "public", board, title: e.title, ...e });
  for (const area of ["journey", "admin"]) {
    for (const [board, e] of Object.entries(config[area])) list.push({ area, board, title: titles[`${area}/${board}`] || board, ...e });
  }
  return list.filter((s) => !only || only.includes(s.board)).map((s) => ({ ...s, id: `${s.area}-${s.board}` }));
}

async function startServer() {
  const port = 8091;
  const env = { ...process.env, VITE_SUPABASE_URL: MOCK_URL, VITE_SUPABASE_PUBLISHABLE_KEY: "mock-anon-key", VITE_SUPABASE_PROJECT_ID: "mock", BROWSER: "none" };
  const child = spawn("npx", ["vite", "--port", String(port), "--strictPort", "--host", "127.0.0.1"], { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
  let logs = "";
  child.stdout.on("data", (d) => (logs += d));
  child.stderr.on("data", (d) => (logs += d));
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try { if ((await fetch(url)).ok) return { url, stop: () => child.kill("SIGTERM") }; } catch { /* not up yet */ }
  }
  child.kill("SIGTERM");
  throw new Error(`Dev server did not start:\n${logs.slice(-2000)}`);
}

async function shoot(browser, base, s, kind) {
  const vp = kind === "desktop" ? DESKTOP : MOBILE;
  const context = await browser.newContext({ viewport: vp, deviceScaleFactor: kind === "desktop" ? 1 : 2, reducedMotion: "reduce", isMobile: kind === "mobile", hasTouch: kind === "mobile" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message || e).slice(0, 200)));
  await installMock(page, { role: s.role || "user", fixtures, log: [] });
  let seed = null;
  if (s.seed) {
    seed = JSON.parse(fs.readFileSync(path.join(SA, "fixtures", s.seed), "utf8"));
    if (s.patch) seed = { ...seed, ...s.patch };
  }
  const session = s.role ? fakeSession(fakeUser(s.role)) : null;
  await context.addInitScript(({ key, session, seed }) => {
    try {
      if (session) localStorage.setItem(key, JSON.stringify(session));
      if (seed) localStorage.setItem("hm_journey_v1", JSON.stringify(seed));
      localStorage.setItem("hm_qa", "1");
    } catch { /* ignore */ }
  }, { key: STORAGE_KEY, session, seed });

  const r = { file: null, error: null, finalUrl: null, errors };
  try {
    await page.goto(base + s.route, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    for (const a of s.actions || []) {
      if (a.click) await page.getByText(a.click, { exact: false }).first().click({ timeout: 5000 });
      if (a.wait) await page.waitForTimeout(a.wait);
    }
    // let lazy images and entrance animations settle
    await page.evaluate(async () => { window.scrollTo(0, document.body.scrollHeight); await new Promise((r) => setTimeout(r, 300)); window.scrollTo(0, 0); });
    await page.waitForTimeout(800);
    r.finalUrl = page.url().replace(base, "");
    const h = Math.min(MAX_H[kind], await page.evaluate(() => document.documentElement.scrollHeight));
    const file = path.join(OUT, kind, `${s.id}.jpg`);
    await page.screenshot({ path: file, type: "jpeg", quality: 82, clip: { x: 0, y: 0, width: vp.width, height: Math.max(h, vp.height) }, fullPage: true });
    r.file = path.relative(OUT, file);
  } catch (e) {
    r.error = String(e.message || e).split("\n")[0].slice(0, 300);
  }
  await context.close();
  return r;
}

async function main() {
  for (const k of ["desktop", "mobile"]) fs.mkdirSync(path.join(OUT, k), { recursive: true });
  let server = null;
  if (!baseUrl) { server = await startServer(); baseUrl = server.url; }
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const git = (c) => { try { return execSync(`git ${c}`, { cwd: ROOT }).toString().trim(); } catch { return ""; } };
  const manifest = {
    commit: git("rev-parse HEAD"),
    commitShort: git("rev-parse --short HEAD"),
    commitDate: git("log -1 --format=%cI"),
    commitSubject: git("log -1 --format=%s"),
    takenAt: new Date().toISOString(),
    groups: extra.groups,
    screens: [],
  };
  try {
    for (const s of screens()) {
      const desktop = await shoot(browser, baseUrl, s, "desktop");
      const mobile = await shoot(browser, baseUrl, s, "mobile");
      const redirected = desktop.finalUrl && !desktop.finalUrl.startsWith(s.route.split("?")[0]) && !s.allowRedirect;
      manifest.screens.push({ id: s.id, area: s.area, board: s.board, title: s.title, route: s.route, role: s.role ?? null, desktop: desktop.file, mobile: mobile.file, error: desktop.error || mobile.error, redirectedTo: redirected ? desktop.finalUrl : null, pageErrors: [...new Set([...desktop.errors, ...mobile.errors])].slice(0, 3) });
      console.log(`${desktop.error ? "ERR " : redirected ? "→   " : "ok  "} ${s.id.padEnd(28)} ${s.title}${redirected ? "  (ended on " + desktop.finalUrl + ")" : ""}`);
    }
  } finally {
    await browser.close();
    server?.stop();
  }
  fs.writeFileSync(path.join(OUT, "shots.json"), JSON.stringify(manifest, null, 1));
  console.log(`\n${manifest.screens.length} screens → ${path.relative(ROOT, OUT)}/shots.json`);
}

main().catch((e) => { console.error(e); process.exit(2); });
