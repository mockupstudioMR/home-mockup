/**
 * Step 4 end to end with a real plan file: upload on 4.1, check what 4.2 shows (size, doors and windows on the
 * walls, the room picker), then tap the other room. Uses the screen agent's fake database and a local Pyodide.
 *
 *   node qa/floorplan/e2e-step4.mjs <pyodide dir> <plan.jpg> <out dir> [app url]
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { STORAGE_KEY, fakeSession, fakeUser, installMock, loadFixtures } from "../screen-agent/lib/mock-supabase.mjs";

const [pyDir, planFile, out, app = "http://127.0.0.1:8091"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const TYPES = { ".mjs": "text/javascript", ".js": "text/javascript", ".wasm": "application/wasm", ".json": "application/json", ".zip": "application/zip", ".whl": "application/zip" };
const fixtures = loadFixtures(path.resolve("qa/screen-agent/fixtures"));
const seed = JSON.parse(fs.readFileSync("qa/screen-agent/fixtures/journey-state.json", "utf8"));
// fresh step 4: no room yet, two windows and a door counted in step 3 but not placed
Object.assign(seed, { room: { wallPhotos: [] }, layouts: [], chosenLayout: undefined, placements: [{ id: "w1", kind: "windows", n: 1 }, { id: "w2", kind: "windows", n: 2 }, { id: "d1", kind: "doors", n: 1 }], fixedCounts: { windows: 2, doors: 1 } });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await ctx.route("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/**", (route) => {
  const file = path.join(pyDir, new URL(route.request().url()).pathname.split("/full/")[1]);
  if (!fs.existsSync(file)) return route.fulfill({ status: 404 });
  route.fulfill({ status: 200, body: fs.readFileSync(file), headers: { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream", "access-control-allow-origin": "*" } });
});
const user = fakeUser("user");
await ctx.addInitScript(({ key, session, seed }) => {
  localStorage.setItem(key, JSON.stringify(session));
  localStorage.setItem("hm_journey_v1", JSON.stringify(seed));
  localStorage.setItem("hm_qa", "1");
}, { key: STORAGE_KEY, session: fakeSession(user), seed });
const page = await ctx.newPage();
await installMock(page, { role: "user", fixtures });
// the uploaded plan comes back as itself, so the room picker shows it
await page.route("**/storage/v1/object/public/**", (r) => r.fulfill({ status: 200, body: fs.readFileSync(planFile), headers: { "content-type": "image/jpeg" } }));
await page.goto(app + "/journey/4/input");
await page.waitForSelector("text=Upload a floorplan");
await page.screenshot({ path: path.join(out, "1-input.png") });
const t0 = Date.now();
const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.click("text=Upload a floorplan")]);
await chooser.setFiles(planFile);
page.on("console", (m) => console.log("console:", m.type(), m.text().slice(0, 200)));
for (let i = 0; i < 60 && !page.url().includes("/4/measure"); i++) {
  await page.waitForTimeout(3000);
  if (i % 5 === 0) console.log("waiting:", await page.locator("p.sub").first().innerText().catch(() => "?"), "| toast:", await page.locator("li[role=status], [data-state=open][role=status], ol li").allInnerTexts().catch(() => []), "| room:", await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem("hm_journey_v1")).room).slice(0, 160)));
}
if (!page.url().includes("/4/measure")) { await page.screenshot({ path: path.join(out, "stuck.png") }); throw new Error("step 4.2 did not open"); }
console.log(`plan read and step 4.2 open in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await page.waitForTimeout(800);
const text = await page.locator("main, body").first().innerText();
console.log((text.match(/We measured your plan[^\n]*/) ?? ["(no 'We measured' line)"])[0]);
console.log((text.match(/Measured from your plan[^\n]*/) ?? ["(no scale line)"])[0]);
console.log("fixed features:", (text.match(/(Window|Door) \d+ · [^\n]*/g) ?? []).join(" | "));
const state = await page.evaluate(() => JSON.parse(localStorage.getItem("hm_journey_v1")).room);
console.log("room:", JSON.stringify({ w: state.widthM, l: state.lengthM, ratio: state.planRead?.ratio, rooms: state.planRead?.rooms?.length, doorM: state.doorM }));
await page.screenshot({ path: path.join(out, "2-measure.png"), fullPage: true });
if (await page.locator("text=Not this room?").count()) {
  await page.locator('button[aria-label^="Room "]').first().click();
  await page.waitForTimeout(6000);
  const st2 = await page.evaluate(() => JSON.parse(localStorage.getItem("hm_journey_v1")).room);
  console.log("after tapping the other room:", JSON.stringify({ w: st2.widthM, l: st2.lengthM, ratio: st2.planRead?.ratio }));
  await page.screenshot({ path: path.join(out, "3-other-room.png"), fullPage: true });
}
// type a real measurement: wall A = 4.00 m
await page.fill("#len", "4.00");
await page.locator("#len").blur();
await page.waitForTimeout(300);
const st3 = await page.evaluate(() => JSON.parse(localStorage.getItem("hm_journey_v1")).room);
console.log("after typing wall A = 4.00 m:", JSON.stringify({ w: st3.widthM, l: st3.lengthM, confirmed: st3.confirmed }));
await browser.close();
