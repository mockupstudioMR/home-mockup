// Optional: ask Claude to compare the design and the app screenshot and list what differs.
// Runs only with --ai and an ANTHROPIC_API_KEY. Model can be set with QA_MODEL.
import fs from "node:fs";

const MODEL = process.env.QA_MODEL || "claude-sonnet-5-5";

export async function aiReview(designPath, appPath, spec, missing) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return "Skipped: set ANTHROPIC_API_KEY to get a written comparison.";
  const img = (p) => ({
    type: "image",
    source: { type: "base64", media_type: p.endsWith(".png") ? "image/png" : "image/jpeg", data: fs.readFileSync(p).toString("base64") },
  });
  const prompt = `The first image is the design for the screen "${spec.title}". The second is the built app.
List what the app is missing or does differently, most important first, as short bullet points a developer can act on.
Ignore example content (product names, colours, room sizes) that the app fills from the user's own data.
Words the automatic check could not find: ${missing.length ? missing.join("; ") : "none"}.
If the screen matches, answer "Matches the design."`;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 700, messages: [{ role: "user", content: [img(designPath), img(appPath), { type: "text", text: prompt }] }] }),
    });
    const data = await res.json();
    if (!res.ok) return `AI review failed: ${data?.error?.message || res.status}`;
    return data.content?.map((c) => c.text).join("\n").trim();
  } catch (e) {
    return `AI review failed: ${e.message}`;
  }
}
