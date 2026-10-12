/** A1–A4 · Scan & upload, batch setup, detecting, batch result. */
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/looseDb";
import type { Tables } from "@/lib/looseDb";
import { useToast } from "@/hooks/use-toast";
import { I, Ic } from "@/journey/icons";
import { useScanImage, useTerms } from "@/admin/data";
import { A, AdminShell, Bdg, Chip, Conf, Crop, Crumb, Scan as ScanImg, ago, useAdminNav, type Box } from "../ui";
import { getPending, getProgress, pdfToImages, retryFailed, setPending, startBatch, subscribe } from "../scanStore";

const p = (d: string) => <path d={d} />;
type Batch = Tables<"ingest_batches">;
type Piece = Tables<"detected_pieces">;

export const SOURCE_LABEL: Record<string, string> = { room_photo: "Room photo", catalogue_page: "Catalogue page", generated_design: "Generated design", retailer_link: "Retailer link" };
const SOURCES: { v: string; t: string; text: string; icon: () => JSX.Element }[] = [
  { v: "room_photo", t: "Room photo", text: "A real room you like. Best for combinations that work in real life.", icon: () => <I.camera /> },
  { v: "catalogue_page", t: "Catalogue page", text: "Shop or magazine pages, one design per page.", icon: () => <Ic>{p("M4 4h7v16H4zM13 4h7v16h-7z")}</Ic> },
  { v: "generated_design", t: "Generated design", text: "A preview from Home Mockup you want to keep as a reference.", icon: () => <I.sparkle /> },
  { v: "retailer_link", t: "Retailer link", text: "A product or room-set page. We take its main image and credit.", icon: () => <I.link /> },
];

function useSettings() {
  return useQuery({
    queryKey: ["scan-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("cms_content").select("value").eq("key", "scan_settings").maybeSingle();
      try {
        return JSON.parse(data?.value ?? "{}") as { auto_save_threshold?: number; max_pages_per_pdf?: number };
      } catch {
        return {};
      }
    },
  });
}
const usePending = () => useSyncExternalStore(subscribe, getPending);

/** A1 · Scan & upload */
export function ScanHome() {
  const { go } = useAdminNav();
  const { toast } = useToast();
  const { data: settings } = useSettings();
  const files = useRef<HTMLInputElement>(null);
  const pdf = useRef<HTMLInputElement>(null);
  const cam = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState("all");
  const [links, setLinks] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { data: batches } = useQuery({
    queryKey: ["ingest-batches"],
    queryFn: async () => (await supabase.from("ingest_batches").select("*").order("created_at", { ascending: false }).limit(100)).data ?? [],
    refetchInterval: (q) => ((q.state.data as Batch[] | undefined)?.some((b) => b.status === "detecting") ? 4000 : false),
  });
  const { data: terms } = useTerms();
  const { data: counts } = useQuery({
    queryKey: ["batch-item-counts", (batches ?? []).map((b) => b.id).join()],
    enabled: !!batches?.length,
    queryFn: async () => {
      const { data } = await supabase.from("ingest_items").select("batch_id, status, page_no, source_url, error").in("batch_id", batches!.map((b) => b.id));
      const m = new Map<string, { n: number; done: number; links: number; err?: string }>();
      for (const it of data ?? []) {
        const c = m.get(it.batch_id) ?? { n: 0, done: 0, links: 0 };
        if (it.status !== "duplicate") c.n += 1;
        if (it.status === "done" || it.status === "failed") c.done += 1;
        if (it.source_url) c.links += 1;
        if (it.error && it.status === "failed") c.err = it.error;
        m.set(it.batch_id, c);
      }
      return m;
    },
  });
  const add = async (list: FileList | null, kind: "img" | "pdf") => {
    if (!list?.length) return;
    setBusy(true);
    try {
      let out: File[] = [];
      for (const f of Array.from(list)) {
        if (kind === "pdf" || f.type === "application/pdf") out = [...out, ...(await pdfToImages(f, settings?.max_pages_per_pdf ?? 20))];
        else if (f.type.startsWith("image/")) out.push(f);
      }
      setPending({ files: [...getPending().files, ...out].slice(0, 50) });
      go("scan", { view: "setup" });
    } catch (e) {
      toast({ title: "Couldn't read that file", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };
  const all = batches ?? [];
  const n = (s: string) => all.filter((b) => b.status === s).length;
  const shown = all.filter((b) => filter === "all" || b.status === filter);
  const roomLabel = (id: string | null) => (id ? terms?.byId.get(id)?.label ?? "—" : "Mixed");
  return (
    <AdminShell board="A1-Scan" section="scan">
      <Crumb items={["Feed"]} />
      <h1 className="ah1">Scan & upload</h1>
      <p className="asub">Feed the system designs you trust. AI finds every piece, saves the ones it's sure of as schemes, and sends the rest to review.</p>
      <section
        className="drop sec"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void add(e.dataTransfer.files, "img");
        }}
      >
        <span className="tile">
          <I.upload />
        </span>
        <h2 className="h3">{busy ? "Reading your files…" : "Drop images or a PDF here"}</h2>
        <p className="p" style={{ fontSize: "16px", maxWidth: "520px" }}>
          Room photos, catalogue pages or generated designs. A PDF is split into pages; each page counts as one design.
        </p>
        <div className="row" style={{ justifyContent: "center", gap: "12px", marginTop: "6px" }}>
          <button className="btn sm" type="button" onClick={() => files.current?.click()}>
            <I.upload />
            Upload images
          </button>
          <button className="btn ghost sm" type="button" onClick={() => pdf.current?.click()}>
            <Ic>{p("M6 3h9l4 4v14H6zM14 3v5h5")}</Ic>
            Upload PDF
          </button>
          <button className="btn ghost sm" type="button" onClick={() => setLinks(links == null ? "" : null)}>
            <I.link />
            Paste links
          </button>
          <button className="btn soft sm" type="button" onClick={() => cam.current?.click()}>
            <I.camera />
            Scan with camera
          </button>
        </div>
        {links != null && (
          <div className="row" style={{ width: "100%", maxWidth: 640, gap: 10, flexWrap: "nowrap" }}>
            <textarea className="textarea" style={{ minHeight: 80 }} placeholder="One link per line" value={links} onChange={(e) => setLinks(e.target.value)} aria-label="Links" />
            <button
              className="btn sm"
              type="button"
              onClick={() => {
                const l = links.split(/\s+/).filter((x) => /^https?:\/\//i.test(x));
                if (!l.length) return toast({ title: "Paste at least one link starting with https://" });
                setPending({ links: [...getPending().links, ...l] });
                go("scan", { view: "setup" });
              }}
            >
              Add
            </button>
          </div>
        )}
        <input ref={files} type="file" accept="image/*" multiple hidden onChange={(e) => void add(e.target.files, "img")} />
        <input ref={pdf} type="file" accept="application/pdf" hidden onChange={(e) => void add(e.target.files, "pdf")} />
        <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void add(e.target.files, "img")} />
        <p className="small" style={{ margin: "0" }}>
          Same file twice? We spot it and skip it.
        </p>
      </section>
      <section className="sec">
        <div className="sec-h">
          <h2>What you can feed in</h2>
        </div>
        <div className="src">
          {SOURCES.map((s) => (
            <div className="card" key={s.v}>
              <span className="ic-b">
                <s.icon />
              </span>
              <b>{s.t}</b>
              <span>{s.text}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="sec">
        <div className="sec-h">
          <h2>Batches</h2>
          <div className="flt">
            {[
              ["all", "All", all.length],
              ["needs_review", "Needs review", n("needs_review")],
              ["detecting", "Detecting", n("detecting")],
              ["done", "Done", n("done")],
              ["failed", "Failed", n("failed")],
            ].map(([k, l, c]) => (
              <button key={k as string} className={`pill${filter === k ? " on" : ""}`} type="button" onClick={() => setFilter(k as string)}>
                {l} <em>{c}</em>
              </button>
            ))}
          </div>
        </div>
        <div className="tbl-box">
          <table className="tbl">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Source</th>
                <th>Room type</th>
                <th>Progress</th>
                <th>Status</th>
                <th>
                  <span className="sr">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => {
                const c = counts?.get(b.id);
                const pct = b.status === "detecting" ? (c ? (c.done / Math.max(1, c.n)) * 100 : 0) : b.found_count ? (b.saved_count / b.found_count) * 100 : 0;
                return (
                  <tr key={b.id}>
                    <td>
                      <A className="rl" to="scan" extra={{ batch: b.id }}>
                        {b.name}
                      </A>
                      <div className="mut">
                        {ago(b.created_at)}
                        {c ? ` · ${c.links ? `${c.links} link${c.links > 1 ? "s" : ""}` : `${c.n} image${c.n === 1 ? "" : "s"}`}` : ""}
                      </div>
                    </td>
                    <td>{SOURCE_LABEL[b.source_type] ?? b.source_type}</td>
                    <td>{roomLabel(b.room_type_id)}</td>
                    <td>
                      <div className="mini">
                        <div className={`bar${b.status === "detecting" ? "" : " ok"}`}>
                          <span style={{ width: `${pct}%` }} />
                        </div>
                        <span className="mut">
                          {b.status === "detecting"
                            ? `${c?.done ?? 0} of ${c?.n ?? "?"} images`
                            : b.status === "failed"
                              ? c?.err ?? "Could not be read"
                              : `${b.saved_count} saved${b.waiting_count ? ` · ${b.waiting_count} waiting` : ""}`}
                        </span>
                      </div>
                    </td>
                    <td>
                      <Bdg status={b.status} />
                    </td>
                    <td>
                      {b.status === "failed" ? (
                        <button className="link-btn" type="button" style={{ minHeight: 0, padding: 0, fontWeight: 600, color: "var(--plum)" }} onClick={() => void retryFailed(b.id).then(() => toast({ title: "Retried" }))}>
                          Retry
                        </button>
                      ) : (
                        <A to="scan" extra={{ batch: b.id }} style={{ fontWeight: "600" }}>
                          Open
                        </A>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!shown.length && (
                <tr>
                  <td colSpan={6} className="mut">
                    No batches yet. Drop a few designs above to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}

/** A2 · Batch setup */
export function Setup() {
  const { go } = useAdminNav();
  const { toast } = useToast();
  const qc = useQueryClient();
  const pend = usePending();
  const { data: settings } = useSettings();
  const { data: terms } = useTerms();
  const more = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [source, setSource] = useState("room_photo");
  const [room, setRoom] = useState("");
  const [style, setStyle] = useState("");
  const [credit, setCredit] = useState("");
  const [url, setUrl] = useState("");
  const [th, setTh] = useState<number | null>(null);
  const [all, setAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const thv = th ?? settings?.auto_save_threshold ?? 0.85;
  const rooms = terms?.list.filter((t) => t.facet === "room_type" && t.status === "active") ?? [];
  const styles = terms?.list.filter((t) => t.facet === "style" && t.status === "active") ?? [];
  const n = pend.files.length + pend.links.length;
  const previews = useMemo(() => pend.files.map((f) => ({ f, url: URL.createObjectURL(f) })), [pend.files]);
  useEffect(() => () => previews.forEach((x) => URL.revokeObjectURL(x.url)), [previews]);

  // The screen-check agent (and a first look) can open setup with sample images.
  useEffect(() => {
    let qa = false;
    try {
      qa = localStorage.getItem("hm_qa") === "1";
    } catch {
      /* ignore */
    }
    if (!qa || pend.files.length || new URLSearchParams(window.location.search).get("demo") !== "1") return;
    void Promise.all(
      ["room-hero.jpg", "insp-2.jpg", "insp-3.jpg"].map(async (f) => new File([await (await fetch(`/journey-sample/${f}`)).blob()], f.replace("room-hero", "plum-living"), { type: "image/jpeg" })),
    ).then((files) => {
      setPending({ files });
      setName("Living rooms · plum & green");
      setSource("generated_design");
      setCredit("Home Mockup studio");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    if (!n) return toast({ title: "Add at least one image or link" });
    setBusy(true);
    try {
      const id = await startBatch(
        { name, sourceType: source, roomTypeId: room || null, styleHintId: style || null, credit, creditUrl: url, threshold: thv, reviewAll: all },
        () => {
          qc.invalidateQueries({ queryKey: ["ingest-batches"] });
          qc.invalidateQueries({ queryKey: ["admin-counts"] });
        },
      );
      qc.invalidateQueries({ queryKey: ["ingest-batches"] });
      go("scan", { batch: id });
    } catch (e) {
      toast({ title: "Could not start the batch", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };
  return (
    <AdminShell board="A2-Setup" section="scan">
      <Crumb items={[["Scan & upload", "scan"], "New batch"]} />
      <h1 className="ah1">Tell us about these designs</h1>
      <p className="asub">A few details help the AI read the pieces and file the combinations in the right place. Only the source type is required.</p>
      <div className="work sec">
        <section className="w-side">
          <div className="panel" style={{ padding: "24px" }}>
            <div className="row between" style={{ marginBottom: "14px" }}>
              <span className="lbl">
                {n} {pend.links.length && !pend.files.length ? "link" : "image"}
                {n === 1 ? "" : "s"}
              </span>
              <span className="tag ok">No duplicates</span>
            </div>
            <div className="ups">
              {previews.map(({ f, url: src }, i) => (
                <div className="up" key={src}>
                  <img src={src} alt={f.name} />
                  <button className="x" type="button" aria-label={`Remove image ${i + 1}`} onClick={() => setPending({ files: pend.files.filter((x) => x !== f) })}>
                    <I.x />
                  </button>
                  <span className="cap">{f.name}</span>
                </div>
              ))}
              {pend.links.map((l) => (
                <div className="up" key={l} style={{ display: "flex", alignItems: "center", justifyContent: "center", aspectRatio: "4/3", padding: 12, fontSize: 13, wordBreak: "break-all" }}>
                  {l}
                  <button className="x" type="button" aria-label="Remove link" onClick={() => setPending({ links: pend.links.filter((x) => x !== l) })}>
                    <I.x />
                  </button>
                </div>
              ))}
              <button className="add" type="button" onClick={() => more.current?.click()}>
                <I.plus />
                Add more
              </button>
              <input ref={more} type="file" accept="image/*" multiple hidden onChange={(e) => setPending({ files: [...pend.files, ...Array.from(e.target.files ?? [])] })} />
            </div>
          </div>
        </section>
        <section className="w-main">
          <div className="panel form">
            <div className="field">
              <label htmlFor="bn">Batch name</label>
              <input id="bn" className="input" value={name} placeholder="e.g. Living rooms · plum & green" onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <span className="lbl">Source type</span>
              <div className="chips">
                {SOURCES.map((s) => (
                  <button key={s.v} className={`chip${source === s.v ? " on" : ""}`} type="button" aria-pressed={source === s.v} onClick={() => setSource(s.v)}>
                    {s.t}
                  </button>
                ))}
              </div>
            </div>
            <div className="two">
              <div className="field">
                <label htmlFor="rt">
                  Room type <span style={{ fontWeight: "500", color: "#7C7090" }}>· optional</span>
                </label>
                <select id="rt" className="select" value={room} onChange={(e) => setRoom(e.target.value)}>
                  <option value="">Mixed</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="sh">
                  Style hint <span style={{ fontWeight: "500", color: "#7C7090" }}>· used only if the AI can't decide</span>
                </label>
                <select id="sh" className="select" value={style} onChange={(e) => setStyle(e.target.value)}>
                  <option value="">No hint</option>
                  {styles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="two">
              <div className="field">
                <label htmlFor="cr">Source credit</label>
                <input id="cr" className="input" placeholder="Shop, designer or magazine" value={credit} onChange={(e) => setCredit(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="cl">
                  Link <span style={{ fontWeight: "500", color: "#7C7090" }}>· optional</span>
                </label>
                <input id="cl" className="input" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
            </div>
            <hr className="divider" />
            <div className="field">
              <div className="row between">
                <label htmlFor="th">Save automatically when the AI is at least</label>
                <span className="tag">{thv.toFixed(2)} sure</span>
              </div>
              <input id="th" className="rng" type="range" min="0.5" max="1" step="0.05" value={thv} onChange={(e) => setTh(Number(e.target.value))} />
              <div className="th">
                <span>0.50 · more saved, more to fix later</span>
                <span>1.00 · everything to review</span>
              </div>
              <p className="small" style={{ margin: "4px 0 0" }}>
                Default comes from settings. A piece with a word we don't know always goes to review, whatever this is set to.
              </p>
            </div>
            <div className="li" style={{ padding: "4px 0 0", borderTop: "0", alignItems: "center" }}>
              <span className="ic-b">
                <Ic>{p("M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9")}</Ic>
              </span>
              <span style={{ flex: "1" }}>
                <b style={{ fontWeight: "600" }}>Review every piece in this batch</b>
                <br />
                <span className="small">Turn on for a messy batch or a new source.</span>
              </span>
              <button className={`toggle${all ? " on" : ""}`} type="button" aria-pressed={all} aria-label="Review every piece in this batch" onClick={() => setAll(!all)} />
            </div>
          </div>
          <div className="actions">
            <A className="back" to="scan">
              <I.back />
              Back
            </A>
            <button className={`btn auto${busy || !n ? " dis" : ""}`} type="button" style={{ marginLeft: "auto" }} onClick={start}>
              {busy ? "Uploading…" : `Start detecting ${n} image${n === 1 ? "" : "s"}`}
              <I.next />
            </button>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

/** Batch, its items and pieces; refreshed while detecting. */
function useBatch(id: string) {
  const live = useSyncExternalStore(subscribe, () => getProgress(id)?.done ?? -1);
  return useQuery({
    queryKey: ["batch-detail", id, live],
    queryFn: async () => {
      const [{ data: batch }, { data: items }] = await Promise.all([
        supabase.from("ingest_batches").select("*").eq("id", id).single(),
        supabase.from("ingest_items").select("*").eq("batch_id", id).order("created_at"),
      ]);
      const ids = (items ?? []).map((i) => i.id);
      const { data: pieces } = ids.length ? await supabase.from("detected_pieces").select("*").in("item_id", ids).order("created_at") : { data: [] as Piece[] };
      const schemeIds = Array.from(new Set((pieces ?? []).map((pc) => pc.scheme_id).filter(Boolean))) as string[];
      const [{ data: schemes }, { data: uses }] = schemeIds.length
        ? await Promise.all([
            supabase.from("furniture_schemes").select("id, created_at").in("id", schemeIds),
            supabase.from("detected_pieces").select("scheme_id").in("scheme_id", schemeIds),
          ])
        : [{ data: [] }, { data: [] }];
      const used = new Map<string, number>();
      for (const u of uses ?? []) used.set(u.scheme_id!, (used.get(u.scheme_id!) ?? 0) + 1);
      const born = new Map((schemes ?? []).map((s) => [s.id, s.created_at]));
      return { batch: batch as Batch | null, items: items ?? [], pieces: (pieces ?? []) as Piece[], used, born };
    },
    refetchInterval: (q) => (q.state.data?.batch?.status === "detecting" ? 3000 : false),
  });
}

/** Saved as a new scheme, or matched one that already existed. */
const isNew = (pc: Piece, born: Map<string, string>) => !!pc.scheme_id && new Date(born.get(pc.scheme_id) ?? 0).getTime() >= new Date(pc.created_at).getTime() - 5000;

function ItemImage({ path, url, pieces, labels, label }: { path: string | null; url: string | null; pieces: Parameters<typeof ScanImg>[0]["pieces"]; labels?: boolean; label?: string }) {
  const { data: src } = useScanImage(path, url);
  return <ScanImg src={src} pieces={pieces} labels={labels} alt={label} />;
}

/** A3 · Detecting pieces */
export function Detecting({ id }: { id: string }) {
  const { data } = useBatch(id);
  const { data: terms } = useTerms();
  const prog = useSyncExternalStore(subscribe, () => getProgress(id));
  if (!data?.batch) return <AdminShell board="A3-Detecting" section="scan">Loading…</AdminShell>;
  const { batch, items, pieces } = data;
  const real = items.filter((i) => i.status !== "duplicate");
  const doneN = real.filter((i) => i.status === "done" || i.status === "failed").length;
  const total = prog?.total ?? real.length;
  const pct = Math.round((doneN / Math.max(1, total)) * 100);
  const cur = Math.min(total, doneN + 1);
  const t = (x: string | null) => (x ? terms?.byId.get(x) : undefined);
  const stage = pct >= 100 ? 6 : 2;
  const recent = pieces.slice(-3);
  return (
    <AdminShell board="A3-Detecting" section="scan">
      <Crumb items={[["Scan & upload", "scan"], batch.name]} />
      <p className="script" style={{ textAlign: "left", marginTop: "18px" }}>
        reading the designs…
      </p>
      <h1 className="ah1" style={{ marginTop: "4px" }}>
        Finding every piece
      </h1>
      <p className="asub">
        Image {cur} of {total}. You can leave this page; the batch keeps running and the review counter updates when it's done.
      </p>
      <div className="pipe sec" aria-label="Detection steps">
        {["Upload", "Detect pieces", "Colour & material", "Map to vocabulary", "Match schemes", "Combination"].map((s, i) => (
          <div key={s} className={`p${i + 1 === stage ? " now" : i + 1 > stage ? " wait" : ""}`}>
            <i>{i + 1 < stage ? "✓" : i + 1}</i>
            {s}
          </div>
        ))}
      </div>
      <div className="imgs sec">
        {real.slice(0, 6).map((it) => {
          const own = pieces.filter((pc) => pc.item_id === it.id);
          const running = it.status === "detecting" || (it.status === "queued" && prog?.current && it === real[doneN]);
          return (
            <div className="ic-card" key={it.id}>
              <div className={running ? "scanline" : it.status === "queued" ? "wait-img" : ""} style={{ position: "relative" }}>
                <ItemImage path={it.storage_path} url={it.source_url} labels={false} pieces={own.map((pc, i) => ({ id: pc.id, box: pc.box as Box | null, status: pc.status, label: "", n: i + 1, matched: !isNew(pc, data.born) }))} />
              </div>
              <div className="meta">
                <span>{it.storage_path?.split("/").pop()?.slice(0, 24) ?? it.source_url?.replace(/^https?:\/\//, "").slice(0, 24)}</span>
                {it.status === "done" ? (
                  <span className="bdg saved">
                    {own.length} piece{own.length === 1 ? "" : "s"}
                  </span>
                ) : it.status === "failed" ? (
                  <Bdg status="failed" />
                ) : running ? (
                  <Bdg status="detecting" />
                ) : (
                  <Bdg status="queued" />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <section className="panel sec">
        <div className="row between" style={{ marginBottom: "12px" }}>
          <span className="lbl">Found so far</span>
          <span className="lbl">{pct}%</span>
        </div>
        <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Batch progress">
          <span style={{ width: `${pct}%` }} />
        </div>
        <div style={{ marginTop: "16px" }}>
          {recent.map((pc) => {
            const words = [t(pc.category_id)?.label, t(pc.color_id)?.label, t(pc.material_id)?.label, t(pc.style_id)?.label].filter(Boolean).join(" · ");
            const newWord = [pc.category_id, pc.color_id, pc.style_id, pc.material_id].map(t).find((x) => x?.status === "proposed");
            return (
              <div className="cue" key={pc.id}>
                {pc.status === "waiting" ? <span className="bdg review">To review</span> : isNew(pc, data.born) ? <span className="bdg saved">New scheme</span> : <span className="bdg match">Matched</span>}
                {words}
                {newWord ? ` · “${newWord.label.toLowerCase()}” is a new word` : ""}
                <span className="end">
                  <Conf value={pc.confidence} threshold={Number(batch.threshold)} />
                </span>
              </div>
            );
          })}
          {pct < 100 && (
            <div className="cue">
              <span className="spin" aria-hidden="true" />
              <span style={{ color: "#7C7090" }}>Reading {prog?.current?.split("/").pop() ?? "the next image"}…</span>
            </div>
          )}
        </div>
      </section>
      <div className="actions">
        <A className="btn ghost auto" to="scan">
          Run in background
        </A>
        <A className="btn auto" to="scan" extra={{ batch: id, view: "result" }} style={{ marginLeft: "auto" }}>
          See results so far
          <I.next />
        </A>
      </div>
    </AdminShell>
  );
}

/** A4 · Batch result */
export function Result({ id }: { id: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { go } = useAdminNav();
  const { data } = useBatch(id);
  const { data: terms } = useTerms();
  const [idx, setIdx] = useState(0);
  const { data: combos } = useQuery({
    queryKey: ["batch-combos", id],
    queryFn: async () => (await supabase.from("combination_signals").select("note, combination_id").like("note", "ingest_item:%")).data ?? [],
  });
  const undo = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("undo_ingest_batch", { _batch: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batch-detail", id] });
      qc.invalidateQueries({ queryKey: ["ingest-batches"] });
      toast({ title: "Batch undone", description: "Its combinations and unused AI-saved schemes were removed." });
    },
    onError: (e: Error) => toast({ title: "Could not undo", description: e.message, variant: "destructive" }),
  });
  const items = (data?.items ?? []).filter((i) => i.status !== "duplicate");
  const item = items[Math.min(idx, Math.max(0, items.length - 1))];
  const own = (data?.pieces ?? []).filter((pc) => pc.item_id === item?.id);
  const { data: src } = useScanImage(item?.storage_path, item?.source_url);
  if (!data?.batch) return <AdminShell board="A4-Result" section="scan">Loading…</AdminShell>;
  const { batch, pieces, born, used } = data;
  const t = (x: string | null) => (x ? terms?.byId.get(x) : undefined);
  const label = (pc: Piece) => t(pc.category_id)?.label ?? (pc.raw as { category?: string })?.category ?? "Piece";
  const saved = pieces.filter((pc) => ["saved", "confirmed", "merged"].includes(pc.status));
  const nNew = saved.filter((pc) => isNew(pc, born)).length;
  const waiting = pieces.filter((pc) => pc.status === "waiting");
  const comboFor = (itemId: string) => combos?.find((c) => c.note === `ingest_item:${itemId}`);
  const itemsWithCombo = items.filter((i) => comboFor(i.id)).length;
  const firstWaiting = waiting[0];
  const why = (pc: Piece) => {
    const nw = [pc.category_id, pc.color_id, pc.style_id, pc.material_id].map(t).find((x) => x?.status === "proposed");
    if (nw) return `Waiting: “${nw.label.toLowerCase()}” isn't in the vocabulary yet`;
    if (pc.review_reason === "spot_check") return "Waiting: every piece in this batch is reviewed";
    return `Waiting: only ${(pc.confidence ?? 0).toFixed(2)} sure${!pc.style_id ? ", and no style found" : ""}`;
  };
  const combo = item ? comboFor(item.id) : undefined;
  return (
    <AdminShell board="A4-Result" section="scan">
      <Crumb items={[["Scan & upload", "scan"], batch.name]} />
      <div className="hd">
        <div>
          <h1 className="ah1">
            {batch.found_count} pieces found, {batch.saved_count} saved
          </h1>
          <div className="sumline" style={{ marginTop: "14px" }}>
            <span className="bdg saved">
              {saved.length} saved · {nNew} new, {saved.length - nNew} matched
            </span>
            {waiting.length > 0 && <span className="bdg review">{waiting.length} need review</span>}
            <span className="bdg match">
              {itemsWithCombo} combination{itemsWithCombo === 1 ? "" : "s"} saved{items.length - itemsWithCombo ? ` · ${items.length - itemsWithCombo} waiting` : ""}
            </span>
            <span className="small">
              {SOURCE_LABEL[batch.source_type] ?? batch.source_type} · {batch.room_type_id ? t(batch.room_type_id)?.label : "Mixed"} · threshold {Number(batch.threshold).toFixed(2)}
            </span>
          </div>
        </div>
        <div className="row">
          {batch.status !== "undone" && (
            <button className="btn ghost sm" type="button" onClick={() => window.confirm("Undo this batch? Its combinations and AI-saved schemes nothing else uses are removed. Confirmed schemes stay.") && undo.mutate()}>
              Undo batch
            </button>
          )}
          {firstWaiting && (
            <A className="btn sm" to="review" extra={{ piece: firstWaiting.id }}>
              Review {waiting.length} piece{waiting.length === 1 ? "" : "s"}
            </A>
          )}
        </div>
      </div>
      {items.length > 0 && (
        <div className="sec">
          <div className="seg-ctl" role="tablist" aria-label="Images in this batch">
            {items.map((it, i) => (
              <a key={it.id} href={`#image-${i + 1}`} className={i === idx ? "on" : ""} role="tab" aria-selected={i === idx} onClick={(e) => (e.preventDefault(), setIdx(i))}>
                Image {i + 1} · {pieces.filter((pc) => pc.item_id === it.id).length} pieces
              </a>
            ))}
          </div>
        </div>
      )}
      {item && (
        <div style={{ marginTop: "20px" }}>
          {item.status === "failed" ? (
            <div className="panel" style={{ color: "#8A2E22" }}>
              This image could not be read: {item.error}
            </div>
          ) : (
            <ScanImg
              src={src}
              alt={`Image ${idx + 1} with ${own.length} detected pieces outlined`}
              pieces={own.map((pc, i) => ({ id: pc.id, box: pc.box as Box | null, status: pc.status, label: label(pc), n: i + 1, matched: !isNew(pc, born) }))}
              onSelect={(pid) => go("review", { piece: pid })}
            />
          )}
          <div className="legend">
            <span>
              <i />
              Saved as a new scheme
            </span>
            <span>
              <i className="m" />
              Matched an existing scheme
            </span>
            <span>
              <i className="r" />
              Waiting for review
            </span>
          </div>
        </div>
      )}
      <div className="work sec">
        <section className="w-main panel" style={{ padding: "8px 28px" }}>
          {own.map((pc, i) => {
            const nw = isNew(pc, born);
            return (
              <div className="pc" key={pc.id}>
                <span className={`num ${pc.status === "waiting" ? "r" : nw ? "s" : "m"}`}>{i + 1}</span>
                <Crop src={src} box={pc.box as Box | null} alt={`Crop: ${label(pc).toLowerCase()}`} />
                <div className="body">
                  <div className="scs">
                    <Chip facet="category" term={t(pc.category_id)} fallback={(pc.raw as { category?: string })?.category} />
                    <Chip facet="color" term={t(pc.color_id)} fallback={(pc.raw as { color?: string })?.color} />
                    <Chip facet="style" term={t(pc.style_id)} fallback={(pc.raw as { style?: string })?.style} />
                    <Chip facet="material" term={t(pc.material_id)} fallback={(pc.raw as { material?: string })?.material} />
                    {pc.tag_ids.slice(0, 2).map((tid) => (
                      <span className="sc" key={tid}>
                        <i>Tag</i>
                        {t(tid)?.label}
                      </span>
                    ))}
                  </div>
                  {pc.status === "waiting" && <span className="why">{why(pc)}</span>}
                </div>
                <div className="end">
                  <Conf value={pc.confidence} threshold={Number(batch.threshold)} />
                  {pc.status === "waiting" ? (
                    <A className="btn soft sm" to="review" extra={{ piece: pc.id }}>
                      Review
                    </A>
                  ) : (
                    <>
                      {pc.status === "dropped" ? <Bdg status="dropped" /> : nw ? <span className="bdg saved">New scheme</span> : <span className="bdg match">Matched · used {used.get(pc.scheme_id ?? "") ?? 1}×</span>}
                      <A to="schemes" extra={pc.scheme_id ? { scheme: pc.scheme_id } : {}} style={{ fontWeight: "600" }}>
                        Open
                      </A>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {!own.length && <p className="p" style={{ padding: "16px 0" }}>{item?.status === "done" ? "No furniture found in this image." : "Reading this image…"}</p>}
        </section>
        <aside className="w-side">
          <div className="rail-card">
            <div className="row between">
              <h2 className="h3" style={{ fontSize: "19px" }}>
                Combination from image {idx + 1}
              </h2>
              {combo ? <span className="bdg saved">Saved</span> : <span className="bdg review">Waiting</span>}
            </div>
            <div className="comb">
              {own
                .filter((pc) => pc.status !== "dropped")
                .map((pc, i, arr) => (
                  <span key={pc.id} style={{ display: "contents" }}>
                    <span className={`sc${pc.status === "waiting" ? " new" : ""}`}>
                      {label(pc)}
                      {t(pc.color_id) ? ` · ${t(pc.color_id)!.label.toLowerCase()}` : ""}
                    </span>
                    {i < arr.length - 1 && <span className="plus">+</span>}
                  </span>
                ))}
            </div>
            <p className="p" style={{ fontSize: "15px" }}>
              {own.filter((pc) => pc.status !== "waiting" && pc.status !== "dropped").length} of {own.filter((pc) => pc.status !== "dropped").length} pieces saved.{" "}
              {combo ? "The combination is saved and scored." : "The combination is saved and scored when you confirm the rest, so a half-checked set never reaches users."}
            </p>
            <hr className="divider" />
            <div className="kv">
              <div>
                <span>Room type</span>
                <b>{batch.room_type_id ? t(batch.room_type_id)?.label : "Mixed"}</b>
              </div>
              <div>
                <span>Style</span>
                <b>{t(item?.detected_style_id ?? batch.style_hint_id)?.label ?? "—"}</b>
              </div>
              <div>
                <span>Signal</span>
                <b>Curated · from admin</b>
              </div>
            </div>
          </div>
          <div className="rail-card" style={{ marginTop: "16px" }}>
            <h2 className="h3" style={{ fontSize: "19px" }}>
              Source
            </h2>
            <div className="kv">
              <div>
                <span>Credit</span>
                <b>{batch.source_credit ?? "—"}</b>
              </div>
              <div>
                <span>Type</span>
                <b>{SOURCE_LABEL[batch.source_type] ?? batch.source_type}</b>
              </div>
              <div>
                <span>Added</span>
                <b>{ago(batch.created_at)}</b>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

/** ?batch=… opens the live view while detecting, the result once done. */
export function BatchView({ id, view }: { id: string; view?: string | null }) {
  const { data } = useBatch(id);
  if (!data?.batch) return <Result id={id} />;
  return data.batch.status === "detecting" && view !== "result" ? <Detecting id={id} /> : <Result id={id} />;
}
