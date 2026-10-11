/** Steps 9 and 10 — buying list, sizes, to-do, summary; then everything together. */
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Back, Go, Screen, useGo } from "../Shell";
import { I, Ic, ROOM_ICON_SM } from "../icons";
import { roomName } from "../data";
import { EMPTY, ROOM_KEYS, curRoom, orderedRooms, useJourney, type JourneyState } from "../state";
import { StepSummary } from "../Summary";
import { SOURCES, buyList, tally, toCsv, type Action, type BuyRow } from "../buylist";
import { soFar, stepLine } from "../story";
import { inviteCollaborator, saveBuyList, saveStepDone, startNextRoom } from "../sync";

const p = (d: string) => <path d={d} />;
const lc = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
const budgetOf = (s: JourneyState) => (s.brief.budget && s.brief.budget !== "Not decided yet" ? s.brief.budget : "TBC");
const share = async (title: string, text: string, toast: ReturnType<typeof useToast>["toast"]) => {
  try {
    if (navigator.share) await navigator.share({ title, text });
    else {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied — paste it anywhere to share" });
    }
  } catch {
    /* cancelled */
  }
};
const download = (name: string, body: string, type = "text/csv") => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

function tagClass(a: Action) {
  return a === "Keep" ? "tag ok" : a === "Own or buy" || a === "Buy or keep" ? "tag line" : a === "Keep · yours" ? "tag ok" : "tag";
}

/** 9.1 · What to buy */
export function BuyList() {
  const { s, set } = useJourney();
  const { toast } = useToast();
  const [tab, setTab] = useState<"furniture" | "finishes">("furniture");
  const [editing, setEditing] = useState<string | null>(null);
  const rows = useMemo(() => buyList(s), [s]);
  const t = tally(rows);
  const shown = rows.filter((r) => r.tab === tab);
  const edit = (id: string, patch: { size?: string; action?: string }) => set((x) => ({ buyEdits: { ...(x.buyEdits ?? {}), [id]: { ...(x.buyEdits?.[id] ?? {}), ...patch } } }));
  const cycle = (r: BuyRow) => {
    if (!SOURCES.includes(r.action)) return;
    const next = SOURCES[(SOURCES.indexOf(r.action) + 1) % SOURCES.length];
    edit(r.id, { action: next });
    toast({ title: `${r.name}: ${next === "Buy" ? "suggested shops" : next === "Custom" ? "custom made" : "your own piece"}` });
  };
  return (
    <Screen board="S9-BuyList" step={9} right="1 of 3 · Buying list" wrapClass="wrap wide">
      <div className="row between" style={{ alignItems: "flex-end" }}>
        <div className="left" style={{ flex: "1 1 560px" }}>
          <p className="eyebrow">Make it happen</p>
          <h1 className="h1" style={{ fontSize: "clamp(36px,4vw,60px)" }}>
            Your buying list
          </h1>
          <p className="sub" style={{ fontSize: "18px" }}>
            Everything the design needs, wall by wall. Sizes start from standard ones in our database — edit any of them. They stay TBC until you've measured.
          </p>
        </div>
        <div className="row" style={{ gap: "10px" }}>
          <button className="btn ghost auto" type="button" style={{ minHeight: "52px", fontSize: "16px" }} onClick={() => download(`${roomName(curRoom(s)).toLowerCase().replace(/\s+/g, "-")}-buying-list.csv`, toCsv(rows))}>
            <Ic>{p("M12 4v11M7 10l5 5 5-5M4 20h16")}</Ic>
            Export
          </button>
          <button
            className="btn ghost auto"
            type="button"
            style={{ minHeight: "52px", fontSize: "16px" }}
            onClick={() => share(`${roomName(curRoom(s))} buying list`, rows.map((r) => `• ${r.name} — ${r.qty} — ${r.size} — wall ${r.wall} — ${r.action}`).join("\n"), toast)}
          >
            <Ic>{p("M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6")}</Ic>
            Share
          </button>
        </div>
      </div>
      <div className="tiles">
        <div className="tl">
          <span>To buy</span>
          <b>{t.toBuy}</b>
        </div>
        <div className="tl">
          <span>Keeping</span>
          <b>{t.keeping}</b>
        </div>
        <div className="tl">
          <span>Custom-made</span>
          <b>{t.custom}</b>
        </div>
        <div className={`tl${budgetOf(s) === "TBC" ? " t" : ""}`}>
          <span>Budget</span>
          <b>{budgetOf(s)}</b>
        </div>
      </div>
      <nav className="tabs" aria-label="List">
        {(
          [
            ["furniture", "Furniture & decor"],
            ["finishes", "Finishes, lighting & electrical"],
          ] as const
        ).map(([k, label]) => (
          <a key={k} href={`#${k}`} className={tab === k ? "on" : ""} aria-current={tab === k ? "page" : undefined} onClick={(e) => (e.preventDefault(), setTab(k))}>
            {label} <span>{rows.filter((r) => r.tab === k).length}</span>
          </a>
        ))}
      </nav>
      <div className="tbl-box" style={{ marginTop: "16px" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Standard size (cm) · tap to edit</th>
              <th>Wall</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.image ? <img src={r.image} alt="" /> : <span className="sw" style={{ background: r.colour ?? "#B4A9C4" }} />}
                  <b>{r.name}</b>
                </td>
                <td>{r.qty}</td>
                <td onClick={() => setEditing(r.id)} style={{ cursor: "text" }}>
                  {editing === r.id ? (
                    <input className="input" style={{ minHeight: 40, fontSize: 15, padding: "6px 10px" }} defaultValue={r.size} autoFocus onBlur={(e) => (edit(r.id, { size: e.target.value }), setEditing(null))} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
                  ) : (
                    r.size
                  )}
                </td>
                <td>{r.wall}</td>
                <td>
                  {SOURCES.includes(r.action) ? (
                    <button className={tagClass(r.action)} type="button" style={{ border: 0, cursor: "pointer" }} onClick={() => cycle(r)} title="Tap to switch where it comes from">
                      {r.action}
                    </button>
                  ) : (
                    <span className={tagClass(r.action)}>
                      {r.action}
                      {r.status && r.action === "Keep" ? ` · ${r.status}` : ""}
                    </span>
                  )}
                  {r.status && r.action !== "Keep" && <span className="tag tbc">{r.status}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="panel lav" style={{ marginTop: "24px" }}>
        <h2 className="h3">Before you order, every item needs</h2>
        <div className="req">
          {["Product or supplier", "Actual dimensions", "Finish", "Quantity", "Price", "Lead time", "Delivery constraints", "Wall / plan location"].map((x) => (
            <span className="tag line" key={x}>
              {x}
            </span>
          ))}
        </div>
      </section>
      <div className="actions">
        <Back to="S8-Walls" />
        <Go className="btn auto" to="S9-Sizes" style={{ marginLeft: "auto" }} onClick={() => void saveBuyList(s, rows)}>
          Next: confirm the sizes
          <I.next />
        </Go>
      </div>
    </Screen>
  );
}

/** The six measuring checklists, each a list of things to measure. */
function checklists(s: JourneyState) {
  const keep = s.keeping.map((k) => k.name.toLowerCase().replace(/^upright /, ""));
  return [
    { id: "survey", title: "Room survey", text: "Length, width, height, each wall; doors, windows, radiators, columns, existing points.", icon: () => <Ic>{p("M3 3h18v18H3zM3 12h7v9M14 3v6h7")}</Ic>, items: ["Length (wall A)", "Width (wall B)", "Ceiling height", "Doors and windows", "Existing points"], auto: [!!s.room.confirmed, !!s.room.confirmed, !!s.room.ceilingM, s.placements.some((x) => x.kind === "doors" && x.wall) && s.placements.some((x) => x.kind === "windows" && x.wall), false] },
    { id: "fit", title: "Furniture fit", text: `Each item's W × D × H, seat height, door swings, routes${keep.length ? `, ${keep.join(", ")} space` : ""}.`, icon: ROOM_ICON_SM["living-room"], items: ["Main piece", "Accent chair", "Tables", "Kept pieces", "Walking route", "Door swings"] },
    { id: "builtins", title: "Built-ins & finishes", text: "Wall-to-wall sizes, shelf depth, services, wall condition, floor levels.", icon: () => <Ic>{p("M4 4h16v16H4zM4 10h16M10 10v10")}</Ic>, items: ["Wall-to-wall sizes", "Shelf depth", "Wall condition", "Floor levels"] },
    { id: "soft", title: "Curtains, art & mirror", text: "Track width and projection, curtain drop, art and mirror sizes, fixing points.", icon: () => <Ic><rect x="4" y="3" width="16" height="18" rx="1" />{p("M12 3v18M4 12h16")}</Ic>, items: ["Track width", "Curtain drop", "Art sizes", "Mirror size"], auto: [false, false, false, Object.values(s.walls).some((w) => w?.items?.some((i) => /mirror/i.test(i.name) && i.action === "Use mine"))] },
    { id: "light", title: "Lighting & electricity", text: "Fixture sizes and drop, switch and socket spots, dimming — confirmed by your electrician.", icon: () => <Ic>{p("M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z")}</Ic>, items: ["Pendant drop", "Switch spots", "Socket spots", "Dimming"] },
    { id: "delivery", title: "Delivery access", text: "Entrance, stairs, lift, corridor turns and box sizes — before you approve an order.", icon: () => <Ic>{p("M3 6h11v10H3zM14 9h4l3 3v4h-7")}<circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></Ic>, items: ["Entrance door", "Stairs", "Lift", "Corridor turns"] },
  ];
}

/** 9.2 · Confirm the sizes */
export function Sizes() {
  const { s, set } = useJourney();
  const { toast } = useToast();
  const [open, setOpen] = useState<string | null>(null);
  const rows = useMemo(() => buyList(s), [s]);
  const ex = rows.find((r) => r.id === "anchor") ?? rows[0];
  const lists = checklists(s);
  const state = (id: string, n: number, auto?: boolean[]) => Array.from({ length: n }, (_, i) => s.checks?.[id]?.[i] ?? auto?.[i] ?? false);
  const toggle = (id: string, i: number, n: number, auto?: boolean[]) => {
    const cur = state(id, n, auto);
    cur[i] = !cur[i];
    set((x) => ({ checks: { ...(x.checks ?? {}), [id]: cur } }));
  };
  const text = lists.map((l) => `${l.title}:\n${l.items.map((i) => `☐ ${i}`).join("\n")}`).join("\n\n");
  return (
    <Screen board="S9-Sizes" step={9} right="2 of 3 · Sizes" wrapStyle={{ maxWidth: "1200px" }}>
      <p className="eyebrow">Make it happen</p>
      <h1 className="h1">Measure once. Order with confidence.</h1>
      <p className="sub">Replace every example size with a real one before you buy. A preview image can't tell you dimensions — a tape measure can.</p>
      <section className="panel" style={{ marginTop: "44px" }}>
        <div className="row between">
          <h2 className="h3">Every item keeps three sizes, separately</h2>
          {ex && <span className="tag">Example · {ex.name}</span>}
        </div>
        <div className="chain">
          <div className="cv a">
            <span>1 · Standard size</span>
            <b>{ex?.size ?? "—"}</b>
            <small>From our size database. Edit it if you like.</small>
          </div>
          <div className="arr">
            <I.next />
          </div>
          <div className="cv b">
            <span>2 · Space available</span>
            <b>{ex && s.spaceAvail?.[ex.id] ? s.spaceAvail[ex.id] : "— × — × —"}</b>
            <small>Measured in your room, wall {ex?.wall ?? "A"}.</small>
            <input
              className="input"
              placeholder="Enter W × D × H in cm"
              aria-label={`Space available on wall ${ex?.wall ?? "A"}`}
              style={{ minHeight: "48px", marginTop: "4px" }}
              defaultValue={ex ? s.spaceAvail?.[ex.id] ?? "" : ""}
              onBlur={(e) => ex && set((x) => ({ spaceAvail: { ...(x.spaceAvail ?? {}), [ex.id]: e.target.value } }))}
            />
          </div>
          <div className="arr">
            <I.next />
          </div>
          <div className="cv c">
            <span>3 · Approved product</span>
            <b>Not chosen yet</b>
            <small>The real product's drawing, once it fits.</small>
          </div>
        </div>
      </section>
      <h2 className="h3" style={{ marginTop: "40px" }}>
        Measuring checklist
      </h2>
      <div className="sv">
        {lists.map((l) => {
          const st = state(l.id, l.items.length, l.auto);
          const done = st.filter(Boolean).length;
          const Icon = l.icon;
          return (
            <a key={l.id} className="sc" href={`#${l.id}`} onClick={(e) => (e.preventDefault(), setOpen(open === l.id ? null : l.id))} aria-expanded={open === l.id}>
              <span className="ib">
                <Icon />
              </span>
              <b>{l.title}</b>
              <p>{l.text}</p>
              {open === l.id && (
                <div className="stack" style={{ gap: 6 }} onClick={(e) => e.stopPropagation()}>
                  {l.items.map((it, i) => (
                    <label key={it} className="row" style={{ gap: 10, fontSize: 15, flexWrap: "nowrap" }}>
                      <input type="checkbox" checked={st[i]} onChange={() => toggle(l.id, i, l.items.length, l.auto)} style={{ width: 20, height: 20, accentColor: "#665A85" }} />
                      {it}
                    </label>
                  ))}
                </div>
              )}
              <div className="pb">
                <i style={{ width: `${(done / l.items.length) * 100}%` }} />
              </div>
              <div className="ft">
                <span>
                  {done} of {l.items.length}
                </span>
                <span style={{ color: "#665A85" }}>{done === l.items.length ? "Done" : done ? "Continue" : "Start"}</span>
              </div>
            </a>
          );
        })}
      </div>
      <div className="actions">
        <Back to="S9-BuyList" label="Back to list" />
        <button className="link-btn" type="button" style={{ marginLeft: "auto" }} onClick={() => share(`Measuring checklist · ${roomName(curRoom(s))}`, text, toast)}>
          Send checklist to whoever's measuring
        </button>
        <Go className="btn auto" to="S9-Todo">
          Next: your to-do list
          <I.next />
        </Go>
      </div>
    </Screen>
  );
}

const STAGES = [
  { title: "Confirm scope, budget and timing", text: "Which room, what may change, spending limit and target date.", who: "" },
  { title: "Survey and lock the layout", text: "Measurements and existing-piece sizes; approve the plan and four wall elevations.", who: "You · designer" },
  { title: "Approve samples and specs", text: "Finishes, item sizes, fixture drawings, controls and product choices.", who: "Designer · suppliers" },
  { title: "Get coordinated quotes", text: "Joiner, decorator, flooring and curtain installer, electrician, plumber, AC installer — each quotes their approved scope, timing and dependencies.", who: "Trades" },
  { title: "Order with a delivery plan", text: "Approve real sizes, price, lead times, access and returns. Long-lead items first.", who: "You · suppliers" },
  { title: "Prepare and install", text: "In-wall services first (electrics, water, AC, heating, data) and wall work → finishes and flooring → built-ins and fixtures → furniture and curtains.", who: "Trades" },
  { title: "Style, test and close out", text: "Place decor; test lights, controls, sockets and doors; fix defects; keep care notes, invoices and warranties.", who: "You" },
];
const TEAM: [string, string][] = [["D", "Designer"], ["J", "Joiner"], ["E", "Electrician"], ["W", "Plumber"], ["AC", "AC installer"], ["F", "Flooring & curtains"], ["P", "Decorator"]];

/** 9.3 · Make it real — to-do */
export function Todo() {
  const { s, set } = useJourney();
  const { toast } = useToast();
  const [inviting, setInviting] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const td = s.todo ?? {};
  const scopeOk = td.scope ?? s.done.includes(1);
  const budgetOk = td.budget ?? budgetOf(s) !== "TBC";
  const dateOk = td.date ?? (!!s.brief.when && s.brief.when !== "Not decided yet");
  const stage1Done = scopeOk && budgetOk && dateOk;
  const doneStages = td.stage2 ? 2 : stage1Done ? 1 : 0;
  const setTd = (k: string, v: boolean) => set((x) => ({ todo: { ...(x.todo ?? {}), [k]: v } }));
  const invite = async (role: string) => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast({ title: "Type an email address" });
    try {
      await inviteCollaborator(s, role, email);
      set((x) => ({ team: [...(x.team ?? []), { role, email }] }));
      toast({ title: `Invite sent to ${email}` });
      setInviting(null);
      setEmail("");
    } catch (e) {
      toast({ title: "Couldn't send the invite", description: (e as Error).message, variant: "destructive" });
    }
  };
  return (
    <Screen board="S9-Todo" step={9} right="3 of 3 · To-do" wrapClass="wrap wide">
      <div className="left">
        <p className="eyebrow">How to make it real</p>
        <h1 className="h1" style={{ fontSize: "clamp(36px,4vw,60px)" }}>
          Your practical to-do list
        </h1>
        <p className="sub" style={{ fontSize: "18px" }}>
          Do it in this order so choices, purchases and installation stay in step.
        </p>
      </div>
      <div className="split" style={{ marginTop: "32px" }}>
        <div className="main">
          <ol className="tl" style={{ listStyle: "none", margin: "0", padding: "0" }}>
            {STAGES.map((st, i) => {
              const now = i === doneStages;
              const done = i < doneStages;
              return (
                <li key={st.title} className={`st${now ? " now" : ""}`}>
                  <span className="n" style={done ? { background: "#E3EEE6", borderColor: "#C9DCCF", color: "#3E6B55" } : undefined}>
                    {done ? "✓" : i + 1}
                  </span>
                  <div className="bd">
                    <div className={i === 0 ? "row between" : "row"}>
                      <b>{st.title}</b>
                      {i === 0 ? (
                        <span className={`tag${done ? " ok" : ""}`}>{done ? "Done" : "In progress"}</span>
                      ) : (
                        <span className="tag line" style={{ marginLeft: "auto" }}>
                          {st.who}
                        </span>
                      )}
                    </div>
                    <p>{st.text}</p>
                    {i === 0 && (
                      <>
                        <label className="ck">
                          <input type="checkbox" checked={scopeOk} onChange={(e) => setTd("scope", e.target.checked)} /> Room and scope
                        </label>
                        <label className="ck">
                          <input type="checkbox" checked={budgetOk} onChange={(e) => setTd("budget", e.target.checked)} /> Budget {budgetOf(s) === "TBC" ? <span className="tag tbc">TBC</span> : <span className="tag ok">{budgetOf(s)}</span>}
                        </label>
                        <label className="ck">
                          <input type="checkbox" checked={dateOk} onChange={(e) => setTd("date", e.target.checked)} /> Target date {dateOk && s.brief.when ? <span className="tag ok">{s.brief.when}</span> : <span className="tag tbc">TBC</span>}
                        </label>
                      </>
                    )}
                    {i === 1 && stage1Done && (
                      <label className="ck">
                        <input type="checkbox" checked={!!td.stage2} onChange={(e) => setTd("stage2", e.target.checked)} /> Survey done and layout approved
                      </label>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="small" style={{ marginTop: "18px" }}>
            Scheduling, trade availability, renovation approvals and the final install order depend on your project and stay TBC.
          </p>
        </div>
        <aside className="rail">
          <div className="rail-card">
            <h2 className="h3">Who's involved</h2>
            <div>
              <div className="pp">
                <i>You</i>You
                <span className="tag ok" style={{ marginLeft: "auto" }}>
                  Owner
                </span>
              </div>
              {TEAM.map(([k, role]) => {
                const invited = s.team?.find((m) => m.role === role);
                return (
                  <div key={role}>
                    <div className="pp">
                      <i>{k}</i>
                      {role}
                      {invited ? (
                        <span className="tag" style={{ marginLeft: "auto" }}>
                          Invited
                        </span>
                      ) : (
                        <a href="#invite" onClick={(e) => (e.preventDefault(), setInviting(inviting === role ? null : role))}>
                          Invite
                        </a>
                      )}
                    </div>
                    {inviting === role && (
                      <form
                        className="row"
                        style={{ gap: 8, flexWrap: "nowrap", paddingBottom: 10 }}
                        onSubmit={(e) => {
                          e.preventDefault();
                          void invite(role);
                        }}
                      >
                        <input className="input" style={{ minHeight: 44, fontSize: 15 }} type="email" placeholder={`${lc(role)}@email.com`} value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
                        <button className="btn auto" type="submit" style={{ minHeight: 44, fontSize: 15, padding: "0 14px" }}>
                          Send
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="small" style={{ margin: "0" }}>
              Invited people see the plan, walls and their part of the list.
            </p>
            <Go
              className="btn"
              to="S9-Summary"
              style={{ minHeight: "60px", fontSize: "18px" }}
              onClick={() => {
                set((x) => ({ done: Array.from(new Set([...x.done, 9])) }));
                void saveStepDone(s, 9);
              }}
            >
              Finish step 9
              <I.next />
            </Go>
          </div>
        </aside>
      </div>
      <div className="actions">
        <Back to="S9-Sizes" />
      </div>
    </Screen>
  );
}

/** 9.4 · Step 9 summary */
export function Step9Summary() {
  const { s } = useJourney();
  const rows = useMemo(() => buyList(s), [s]);
  const t = tally(rows);
  const lists = checklists(s);
  const measured = lists.reduce((n, l) => n + l.items.filter((_, i) => s.checks?.[l.id]?.[i] ?? l.auto?.[i] ?? false).length, 0);
  const total = lists.reduce((n, l) => n + l.items.length, 0);
  const fur = rows.filter((r) => r.tab === "furniture").length;
  const fin = rows.length - fur;
  const started = lists.filter((l) => l.items.some((_, i) => s.checks?.[l.id]?.[i] ?? l.auto?.[i]));
  const invited = s.team ?? [];
  const notYet = TEAM.map(([, r]) => r).filter((r) => !invited.some((m) => m.role === r));
  return (
    <StepSummary
      step={9}
      board="S9-Summary"
      title="What we set up in step 9"
      sub="You have a buying list, a measuring checklist and a to-do list. Last step: see it all together."
      media={
        <div className="nums">
          <div>
            <span>To buy</span>
            <b>{t.toBuy}</b>
          </div>
          <div>
            <span>Keeping</span>
            <b>{t.keeping}</b>
          </div>
          <div>
            <span>Custom-made</span>
            <b>{t.custom}</b>
          </div>
          <div className="t">
            <span>Measured</span>
            <b>
              {measured} / {total}
            </b>
          </div>
        </div>
      }
      decisions={[
        { k: "Buying list", v: `${fur} furniture & decor items + ${fin} finishes, lighting & electrical items, all starting from standard sizes`, edit: "S9-BuyList", editLabel: "Open" },
        {
          k: "Sizes",
          v: started.length
            ? `${started.map((l) => `${lc(l.title)} ${l.items.filter((_, i) => s.checks?.[l.id]?.[i] ?? l.auto?.[i]).length} of ${l.items.length}`).join(" · ")} · other checklists not started`.replace(/^\w/, (c) => c.toUpperCase())
            : "No checklist started yet",
          edit: "S9-Sizes",
          editLabel: "Open",
        },
        {
          k: "To-do",
          v: (
            <>
              7 stages · <b>stage 1</b> (scope, budget, timing) {budgetOf(s) !== "TBC" && s.brief.when ? "done" : "in progress"}
            </>
          ),
          edit: "S9-Todo",
          editLabel: "Open",
        },
        {
          k: "Team",
          v: invited.length ? `You + ${invited.map((m) => lc(m.role)).join(", ")}${notYet.length ? ` — ${notYet.map(lc).join(", ")} still to invite` : ""}` : `Just you so far — ${notYet.map(lc).join(", ")} still to invite`,
          edit: "S9-Todo",
          editLabel: "Invite",
        },
      ]}
      open={[...(budgetOf(s) === "TBC" || !s.brief.when ? ["Budget and target date"] : []), `${total - measured} measurements to take`, "Products, prices and lead times"]}
      soFar={[
        ["1–4", [stepLine(s, 1).split(" · ")[0], s.moodboard?.name, s.layouts.length ? `layout ${(s.chosenLayout ?? 0) + 1}` : null].filter(Boolean).join(", ")],
        ["5–7", [s.anchor ? `${(s.anchor.material ?? "").split(" ")[0]} ${s.anchor.kind}`.trim().replace(/^\w/, (c) => c.toUpperCase()) : null, `${s.moodboard?.palette.length ?? 0} materials`, s.lighting ? `${s.lighting.layers.length} light layers` : null].filter(Boolean).join(", ")],
        ["8", stepLine(s, 8)],
        ["9", "List, sizes and to-do ready"],
      ]}
      back="S9-Todo"
      next="S10-Final"
    />
  );
}

/** 10 · See everything together */
export function Final() {
  const { s, set } = useJourney();
  const go = useGo();
  const { toast } = useToast();
  const room = curRoom(s) ?? "living-room";
  const all = orderedRooms(s);
  const done = Array.from(new Set([...s.roomsDone, room]));
  const left = all.filter((r) => !done.includes(r));
  const next = left[0];
  const hero = s.preview?.versions[s.preview.current]?.image;
  const rows = useMemo(() => buyList(s), [s]);
  const wallsReviewed = Object.values(s.walls).filter((w) => w?.status !== "review").length;
  const measuredAll = !!s.room.confirmed && s.keeping.every((k) => k.measured);
  const tbc = [
    !measuredAll && "Room & item measurements",
    (budgetOf(s) === "TBC" || !s.brief.when) && "Budget & dates",
    "Exact products & suppliers",
    "Costs & lead times",
    "Construction details",
    "Electrical specs & positions",
    "Water, AC & data points",
  ].filter(Boolean) as string[];

  const continueWith = async () => {
    if (!next) return go("Main");
    const keep: Partial<JourneyState> = {};
    for (const k of ROOM_KEYS) (keep as Record<string, unknown>)[k] = s[k];
    const roomId = await startNextRoom(s, next);
    set((x) => {
      const reset: Partial<JourneyState> = {};
      for (const k of ROOM_KEYS) (reset as Record<string, unknown>)[k] = (EMPTY as Record<string, unknown>)[k];
      return { ...reset, archive: { ...(x.archive ?? {}), [room]: keep }, roomsDone: done, current: next, roomId: roomId ?? x.roomId, done: [1] };
    });
    go("S2-Vision");
  };
  const downloadFile = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      let y = 56;
      const line = (t: string, size = 11, bold = false) => {
        doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(size);
        for (const l of doc.splitTextToSize(t, 480)) {
          if (y > 790) {
            doc.addPage();
            y = 56;
          }
          doc.text(l, 56, y);
          y += size + 6;
        }
      };
      line(`${roomName(room)} — project file`, 20, true);
      y += 6;
      for (let i = 1; i <= 8; i++) line(`Step ${i}: ${stepLine(s, i)}`);
      y += 10;
      line("Buying list", 15, true);
      for (const r of rows) line(`• ${r.name} — ${r.qty} — ${r.size} — wall ${r.wall} — ${r.action}${r.status ? ` (${r.status})` : ""}`, 10);
      y += 10;
      line("Still TBC", 15, true);
      for (const t of tbc) line(`• ${t}`, 10);
      doc.save(`${roomName(room).toLowerCase().replace(/\s+/g, "-")}-project.pdf`);
    } catch {
      toast({ title: "The file couldn't be made", variant: "destructive" });
    }
  };
  const deliverables = [
    { k: "a", title: "Design review", text: "Keep the whole design, or adjust one wall or item.", ok: wallsReviewed === 4, tag: wallsReviewed === 4 ? "Ready" : `${wallsReviewed} of 4 walls`, to: "S8-Walls" as const, label: "Review", icon: () => <I.sparkle /> },
    { k: "b", title: "Buying pack", text: "Real sizes, chosen products, quantities, budget and lead times.", ok: measuredAll, tag: measuredAll ? "Ready" : "Needs sizes", to: "S9-BuyList" as const, label: "Open", icon: () => <Ic>{p("M6 6h15l-2 9H8zM6 6 5 3H2M9 20h.01M18 20h.01")}</Ic> },
    { k: "c", title: "Installation pack", text: "Measured plan, wall elevations, finish schedule and approved electrical plan.", ok: false, tag: "After survey", to: "S9-Sizes" as const, label: "Open", icon: () => <I.ruler /> },
    { k: "d", title: "Project checklist", text: "Owners, dates, deliveries, install tasks and final checks.", ok: true, tag: "Ready", to: "S9-Todo" as const, label: "Open", icon: () => <Ic>{p("M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9")}</Ic> },
  ];
  return (
    <Screen board="S10-Final" step={10} right={roomName(room)} wrapClass="wrap wide">
      <p className="script">your {roomName(room).toLowerCase()}</p>
      <h1 className="h1" style={{ marginTop: "4px" }}>
        Ready to make your room real
      </h1>
      <p className="sub">The preview, your plan, every wall, the buying list and the work schedule — in one place.</p>
      <nav className="vt" aria-label="View" style={{ justifyContent: "center", marginTop: "32px" }}>
        <Go className="on" to="S10-Final">
          <Ic>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            {p("M3 15l5-5 4 4 3-3 6 6")}
          </Ic>
          Room
        </Go>
        <Go to="S4-Layouts">
          <Ic>{p("M3 3h18v18H3zM3 12h7v9M14 3v6h7")}</Ic>
          Plan
        </Go>
        <Go to="S8-Walls">
          <Ic>
            <rect x="4" y="4" width="7" height="7" rx="1.5" />
            <rect x="13" y="4" width="7" height="7" rx="1.5" />
            <rect x="4" y="13" width="7" height="7" rx="1.5" />
            <rect x="13" y="13" width="7" height="7" rx="1.5" />
          </Ic>
          Walls
        </Go>
        <Go to="S9-BuyList">
          <Ic>{p("M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01")}</Ic>
          Buying list
        </Go>
        <Go to="S9-Todo">
          <Ic>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            {p("M3 10h18M8 3v4M16 3v4")}
          </Ic>
          Schedule
        </Go>
      </nav>
      <div className="ph hero" style={{ marginTop: "20px", borderRadius: "30px" }}>
        {hero && <img className="img" src={hero} alt={`Final ${roomName(room).toLowerCase()}`} style={{ borderRadius: "30px" }} />}
        <span className="num">{(s.preview?.current ?? 0) + 1}</span>
      </div>
      <h2 className="h3" style={{ marginTop: "40px" }}>
        What you get
      </h2>
      <div className="dl">
        {deliverables.map((d) => (
          <div className={`dv ${d.k}`} key={d.k}>
            <span className="tile">
              <d.icon />
            </span>
            <b>{d.title}</b>
            <p>{d.text}</p>
            <div className="st">
              <span className={`tag ${d.ok ? "ok" : "tbc"}`}>{d.tag}</span>
              <Go to={d.to}>{d.label}</Go>
            </div>
          </div>
        ))}
      </div>
      {all.length > 1 && (
        <section className="panel" style={{ marginTop: "28px", background: "#F7E9DA", borderColor: "#EDD6BE" }}>
          <div className="row between">
            <div className="stack" style={{ gap: "6px" }}>
              <h2 className="h3">{left.length ? `${left.length} room${left.length > 1 ? "s" : ""} still to design` : "All rooms designed"}</h2>
              <p className="p" style={{ fontSize: "16px", color: "#5E3A18" }}>
                The {roomName(room).toLowerCase()} is done. {left.length ? <>Each remaining room goes through <b>steps 2–10</b> — your project basics, budget and team carry over.</> : "Your whole project is designed."}
              </p>
            </div>
            <span className="tag" style={{ background: "#fff", color: "#7A4A1E" }}>
              {done.length} of {all.length} rooms done
            </span>
          </div>
          <div className="g4" style={{ marginTop: "18px", gap: "12px" }}>
            {all.map((r) => {
              const Icon = ROOM_ICON_SM[r] ?? ROOM_ICON_SM["living-room"];
              const isDone = done.includes(r);
              const isNext = r === next;
              return isNext ? (
                <button key={r} className="rmi" type="button" onClick={continueWith} style={{ padding: "14px 16px", borderRadius: "14px", background: "#fff", border: "2px solid #665A85", color: "#3B3350", cursor: "pointer", font: "inherit" }}>
                  <Icon />
                  <b>{roomName(r)}</b>
                  <span className="st" style={{ color: "#544872" }}>
                    Next →
                  </span>
                </button>
              ) : (
                <div key={r} className={`rmi${isDone ? " cur" : ""}`} style={isDone ? { padding: "14px 16px", borderRadius: "14px", background: "#fff", border: "2px solid #3E6B55" } : { padding: "14px 16px", borderRadius: "14px", background: "rgba(255,255,255,.6)", borderTop: "0" }}>
                  <Icon />
                  <b>{roomName(r)}</b>
                  <span className="st">{isDone ? "✓ Done" : "Not started"}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
      <section className="panel tint" style={{ marginTop: "28px" }}>
        <h2 className="h3">Still TBC before this can be ordered or built</h2>
        <div className="chips" style={{ marginTop: "16px", gap: "8px" }}>
          {tbc.map((t) => (
            <span className="tag tbc" key={t}>
              {t}
            </span>
          ))}
        </div>
        <Go className="btn auto" to="S9-Sizes" style={{ marginTop: "22px", minHeight: "52px", fontSize: "16px" }}>
          <I.ruler />
          Start measuring
        </Go>
      </section>
      <div className="actions">
        <button className="btn ghost auto" type="button" onClick={downloadFile}>
          <Ic>{p("M12 4v11M7 10l5 5 5-5M4 20h16")}</Ic>
          Download project file
        </button>
        <button className="btn ghost auto" type="button" onClick={() => share(`My ${roomName(room).toLowerCase()} design`, `${stepLine(s, 2)} · ${stepLine(s, 4)} — ${window.location.origin}/project`, toast)}>
          <Ic>{p("M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6")}</Ic>
          Share
        </button>
        {next ? (
          <button className="btn auto" type="button" style={{ marginLeft: "auto" }} onClick={continueWith}>
            Continue with room {all.indexOf(next) + 1}: {roomName(next)} — from step 2
            <I.next />
          </button>
        ) : (
          <Go className="btn auto" to="Main" style={{ marginLeft: "auto" }} onClick={() => (window.location.href = "/project", false)}>
            Back to my project
            <I.next />
          </Go>
        )}
      </div>
    </Screen>
  );
}

