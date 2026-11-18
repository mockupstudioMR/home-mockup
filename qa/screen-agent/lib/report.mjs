// Writes the screen-check results as report.json, report.md and a side-by-side report.html.
import fs from "node:fs";
import path from "node:path";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const pct = (x) => (x == null ? "–" : `${Math.round(x * 100)}%`);

export function writeReports(out, results, { passText, passLook }) {
  const when = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
  fs.writeFileSync(path.join(out, "report.json"), JSON.stringify({ when, passText, passLook, results }, null, 1));

  const passed = results.filter((r) => r.pass).length;
  const md = [
    `# Screen check · ${when}`,
    ``,
    `${passed} of ${results.length} screens match their design (words ≥ ${pct(passText)}, look ≥ ${pct(passLook)}).`,
    ``,
    `| Screen | Words | Look | What's missing |`,
    `|---|---|---|---|`,
    ...results.map((r) => {
      const why = r.status === "error" ? `Screen did not open: ${r.error?.split("\n")[0]}`
        : r.status === "unmapped" ? "No route set for this board"
        : r.wrongPage ? `Ended on ${r.finalUrl} instead`
        : r.missing?.length ? r.missing.join(" · ") : r.pass ? "—" : "Layout differs from the design";
      return `| ${r.pass ? "✅" : "❌"} ${r.title} | ${pct(r.textScore)} | ${pct(r.lookScore)} | ${why.replace(/\|/g, "/")} |`;
    }),
    ``,
  ].join("\n");
  fs.writeFileSync(path.join(out, "report.md"), md);

  const cards = results.map((r) => `
  <section class="card ${r.pass ? "pass" : "miss"}" id="${esc(r.area + "-" + r.board)}">
    <header>
      <div><b>${esc(r.title)}</b><span class="route">${esc(r.route || "")}</span></div>
      <div class="scores"><span>Words ${pct(r.textScore)}</span><span>Look ${pct(r.lookScore)}</span><span class="badge">${r.pass ? "Matches" : "Needs work"}</span></div>
    </header>
    ${r.status === "error" ? `<p class="err">Screen did not open: ${esc(r.error)}</p>` : ""}
    ${r.wrongPage ? `<p class="err">Ended on <code>${esc(r.finalUrl)}</code> instead of the screen.</p>` : ""}
    ${r.missing?.length ? `<p><b>Missing:</b> ${r.missing.map((m) => `<span class="pill">${esc(m)}</span>`).join(" ")}</p>` : ""}
    ${r.sampleMissing?.length ? `<p class="soft"><b>Example content not shown</b> (fine if the user's own data replaces it): ${r.sampleMissing.slice(0, 12).map(esc).join(" · ")}</p>` : ""}
    ${r.ai ? `<div class="ai"><b>Claude's comparison</b><p>${esc(r.ai).replace(/\n/g, "<br>")}</p></div>` : ""}
    ${r.errors?.length ? `<details><summary>${r.errors.length} browser errors</summary><pre>${esc(r.errors.slice(0, 8).join("\n"))}</pre></details>` : ""}
    <div class="pair">
      <figure><figcaption>Design</figcaption>${r.designImage ? `<img loading="lazy" src="${esc(r.designImage)}">` : ""}</figure>
      <figure><figcaption>App</figcaption>${r.appImage ? `<img loading="lazy" src="${esc(r.appImage)}">` : "<div class='none'>No screenshot</div>"}</figure>
    </div>
  </section>`).join("\n");

  const rows = results.map((r) => `<tr class="${r.pass ? "pass" : "miss"}"><td><a href="#${esc(r.area + "-" + r.board)}">${esc(r.title)}</a></td><td>${pct(r.textScore)}</td><td>${pct(r.lookScore)}</td><td>${r.pass ? "✓" : esc((r.missing || []).length + " missing")}</td></tr>`).join("");

  fs.writeFileSync(path.join(out, "report.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Screen check</title><style>
:root{--bg:#F6EFEA;--card:#fff;--ink:#3A3150;--mute:#7A6F8C;--ok:#2F6B4F;--bad:#A4462F;--line:#E6DCD6}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,sans-serif}
main{max-width:1500px;margin:0 auto;padding:24px 16px}
h1{margin:0 0 4px;font-size:28px}.sub{color:var(--mute);margin:0 0 20px}
table{border-collapse:collapse;width:100%;background:var(--card);border-radius:12px;overflow:hidden;margin-bottom:28px}
td,th{padding:8px 12px;border-bottom:1px solid var(--line);text-align:left}tr.pass td:last-child{color:var(--ok)}tr.miss td:last-child{color:var(--bad)}
a{color:inherit}.card{background:var(--card);border-radius:16px;padding:16px;margin:0 0 20px;border:2px solid transparent}.card.miss{border-color:#EBC8BE}
.card header{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.route{color:var(--mute);margin-left:10px;font-family:ui-monospace,monospace;font-size:13px}
.scores span{margin-left:12px;font-variant-numeric:tabular-nums}.badge{padding:2px 10px;border-radius:99px;background:#E7F1EA;color:var(--ok)}.miss .badge{background:#F8E5DF;color:var(--bad)}
.pill{display:inline-block;background:#F8E5DF;color:var(--bad);border-radius:99px;padding:1px 10px;margin:2px;font-size:13px}
.soft{color:var(--mute);font-size:13px}.err{color:var(--bad)}.ai{background:#F3EEF8;padding:10px 14px;border-radius:10px}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pair img{width:100%;border:1px solid var(--line);border-radius:8px}
figure{margin:0}figcaption{font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:var(--mute);margin-bottom:4px}
@media (max-width:800px){.pair{grid-template-columns:1fr}}
</style></head><body><main>
<h1>Screen check</h1><p class="sub">${when} · ${passed} of ${results.length} screens match · words = required titles, labels and buttons found · look = how close the first screen is to the design</p>
<table><thead><tr><th>Screen</th><th>Words</th><th>Look</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table>
${cards}
</main></body></html>`);
}
