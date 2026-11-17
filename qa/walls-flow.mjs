/**
 * Step 5 "Your walls" flow check: layout summary → walls overview → every wall (pick a piece,
 * set a finish, add a socket) → buying list, which must list what was picked.
 * Runs the app against the screen agent's fake database and sample project.
 *
 *   node qa/walls-flow.mjs [out-dir]     (default: qa/screen-agent/out)
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { MOCK_URL, STORAGE_KEY, fakeSession, fakeUser, installMock, loadFixtures } from "./screen-agent/lib/mock-supabase.mjs";

const OUT = process.argv[2] || "qa/screen-agent/out";
fs.mkdirSync(OUT, { recursive: true });
const port = 8094;
const env = { ...process.env, VITE_SUPABASE_URL: MOCK_URL, VITE_SUPABASE_PUBLISHABLE_KEY: "mock-anon-key", VITE_SUPABASE_PROJECT_ID: "mock", BROWSER: "none" };
const child = spawn("npx", ["vite", "--port", String(port), "--strictPort", "--host", "127.0.0.1"], { env, stdio: "ignore" });
const base = `http://127.0.0.1:${port}`;
for (let i = 0; i < 120; i++) { await new Promise((r) => setTimeout(r, 500)); try { if ((await fetch(base)).ok) break; } catch {} }

const fixtures = loadFixtures("qa/screen-agent/fixtures");
// A few catalogue pieces so the wall screen has real choices to show.
const piece = (id, name, type, img, price) => ({ id, name, type, description: `${name} in plum velvet, eclectic modern`, price, currency: "EUR", image_urls: [img], source_url: `https://shop.example/${id}`, is_active: true, shop_ref: null, style: "eclectic modern" });
fixtures.tables.shop_products = [
  piece("p1", "Curved velvet sofa", "sofa", "/journey-sample/luxe-1.jpg", 1890),
  piece("p2", "Emerald curved sofa", "sofa", "/journey-sample/sofa-wall.jpg", 1750),
  piece("p3", "Rattan floor lamp", "lamp", "/journey-sample/bio-3.jpg", 240),
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e.message || e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
await installMock(page, { role: "user", fixtures, log: [] });
const seed = JSON.parse(fs.readFileSync("qa/screen-agent/fixtures/journey-state.json", "utf8"));
// A fresh room: no walls composed yet, nothing from the old steps 5–8.
for (const k of ["walls", "anchor", "accent", "supporting", "surfaces", "decor", "lighting", "wallFlow"]) delete seed[k];
seed.done = (seed.done ?? []).filter((n) => n <= 4);
await ctx.addInitScript(({ key, session, seed }) => {
  if (!sessionStorage.getItem("seeded")) { localStorage.setItem("hm_journey_v1", JSON.stringify(seed)); sessionStorage.setItem("seeded", "1"); }
  localStorage.setItem(key, JSON.stringify(session)); localStorage.setItem("hm_qa", "1");
}, { key: STORAGE_KEY, session: fakeSession(fakeUser("user")), seed });

const fail = [];
const check = (ok, what) => { console.log(`${ok ? "  ok  " : "  FAIL"} ${what}`); if (!ok) fail.push(what); };
const at = () => page.url().replace(base, "");
const shot = (n) => page.screenshot({ path: path.join(OUT, `walls-${n}.png`), fullPage: true });

await page.goto(base + "/journey/4/summary"); await page.waitForLoadState("networkidle").catch(() => {});
await page.getByText("Next: your walls").click(); await page.waitForTimeout(800);
check(at() === "/journey/5/walls", `summary → walls overview (${at()})`);
check((await page.locator(".wo-card").count()) === 4, "overview shows 4 walls");
check((await page.locator(".wo-card svg.elev-svg").count()) === 4, "each wall drawn as an outline");
await shot("1-overview");

await page.getByRole("button", { name: /Start with wall A/ }).click(); await page.waitForTimeout(800);
check(at() === "/journey/5/wall/A", `opens wall A (${at()})`);
const rows = page.locator(".ws-items > li");
const n = await rows.count();
check(n >= 4, `wall A lists everything on it in one list (${n} rows)`);
console.log("   wall A:", (await page.locator(".ws-row .t b").allInnerTexts()).join(" | "));
check((await page.locator(".ws-draw svg circle").count()) >= n - 1, "numbered pins on the outline");
// pick the sofa from the catalogue
await page.locator(".ws-row", { hasText: /sofa/i }).first().click(); await page.waitForTimeout(1200);
const choices = page.locator(".ws-c");
check((await choices.count()) >= 1, `sofa shows shop choices (${await choices.count()})`);
if (await choices.count()) { await choices.first().click(); await page.waitForTimeout(500); }
check(await page.locator(".ws-row .t b", { hasText: "Curved velvet sofa" }).count() > 0, "picked sofa replaces the item in the list");
check(await page.locator(".ws-draw svg image").count() > 0, "picked sofa fills its outline");
// wall finish
await page.locator(".ws-row", { hasText: /Walls ·/ }).first().click(); await page.waitForTimeout(300);
const sw = page.locator(".ws-detail .ws-s");
if (await sw.count()) { await sw.nth(1).click(); await page.waitForTimeout(300); }
// add a socket
await page.locator(".ws-add button", { hasText: "Socket" }).click(); await page.waitForTimeout(300);
check((await rows.count()) === n + 1, "added a socket to wall A");
await shot("2-wall-A");
await page.locator(".ws-mode a", { hasText: "Picture" }).click(); await page.waitForTimeout(500);
check(await page.locator(".ws-pic img, .ws-empty, showroom-configurator").count() > 0, "picture view shows a picture or says there is none");
// the sample living room: wall A as a Generator PRO scene, swap the wall colour, every layer drawn
await page.waitForSelector("showroom-configurator button.hotspot", { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(2500);
const gp = page.locator(".ws-scene showroom-configurator");
check(await page.locator(".ws-sample").count() === 1, "picture view is labelled as the sample wall");
check(await gp.locator("button.hotspot").count() >= 4, `sample wall A has its hotspots (${await gp.locator("button.hotspot").count()})`);
await shot("2b-wall-A-picture");
await gp.locator("button.tab", { hasText: /wall colour/i }).click(); await page.waitForTimeout(500);
await gp.locator("button.carousel-item").nth(2).click(); await page.waitForTimeout(2000);
const px = await page.evaluate(() => { const el = document.querySelector(".ws-scene showroom-configurator"); const c = (el.shadowRoot || el).querySelector("canvas"); const d = c.getContext("2d").getImageData(c.width * 0.5, c.height * 0.12, 1, 1).data; return [d[0], d[1], d[2]]; });
check(px[0] > px[2] + 25, `wall colour swapped to terracotta (${px})`);
await shot("2c-wall-A-terracotta");
await page.locator(".ws-mode a", { hasText: "Outline" }).click();

for (const w of ["B", "C", "D"]) {
  await page.getByRole("button", { name: `Next: wall ${w}` }).click(); await page.waitForTimeout(700);
  check(at() === `/journey/5/wall/${w}`, `next → wall ${w}`);
  console.log(`   wall ${w}:`, (await page.locator(".ws-row .t b").allInnerTexts()).join(" | "));
  if (w === "D") await shot("3-wall-D");
}
await page.getByText("Save & next: make it happen").click(); await page.waitForTimeout(1200);
check(at() === "/journey/9/buy", `last wall → buying list (${at()})`);
const body = await page.locator("main").innerText();
check(/Curved velvet sofa/.test(body), "buying list includes the sofa picked on wall A");
await page.locator("nav.tabs a", { hasText: /Finishes/ }).click().catch(() => {}); await page.waitForTimeout(500);
check(/Socket/i.test(await page.locator("main").innerText()), "buying list includes sockets");
await shot("4-buylist");
// walls show as set up when going back
await page.goto(base + "/journey/5/walls"); await page.waitForTimeout(800);
check(/4 of 4/.test(await page.locator(".wo-prog").innerText()), "overview shows 4 of 4 walls set up");

const real = errors.filter((e) => !/favicon|DevTools|ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED/.test(e));
console.log("errors:", real);
const ok = !fail.length && !real.length;
console.log(ok ? "PASS walls flow" : `FAIL walls flow (${fail.length} checks, ${real.length} errors)`);
await browser.close(); child.kill("SIGTERM"); process.exit(ok ? 0 : 1);
