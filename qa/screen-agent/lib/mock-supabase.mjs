// A fake Supabase for the screen-check agent. Every request the app makes to Supabase is answered
// in the browser from fixtures, so screens render with known sample data and nothing touches the live project.
import fs from "node:fs";
import path from "node:path";

export const MOCK_URL = "http://mock-supabase.test";
export const STORAGE_KEY = "sb-mock-supabase-auth-token";

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

export function fakeSession(user) {
  const exp = Math.floor(Date.now() / 1000) + 3600 * 24;
  const access_token = `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url({ sub: user.id, email: user.email, role: "authenticated", aud: "authenticated", exp })}.sig`;
  return {
    access_token,
    token_type: "bearer",
    expires_in: 86400,
    expires_at: exp,
    refresh_token: "mock-refresh",
    user,
  };
}

export function fakeUser(role) {
  return {
    id: role === "admin" ? "00000000-0000-4000-8000-00000000a0a0" : "00000000-0000-4000-8000-000000000001",
    aud: "authenticated",
    role: "authenticated",
    email: role === "admin" ? "admin@example.test" : "maya@example.test",
    app_metadata: { provider: "email" },
    user_metadata: { full_name: role === "admin" ? "Admin" : "Maya" },
    created_at: "2026-09-01T10:00:00Z",
  };
}

/** "@now", "@now-2h", "@now-3d", "@now-15m" in fixtures become real timestamps, so "today" and "2 days ago" stay true. */
function liveDates(v) {
  if (typeof v === "string") {
    const m = /^@now(?:-(\d+)([mhd]))?$/.exec(v);
    if (!m) return v;
    const ms = m[1] ? Number(m[1]) * { m: 60000, h: 3600000, d: 86400000 }[m[2]] : 0;
    return new Date(Date.now() - ms).toISOString();
  }
  if (Array.isArray(v)) return v.map(liveDates);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, liveDates(x)]));
  return v;
}

export function loadFixtures(dir) {
  const read = (f) => (fs.existsSync(path.join(dir, f)) ? JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) : {});
  // tables.json plus any tables.*.json (e.g. tables.admin.json), merged table by table.
  const tables = {};
  for (const f of fs.readdirSync(dir).filter((f) => /^tables(\..+)?\.json$/.test(f)).sort()) {
    for (const [t, rows] of Object.entries(read(f))) tables[t] = [...(tables[t] ?? []), ...rows];
  }
  return { tables: liveDates(tables), rpc: read("rpc.json"), functions: read("functions.json"), storage: read("storage.json"), publicDir: path.resolve(dir, "../../../public") };
}

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
  "base64",
);


/** Split a PostgREST select at top-level commas: "*, a(b, c(d))" → ["*", "a(b, c(d))"]. */
function splitTop(sel) {
  const out = [];
  let depth = 0, cur = "";
  for (const ch of sel) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
const singular = (t) => t.replace(/ies$/, "y").replace(/s$/, "");
const lastWord = (t) => singular(t).split("_").pop();

/** Resolve embedded relations ("ingest_items(storage_path, ingest_batches(name))") from the other fixture tables. */
function embed(rows, table, select, tables) {
  if (!select) return rows;
  const parts = splitTop(select).filter((x) => x.includes("("));
  if (!parts.length) return rows;
  return rows.map((row) => {
    const r = { ...row };
    for (const part of parts) {
      const m = /^(?:(\w+):)?(\w+)(?:!(\w+))?\((.*)\)$/s.exec(part);
      if (!m) continue;
      const [, alias, target, hint, inner] = m;
      const key = alias || target;
      const rel = tables[target];
      if (!rel) continue; // keep whatever the fixture already holds
      const hintCol = hint && /_fkey$/.test(hint) ? hint.replace(new RegExp(`^${table}_`), "").replace(/_fkey$/, "") : hint;
      const own = [hintCol, alias && `${alias}_id`, `${singular(target)}_id`, `${lastWord(target)}_id`].filter(Boolean).find((c) => c in row);
      if (own) {
        const hit = rel.find((x) => x.id === row[own]);
        r[key] = hit ? embed([hit], target, inner, tables)[0] : null;
      } else {
        const back = [`${singular(table)}_id`, `${lastWord(table)}_id`].find((c) => rel.some((x) => c in x));
        r[key] = back ? embed(rel.filter((x) => x[back] === row.id), target, inner, tables) : [];
      }
    }
    return r;
  });
}

function applyOrder(rows, order) {
  if (!order) return rows;
  const keys = order.split(",").map((o) => {
    const [col, dir, nulls] = o.split(".");
    return { col, desc: dir === "desc", nullsFirst: nulls === "nullsfirst" };
  });
  return [...rows].sort((a, b) => {
    for (const k of keys) {
      const x = a[k.col], y = b[k.col];
      if (x === y) continue;
      if (x == null) return k.nullsFirst ? -1 : 1;
      if (y == null) return k.nullsFirst ? 1 : -1;
      const c = x < y ? -1 : 1;
      return k.desc ? -c : c;
    }
    return 0;
  });
}

/** Applies the simple PostgREST filters the app uses (eq, neq, in, is) so a fixture table answers like a real one. */
function applyFilters(rows, params) {
  let out = rows;
  for (const [key, raw] of params) {
    if (["select", "order", "limit", "offset", "on_conflict", "columns"].includes(key) || key.includes(".")) continue;
    const m = /^(not\.)?(eq|neq|in|is|gte|lte|gt|lt|ilike|like)\.(.*)$/.exec(raw);
    if (!m) continue;
    const [, not, op, val] = m;
    const test = (r) => {
      const v = r[key];
      switch (op) {
        case "eq": return String(v) === val;
        case "neq": return String(v) !== val;
        case "in": return val.replace(/^\(|\)$/g, "").split(",").map((s) => s.replace(/^"|"$/g, "")).includes(String(v));
        case "is": return val === "null" ? v == null : String(v) === val;
        case "gte": return v >= val;
        case "lte": return v <= val;
        case "gt": return v > val;
        case "lt": return v < val;
        default: return true;
      }
    };
    out = out.filter((r) => (not ? !test(r) : test(r)));
  }
  out = applyOrder(out, params.get("order"));
  const limit = params.get("limit");
  if (limit) out = out.slice(0, Number(limit));
  return out;
}

/** Route every Supabase call of this page to the fixtures. Calls are logged so the report can show what a screen asked for. */
export async function installMock(page, { role, fixtures, log }) {
  const user = fakeUser(role);
  await page.route(`${MOCK_URL}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;
    const method = req.method();
    const json = (body, status = 200, headers = {}) =>
      route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*", ...headers }, body: JSON.stringify(body) });
    if (method === "OPTIONS") {
      return route.fulfill({ status: 200, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    }
    log?.push(`${method} ${p}${url.search ? "?" + url.searchParams.toString().slice(0, 80) : ""}`);

    if (p.startsWith("/auth/v1/user")) return json(user);
    if (p.startsWith("/auth/v1/token")) return json(fakeSession(user));
    if (p.startsWith("/auth/v1/logout")) return route.fulfill({ status: 204 });
    if (p.startsWith("/auth/v1/")) return json({});

    if (p.startsWith("/rest/v1/rpc/")) {
      const fn = p.slice("/rest/v1/rpc/".length);
      if (fn === "get_user_role") return json(role);
      return json(fixtures.rpc[fn] ?? null);
    }
    if (p.startsWith("/rest/v1/")) {
      const table = p.slice("/rest/v1/".length);
      const rows = fixtures.tables[table] ?? [];
      const single = (req.headers()["accept"] || "").includes("vnd.pgrst.object");
      if (method === "GET" || method === "HEAD") {
        const out = embed(applyFilters(rows, url.searchParams), table, url.searchParams.get("select"), fixtures.tables);
        const headers = { "content-range": `0-${Math.max(0, out.length - 1)}/${out.length}` };
        if (single) {
          if (!out.length) return json({ code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned", details: "", hint: null }, 406);
          return json(out[0], 200, headers);
        }
        return json(out, 200, headers);
      }
      let body = [];
      try { body = JSON.parse(req.postData() || "[]"); } catch { body = []; }
      const arr = (Array.isArray(body) ? body : [body]).map((r, i) => ({ id: `mock-${table}-${Date.now()}-${i}`, created_at: new Date().toISOString(), ...r }));
      if (method === "DELETE") return json([]);
      return json(single ? arr[0] ?? {} : arr, 201);
    }
    if (p.startsWith("/functions/v1/")) {
      const fn = p.slice("/functions/v1/".length);
      const f = fixtures.functions[fn] ?? { success: true };
      // "__delayMs" keeps a function busy, so screens that show progress can be checked mid-way.
      if (f.__delayMs) await new Promise((r) => setTimeout(r, f.__delayMs));
      return json(f);
    }
    // Signed links point back here; a file named in storage.json is served from public/ so scans show a real picture.
    if (p.startsWith("/storage/v1/object/sign/") && method === "POST") return json({ signedURL: `${p.slice("/storage/v1".length)}?token=mock` });
    if (p.startsWith("/storage/v1/object") && (method === "POST" || method === "PUT")) {
      const key = p.slice("/storage/v1/object/".length);
      return json({ Key: key, Id: `mock-${Date.now()}`, path: key.split("/").slice(1).join("/") });
    }
    if (p.startsWith("/storage/v1/object")) {
      const file = fixtures.storage?.[decodeURIComponent(p).split("/").pop()];
      if (file && fs.existsSync(path.join(fixtures.publicDir, file))) return route.fulfill({ status: 200, contentType: "image/jpeg", body: fs.readFileSync(path.join(fixtures.publicDir, file)) });
      return route.fulfill({ status: 200, contentType: "image/png", body: PNG_1PX });
    }
    if (p.startsWith("/storage/v1/")) return json({});
    if (p.startsWith("/realtime/")) return route.abort();
    return json({});
  });
  // Lovable's analytics or other third-party calls are not part of a screen.
  await page.route(/https:\/\/(www\.)?(google-analytics|googletagmanager|plausible|posthog)\./, (r) => r.abort());
  return user;
}
