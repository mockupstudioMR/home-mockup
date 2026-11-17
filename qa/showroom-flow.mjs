/**
 * Showroom flow check: layout summary → showroom → swap a piece → continue to step 5.
 * Runs the app against the screen agent's fake database and sample project.
 *
 *   node qa/showroom-flow.mjs [out-dir]     (default: qa/screen-agent/out)
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { MOCK_URL, STORAGE_KEY, fakeSession, fakeUser, installMock, loadFixtures } from "./screen-agent/lib/mock-supabase.mjs";
const OUT = process.argv[2] || "qa/screen-agent/out";
fs.mkdirSync(OUT, { recursive: true });
const port = 8093;
const env = { ...process.env, VITE_SUPABASE_URL: MOCK_URL, VITE_SUPABASE_PUBLISHABLE_KEY: "mock-anon-key", VITE_SUPABASE_PROJECT_ID: "mock", BROWSER: "none" };
const child = spawn("npx", ["vite", "--port", String(port), "--strictPort", "--host", "127.0.0.1"], { env, stdio: "ignore" });
const base = `http://127.0.0.1:${port}`;
for (let i = 0; i < 120; i++) { await new Promise((r) => setTimeout(r, 500)); try { if ((await fetch(base)).ok) break; } catch {} }
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e.message || e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
await installMock(page, { role: "user", fixtures: loadFixtures("qa/screen-agent/fixtures"), log: [] });
const seed = JSON.parse(fs.readFileSync("qa/screen-agent/fixtures/journey-state.json", "utf8"));
await ctx.addInitScript(({ key, session, seed }) => { localStorage.setItem(key, JSON.stringify(session)); localStorage.setItem("hm_journey_v1", JSON.stringify(seed)); localStorage.setItem("hm_qa", "1"); },
  { key: STORAGE_KEY, session: fakeSession(fakeUser("user")), seed });
const step = async (name) => { await page.waitForTimeout(800); console.log(name.padEnd(28), page.url().replace(base, "")); };
await page.goto(base + "/journey/4/summary"); await page.waitForLoadState("networkidle").catch(() => {}); await step("layout summary");
const next = page.locator("a,button").filter({ hasText: /^(Next|Continue|See)/i });
console.log("  next buttons:", await next.allInnerTexts());
await next.last().click(); await step("after next");
await page.waitForSelector("showroom-configurator", { timeout: 15000 });
await page.waitForTimeout(3000);
const root = page.locator("showroom-configurator");
console.log("  hotspots:", await root.locator("button.hotspot").count(), " tabs:", await root.locator("button.tab").allInnerTexts());
await page.screenshot({ path: path.join(OUT, "flow-1-showroom.png"), fullPage: true });
await root.locator("button.hotspot").nth(1).click(); await page.waitForTimeout(600);
await root.locator("button.carousel-item").nth(1).click(); await page.waitForTimeout(1800);
await page.screenshot({ path: path.join(OUT, "flow-2-swapped.png") });
console.log("  hotspot vs canvas:", await page.evaluate(() => { const el = document.querySelector("showroom-configurator"); const r = el.shadowRoot || el; const c = r.querySelector("canvas").getBoundingClientRect(); return [...r.querySelectorAll("button.hotspot")].map((b) => { const h = b.getBoundingClientRect(); return [Math.round((h.x + h.width / 2 - c.x) / c.width * 1400), Math.round((h.y + h.height / 2 - c.y) / c.height * 968)]; }); }));
await page.getByRole("button", { name: "Wall A" }).click(); await page.waitForTimeout(800);
console.log("  wall A view has configurator:", await page.locator("showroom-configurator").count());
await page.getByRole("button", { name: "Whole room" }).click(); await page.waitForTimeout(500);
await page.getByText("Continue to furniture").click(); await step("after continue");
const real = errors.filter((e) => !/favicon|DevTools|ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED/.test(e));
console.log("errors:", real);
const ok = page.url().endsWith("/journey/5/keeping") && real.length === 0;
console.log(ok ? "PASS showroom flow" : "FAIL showroom flow");
await browser.close(); child.kill("SIGTERM"); process.exit(ok ? 0 : 1);
