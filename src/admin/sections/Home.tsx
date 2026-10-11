/** A0 · Admin home */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { I } from "@/journey/icons";
import { A, AdminShell, Bdg, NAV_ICON, ago, useCounts } from "../ui";
import { SOURCE_LABEL } from "./Scan";

const greet = () => {
  const h = new Date().getHours();
  return h < 12 ? "good morning" : h < 18 ? "good afternoon" : "good evening";
};

/** An audit-log row in plain words. */
export function changeLine(r: { table_name: string; action: string; after: unknown; before: unknown; created_at: string }) {
  const a = (r.after ?? r.before ?? {}) as Record<string, unknown>;
  const name = (a.label ?? a.name ?? a.key ?? a.variant ?? "") as string;
  const table: Record<string, string> = {
    taxonomy_terms: "Term", furniture_schemes: "Scheme", scheme_combinations: "Combination", furniture_specs: "Size", shops: "Shop",
    cms_content: "Setting", style_definitions: "Style", palettes: "Palette", compatibility_rules: "Rule", scope_defaults: "Scope default",
  };
  const verb = r.action === "INSERT" ? "added" : r.action === "DELETE" ? "removed" : "changed";
  const t = table[r.table_name] ?? r.table_name.replace(/_/g, " ");
  return { t: `${name ? `“${name}”` : t} ${verb}`, m: `${t} · ${new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` };
}

export default function Home() {
  const { data: counts } = useCounts();
  const { data } = useQuery({
    queryKey: ["admin-home"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const head = { count: "exact" as const, head: true };
      const [batches, oldest, todays, schemes, combos, terms, changes, spot] = await Promise.all([
        supabase.from("ingest_batches").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("detected_pieces").select("created_at").eq("status", "waiting").order("created_at").limit(1),
        supabase.from("ingest_batches").select("found_count, saved_count").gte("created_at", today.toISOString()),
        supabase.from("furniture_schemes").select("id", head).eq("status", "active"),
        supabase.from("scheme_combinations").select("id", head).neq("status", "retired"),
        supabase.from("taxonomy_terms").select("id", head).eq("status", "active"),
        supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(3),
        supabase.from("detection_corrections").select("id", head).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      ]);
      const t = todays.data ?? [];
      return {
        batches: batches.data ?? [],
        oldest: oldest.data?.[0]?.created_at as string | undefined,
        today: { n: t.length, found: t.reduce((s, b) => s + b.found_count, 0), saved: t.reduce((s, b) => s + b.saved_count, 0) },
        schemes: schemes.count ?? 0,
        combos: combos.count ?? 0,
        terms: terms.count ?? 0,
        fixes: spot.count ?? 0,
        changes: changes.data ?? [],
      };
    },
  });
  const waiting = counts?.waiting ?? 0;
  const days = data?.oldest ? Math.max(0, Math.round((Date.now() - new Date(data.oldest).getTime()) / 86400000)) : 0;
  return (
    <AdminShell board="Main" section="home">
      <div className="hd">
        <div>
          <p className="script" style={{ textAlign: "left" }}>
            {greet()}
          </p>
          <h1 className="ah1">What needs you today</h1>
          <p className="asub">Feed the library with designs you trust, clear what the AI wasn't sure about, and keep the words and sizes behind every recommendation right.</p>
        </div>
        <A className="btn md" to="scan">
          <NAV_ICON.scan />
          Scan a design
        </A>
      </div>
      <div className="kpis sec">
        <A className={`kpi${waiting ? " warn" : ""}`} to="review">
          <span className="n">{waiting}</span>
          <span className="l">Pieces waiting for review</span>
          <span className="s">{waiting ? `Oldest from ${days ? `${days} day${days > 1 ? "s" : ""}` : "today"}${days ? " ago" : ""}` : "Nothing reaches users until confirmed"}</span>
        </A>
        <A className="kpi" to="scan">
          <span className="n">{data?.today.n ?? 0}</span>
          <span className="l">Batches today</span>
          <span className="s">
            {data?.today.found ?? 0} pieces found · {data?.today.saved ?? 0} saved
          </span>
        </A>
        <A className="kpi" to="vocabulary">
          <span className="n">{counts?.proposed ?? 0}</span>
          <span className="l">New words proposed</span>
          <span className="s">Found by scans, not in the vocabulary</span>
        </A>
        <A className="kpi" to="sizes">
          <span className="n">{counts?.missingSizes ?? 0}</span>
          <span className="l">Categories without sizes</span>
          <span className="s">Used by schemes, no standard size yet</span>
        </A>
      </div>
      <div className="qa sec">
        <A className="opt a" to="scan">
          <span className="tile sm">
            <I.camera />
          </span>
          <span className="opt-t">Scan & upload designs</span>
          <span className="opt-d">Room photos, catalogue pages, generated designs or links. Pieces become schemes; pieces seen together become a combination.</span>
          <span className="opt-cta">
            Start a batch
            <I.next />
          </span>
        </A>
        <A className="opt b" to="review">
          <span className="tile sm">
            <NAV_ICON.review />
          </span>
          <span className="opt-t">Clear the review queue</span>
          <span className="opt-d">Confirm, fix or merge what the AI wasn't sure about. Nothing here reaches users until you act on it.</span>
          <span className="opt-cta">
            Review {waiting} piece{waiting === 1 ? "" : "s"}
            <I.next />
          </span>
        </A>
      </div>
      <div className="split" style={{ marginTop: "36px" }}>
        <section className="main">
          <div className="sec-h">
            <h2>Recent batches</h2>
            <A to="scan" style={{ fontWeight: "600" }}>
              All batches
            </A>
          </div>
          <div className="tbl-box">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Source</th>
                  <th>Found</th>
                  <th>Saved</th>
                  <th>Waiting</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.batches ?? []).map((b) => (
                  <tr key={b.id}>
                    <td>
                      <A className="rl" to="scan" extra={{ batch: b.id }}>
                        {b.name}
                      </A>
                      <div className="mut">{ago(b.created_at)}</div>
                    </td>
                    <td>{SOURCE_LABEL[b.source_type] ?? b.source_type}</td>
                    <td>{b.found_count}</td>
                    <td>{b.saved_count}</td>
                    <td>{b.waiting_count}</td>
                    <td>
                      <Bdg status={b.status} />
                    </td>
                  </tr>
                ))}
                {!data?.batches.length && (
                  <tr>
                    <td colSpan={6} className="mut">
                      No scans yet. Start a batch to feed the library.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <aside className="rail">
          <div className="rail-card">
            <h2 className="h3" style={{ fontSize: "19px" }}>
              Library
            </h2>
            <div className="kv">
              <div>
                <span>Furniture schemes</span>
                <b>{data?.schemes ?? "—"}</b>
              </div>
              <div>
                <span>Combinations</span>
                <b>{data?.combos ?? "—"}</b>
              </div>
              <div>
                <span>Active terms</span>
                <b>{data?.terms ?? "—"}</b>
              </div>
              <div>
                <span>AI-saved, fixed on spot-check</span>
                <b>{data?.fixes ?? 0} · 7 days</b>
              </div>
            </div>
            <A className="btn soft sm" to="review" extra={{ view: "spotcheck" }} style={{ width: "100%" }}>
              Spot-check 10 AI-saved items
            </A>
          </div>
          <div className="rail-card" style={{ marginTop: "16px" }}>
            <h2 className="h3" style={{ fontSize: "19px" }}>
              Latest admin changes
            </h2>
            <div>
              {(data?.changes ?? []).map((c) => {
                const l = changeLine(c);
                return (
                  <div className="lr" key={c.id}>
                    <span>
                      <span className="t">{l.t}</span>
                      <br />
                      <span className="m">{l.m}</span>
                    </span>
                  </div>
                );
              })}
              {!data?.changes.length && <div className="lr m">No changes recorded yet.</div>}
            </div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
