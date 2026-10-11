/** Step 1 — Your project: who, why, what kind of place, which rooms, where to start, the state of the place, the brief. */
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Back, Go, Lines, Opt, Screen, useGo } from "../Shell";
import { I, Ic, ROOM_ICON, ROOM_ICON_SM, SCOPE_ICON } from "../icons";
import {
  BUDGETS, INTENTS, PROPERTIES, RESTRICTIONS, ROOMS, ROOM_SCOPE, STATES, TIMINGS, WALL_SCOPE, ordinal, roomName, scopeTags, stateInfo,
} from "../data";
import { orderedRooms, resumePath, useJourney } from "../state";
import { JourneyStrip } from "../Summary";
import { saveStep1 } from "../sync";

/** 00 · Who are you? */
export function WhoAreYou() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { s } = useJourney();
  const target = s.done.length ? resumePath(s) : "/journey/1/why";
  return (
    <Screen board="Main" step={0} signedIn={!!user}>
      <p className="eyebrow">Before we begin</p>
      <h1 className="h1">Who are you?</h1>
      <p className="sub">We'll shape the experience around what you're here to do.</p>
      <div className="g3">
        <Opt tint="a" sel onClick={() => navigate(user ? target : "/auth", { state: { from: target } })}>
          <span className="tile">
            <I.home />
          </span>
          <span className="opt-t">
            I'm designing
            <br />
            my home
          </span>
          <span className="opt-d">Plan a room from first idea to a buying list and install checklist.</span>
          <span className="opt-cta">
            Continue
            <I.next />
          </span>
        </Opt>
        <Opt tint="b" onClick={() => navigate("/start?as=pro")}>
          <span className="tile">
            <Ic>
              <rect x="3" y="7" width="18" height="13" rx="2" />
              <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18" />
            </Ic>
          </span>
          <span className="opt-t">
            I'm an interior
            <br />
            designer
          </span>
          <span className="opt-d">Run client projects, boards and hand-off packs.</span>
          <span className="opt-cta">
            Continue
            <I.next />
          </span>
        </Opt>
        <Opt tint="c" onClick={() => navigate("/start?as=pro")}>
          <span className="tile">
            <Ic>
              <path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M10 20v-5h4v5" />
            </Ic>
          </span>
          <span className="opt-t">
            I run a
            <br />
            furniture shop
          </span>
          <span className="opt-d">List products and reach people designing their rooms.</span>
          <span className="opt-cta">
            Continue
            <I.next />
          </span>
        </Opt>
      </div>
      <p className="small" style={{ textAlign: "center", marginTop: "36px" }}>
        You can switch later from your profile.
      </p>
    </Screen>
  );
}

const INTENT_ICON = {
  new_space: () => <I.home />,
  redesign: () => <I.sparkle />,
  exploring: () => <I.compass />,
};

/** 1.1 · What's brought you here? */
export function Why() {
  const { s, set } = useJourney();
  const go = useGo();
  return (
    <Screen board="S1-Why" step={1} right="Question 1 of 5">
      <p className="eyebrow">Start your journey</p>
      <h1 className="h1">What's brought you here?</h1>
      <p className="sub">Select what matches your situation.</p>
      <div className="g3">
        {INTENTS.map((it, i) => {
          const Icon = INTENT_ICON[it.id];
          return (
            <Opt
              key={it.id}
              tint={(["a", "b", "c"] as const)[i]}
              className="left-al"
              sel={s.intent === it.id}
              onClick={() => {
                set({ intent: it.id });
                go("S1-Place");
              }}
            >
              <span className="tile" style={{ alignSelf: "center" }}>
                <Icon />
              </span>
              <span className="stack" style={{ gap: "12px" }}>
                <span className="opt-t">
                  <Lines t={it.title} />
                </span>
                <span className="p" style={{ color: "#4E4566" }}>
                  {it.text}
                </span>
              </span>
              <span className="opt-cta">
                Continue
                <I.next />
              </span>
            </Opt>
          );
        })}
      </div>
      <div className="actions">
        <Back to="Main" />
      </div>
    </Screen>
  );
}

const PROPERTY_ICON: Record<string, () => JSX.Element> = {
  apartment: () => (
    <Ic>
      <rect x="5" y="3" width="10" height="18" rx="1" />
      <path d="M15 9h4v12h-4M8 7h4M8 11h4M8 15h4" />
    </Ic>
  ),
  house: () => <I.home />,
  studio: () => (
    <Ic>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 7h.01M12 7h.01M15 7h.01M9 11h.01M12 11h.01M15 11h.01M10 21v-4h4v4" />
    </Ic>
  ),
  loft: () => (
    <Ic>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </Ic>
  ),
};

/** 1.2 · What kind of place? */
export function Place() {
  const { s, set } = useJourney();
  const go = useGo();
  return (
    <Screen board="S1-Place" step={1} right="Question 2 of 5">
      <p className="eyebrow">Start your journey</p>
      <h1 className="h1">What kind of place?</h1>
      <p className="sub">Choose the type of property you're working with.</p>
      <div className="g4">
        {PROPERTIES.map((p, i) => {
          const Icon = PROPERTY_ICON[p.id];
          return (
            <Opt
              key={p.id}
              tint={(["a", "b", "c", "d"] as const)[i]}
              className="short"
              sel={s.propertyType === p.id}
              onClick={() => {
                set({ propertyType: p.id });
                go("S1-Rooms");
              }}
            >
              <span className="tile">
                <Icon />
              </span>
              <span className="opt-t">{p.title}</span>
              <span className="opt-d">{p.text}</span>
            </Opt>
          );
        })}
      </div>
      <div className="actions">
        <Back to="S1-Why" />
      </div>
    </Screen>
  );
}

/** 1.3 · Which rooms? */
export function Rooms() {
  const { s, set } = useJourney();
  const toggle = (id: string) =>
    set((p) => {
      const rooms = p.rooms.includes(id) ? p.rooms.filter((r) => r !== id) : [...p.rooms, id];
      return { rooms, startRoom: p.startRoom && rooms.includes(p.startRoom) ? p.startRoom : rooms[0] };
    });
  const n = s.rooms.length;
  return (
    <Screen board="S1-Rooms" step={1} right="Question 3 of 5">
      <p className="eyebrow">Start your journey</p>
      <h1 className="h1">Which rooms are on your list?</h1>
      <p className="sub">Select all the spaces you want to design. You'll pick one to start with next.</p>
      <div className="g4" style={{ gap: "24px", marginTop: "48px" }}>
        {ROOMS.map((r) => {
          const Icon = ROOM_ICON[r.id];
          return (
            <Opt key={r.id} tint={r.tint} className="room" sel={s.rooms.includes(r.id)} onClick={() => toggle(r.id)}>
              <span className="tile sm">
                <Icon />
              </span>
              <span className="opt-t">{r.title}</span>
            </Opt>
          );
        })}
      </div>
      <div className="actions">
        <Back to="S1-Place" />
        <span className="small" style={{ marginLeft: "auto", fontSize: "16px", color: "#665A80" }}>
          <b style={{ color: "#3B3350" }}>
            {n} room{n === 1 ? "" : "s"}
          </b>{" "}
          selected
        </span>
      </div>
      <Go className={`btn${n ? "" : " dis"}`} to="S1-Start" style={{ marginTop: "20px" }} onClick={() => n > 0}>
        Continue
        <I.next />
      </Go>
    </Screen>
  );
}

/** 1.4 · Where to start? */
export function StartRoom() {
  const { s, set } = useJourney();
  const rooms = s.rooms.length ? s.rooms : ["living-room"];
  const start = s.startRoom && rooms.includes(s.startRoom) ? s.startRoom : rooms[0];
  const others = rooms.filter((r) => r !== start).map(roomName);
  const big = rooms.length <= 4;
  return (
    <Screen board="S1-Start" step={1} right="Question 4 of 5">
      <p className="eyebrow">Start your journey</p>
      <h1 className="h1">Where do you want to start?</h1>
      <p className="sub">Pick one room to begin with — you can do the rest later.</p>
      <div className="g4" style={{ marginTop: "56px" }}>
        {rooms.map((id, i) => {
          const r = ROOMS.find((x) => x.id === id);
          const Icon = ROOM_ICON[id] ?? ROOM_ICON["living-room"];
          const title = r?.title ?? roomName(id);
          const words = title.split(" ");
          return (
            <Opt key={id} tint={(["a", "b", "c", "d"] as const)[i % 4]} className="room" sel={start === id} onClick={() => set({ startRoom: id })}>
              <span className={`tile${big ? "" : " sm"}`}>
                <Icon />
              </span>
              <span className="opt-t">{words.length === 2 && big ? <Lines t={[words[0], words[1]]} /> : title}</span>
              {id === "living-room" && (
                <span className="tag" style={{ marginTop: "-20px" }}>
                  Most popular first room
                </span>
              )}
            </Opt>
          );
        })}
      </div>
      <Go className="btn" to="S1-State" style={{ marginTop: "36px" }} onClick={() => void set({ startRoom: start })}>
        Start with the {roomName(start).toLowerCase()}
        <I.next />
      </Go>
      <div className="actions" style={{ marginTop: "24px" }}>
        <Back to="S1-Rooms" />
        {others.length > 0 && (
          <span className="small" style={{ marginLeft: "auto" }}>
            {others.length === 1 ? others[0] : `${others.slice(0, -1).join(", ")} and ${others[others.length - 1]}`}{" "}
            {others.length === 1 ? "is" : "are"} saved — steps 2–10 repeat for each after this room.
          </span>
        )}
      </div>
    </Screen>
  );
}

const STATE_ICON: Record<string, () => JSX.Element> = {
  "core-shell": () => (
    <Ic>
      <rect x="3" y="7" width="18" height="6" rx="1" />
      <path d="M7 13v8M17 13v8M8 7l-3 6M14 7l-4 6M20 7l-4 6" />
    </Ic>
  ),
  empty: () => <Ic><path d="M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10" /></Ic>,
  partial: ROOM_ICON["living-room"],
  redoing: () => <Ic><path d="M4 20 16 8M14 6l4 4M18 3v3M16.5 4.5h3M6 5v2M5 6h2" /></Ic>,
};

/** 1.5 · What's the state of the place? (one screen, four variants) */
export function StateOfPlace() {
  const { s, set } = useJourney();
  const cur = stateInfo(s.houseState);
  const sc = (k: (typeof ROOM_SCOPE)[number]) => {
    const line = cur.scope[k];
    const on = line.on || (s.allowInWalls && WALL_SCOPE.includes(k));
    const Icon = SCOPE_ICON[k];
    return (
      <div className={`sc${on ? "" : " off"}`} key={k}>
        <Icon />
        {line.label}
        <small>{on && !line.on ? "Flagged for a trade to check" : line.note}</small>
      </div>
    );
  };
  const toggle = (
    <button
      className={`toggle${s.allowInWalls ? " on" : ""}`}
      type="button"
      role="switch"
      aria-checked={s.allowInWalls}
      aria-label="Allow changes inside the walls"
      onClick={() => set({ allowInWalls: !s.allowInWalls })}
    />
  );
  return (
    <Screen board={cur.board} step={1} right="Question 5 of 5">
      <p className="eyebrow">Start your journey</p>
      <h1 className="h1">What's the state of the place?</h1>
      <p className="sub">Tell us where you're starting from. It decides what the design is allowed to change.</p>
      <div className="g4" style={{ marginTop: "52px" }}>
        {STATES.map((st) => {
          const Icon = STATE_ICON[st.id];
          return (
            <Opt key={st.id} tint={st.tint} className="st" sel={s.houseState === st.id} onClick={() => set({ houseState: st.id, allowInWalls: false })}>
              <span className="tile">
                <Icon />
              </span>
              <span className="opt-t">
                <Lines t={st.title} />
              </span>
            </Opt>
          );
        })}
      </div>
      {s.houseState && (
        <section className="panel lav" style={{ marginTop: "36px" }}>
          <div className="row between">
            <div className="stack" style={{ gap: "6px" }}>
              <span className="lbl">What we'll design with “{cur.lbl}”</span>
              <h2 className="h3">{cur.headline}</h2>
            </div>
            <span className="tag">{cur.tag}</span>
          </div>
          <span className="grp-l">The room</span>
          <div className="scope">{ROOM_SCOPE.map(sc)}</div>
          <span className="grp-l">Inside the walls</span>
          <div className="scope">{WALL_SCOPE.map(sc)}</div>
          {cur.id === "core-shell" && (
            <div className="row" style={{ gap: "14px", flexWrap: "nowrap", marginTop: "22px" }}>
              <I.info />
              <p className="p" style={{ fontSize: "15px" }}>
                We propose positions for every point. Your electrician, plumber and AC installer confirm what's possible before anything goes into a wall.
              </p>
            </div>
          )}
          {cur.id === "empty" && (
            <div className="allow">
              <span className="stack" style={{ gap: "2px", flex: "1 1 auto" }}>
                <b style={{ fontSize: "16px" }}>Allow small changes inside the walls</b>
                <span className="small">e.g. one extra socket or an AC point — we'll flag each one for a trade to check.</span>
              </span>
              {toggle}
            </div>
          )}
          {cur.id === "partial" && (
            <>
              <div className="next">
                <Ic style={{ color: "#7A4A1E" }}>
                  <path d="M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" />
                </Ic>
                <span style={{ fontSize: "16px", color: "#3B3350", flex: "1 1 360px" }}>
                  Coming up: we'll ask <b>what stays</b>, its size, and whether its spot is fixed.
                </span>
                <Go className="link-btn" to="S3-Existing" style={{ color: "#7A4A1E" }}>
                  Preview that step
                </Go>
              </div>
              <div className="allow">
                <span className="stack" style={{ gap: "2px", flex: "1 1 auto" }}>
                  <b style={{ fontSize: "16px" }}>Allow changes inside the walls</b>
                  <span className="small">Extra sockets, an AC point or moving a water point — each flagged for a trade to check.</span>
                </span>
                {toggle}
              </div>
            </>
          )}
          {cur.id === "redoing" && (
            <>
              <div className="next">
                <Ic style={{ color: "#665A85" }}>
                  <path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
                  <path d="M3 13a2 2 0 0 1 4 0v1h10v-1a2 2 0 0 1 4 0v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
                </Ic>
                <span style={{ fontSize: "16px", flex: "1 1 360px" }}>
                  Love something you already own? You can still <b>keep it</b> — we'll ask in a moment.
                </span>
                <Go className="link-btn" to="S3-Existing">
                  Preview that step
                </Go>
              </div>
              <div className="warn">
                <Ic style={{ color: "#7A4A1E", marginTop: "2px" }}>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16h.01" />
                </Ic>
                <p className="p" style={{ fontSize: "15px", color: "#5E3A18" }}>
                  Moving water, drains or AC can mean bigger work and, in some buildings, approvals. We flag each move — your plumber, electrician and AC installer confirm what's possible.
                </p>
              </div>
            </>
          )}
        </section>
      )}
      <div className="actions">
        <Back to="S1-Start" />
        <Go className={`btn auto${s.houseState ? "" : " dis"}`} to="S1-Summary" style={{ marginLeft: "auto" }} onClick={() => !!s.houseState}>
          Continue
          <I.next />
        </Go>
      </div>
    </Screen>
  );
}

/** 1.6 · Your project brief */
export function Brief() {
  const { s, set } = useJourney();
  const rooms = orderedRooms(s);
  const first = rooms[0];
  const intent = INTENTS.find((i) => i.id === s.intent);
  const prop = PROPERTIES.find((p) => p.id === s.propertyType);
  const brief = (k: keyof typeof s.brief, v: string) => set((p) => ({ brief: { ...p.brief, [k]: v } }));
  return (
    <Screen board="S1-Summary" step={1} right="Summary" wrapStyle={{ maxWidth: "1080px" }}>
      <p className="eyebrow">Step 1 complete · Your project</p>
      <h1 className="h1">Here's what we're working on</h1>
      <p className="sub">Check it looks right. Anything you're not sure about can stay open for now.</p>
      <JourneyStrip step={1} />
      <section className="panel" style={{ marginTop: "48px" }}>
        <div className="row between">
          <h2 className="h3">Project brief</h2>
          <Go className="link-btn" to="S1-Why">
            <Ic>
              <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM13 20h7" />
            </Ic>
            Edit answers
          </Go>
        </div>
        <div className="brief">
          <div className="bi">
            <span>Project</span>
            <b>{intent?.brief ?? "Not set"}</b>
          </div>
          <div className="bi">
            <span>Property</span>
            <b>{prop?.title ?? "Not set"}</b>
          </div>
          <div className="bi">
            <span>First room</span>
            <b>{roomName(first)}</b>
            {rooms.length > 1 && (
              <Go to="S1-Start">
                +{rooms.length - 1} more room{rooms.length > 2 ? "s" : ""}
              </Go>
            )}
          </div>
          <div className="bi">
            <span>Starting point</span>
            <b>{s.houseState ? stateInfo(s.houseState).lbl : "Not set"}</b>
          </div>
        </div>
        <div className="row" style={{ marginTop: "24px", gap: "10px" }}>
          <span className="lbl" style={{ marginRight: "6px" }}>
            In scope
          </span>
          {scopeTags(s.houseState, s.allowInWalls).map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </div>
      </section>
      <section className="panel" style={{ marginTop: "24px", background: "#F7E9DA", borderColor: "#EDD6BE" }}>
        <div className="row between">
          <div className="stack" style={{ gap: "6px" }}>
            <h2 className="h3">Your rooms — one at a time</h2>
            <p className="p" style={{ fontSize: "16px", color: "#5E3A18" }}>
              You chose {rooms.length} room{rooms.length === 1 ? "" : "s"}. We start with the {roomName(first).toLowerCase()}
              {rooms.length > 1 ? (
                <>
                  ; <b>steps 2–10 then repeat for each of the others</b>
                </>
              ) : null}
              . Your answers from step 1 carry over.
            </p>
          </div>
          <span className="tag" style={{ background: "#fff", color: "#7A4A1E" }}>
            Room 1 of {rooms.length || 1}
          </span>
        </div>
        <div className="g4" style={{ marginTop: "18px", gap: "12px" }}>
          {rooms.map((r, i) => {
            const Icon = ROOM_ICON_SM[r] ?? ROOM_ICON_SM["living-room"];
            return (
              <div
                key={r}
                className={`rmi${i === 0 ? " cur" : ""}`}
                style={
                  i === 0
                    ? { padding: "14px 16px", borderRadius: "14px", background: "#fff", border: "2px solid #3E6B55" }
                    : { padding: "14px 16px", borderRadius: "14px", background: "rgba(255,255,255,.6)", borderTop: "0" }
                }
              >
                <Icon />
                <b>{roomName(r)}</b>
                <span className="st">{i === 0 ? "Now" : ordinal(i + 1)}</span>
              </div>
            );
          })}
        </div>
      </section>
      <section className="panel tint" style={{ marginTop: "24px" }}>
        <div className="row between">
          <div className="stack" style={{ gap: "6px" }}>
            <h2 className="h3">Good to know — optional for now</h2>
            <p className="p" style={{ fontSize: "16px" }}>
              Add these now or when you reach the buying list. Until then they show as{" "}
              <span className="tag tbc" style={{ verticalAlign: "middle" }}>
                TBC
              </span>
            </p>
          </div>
        </div>
        <div className="opt-g">
          <div className="field">
            <label htmlFor="b">Budget for this room</label>
            <select id="b" className="select" value={s.brief.budget ?? BUDGETS[0]} onChange={(e) => brief("budget", e.target.value)}>
              {BUDGETS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="t">When would you like it done?</label>
            <select id="t" className="select" value={s.brief.when ?? TIMINGS[0]} onChange={(e) => brief("when", e.target.value)}>
              {TIMINGS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="c">City or postcode</label>
            <input id="c" className="input" placeholder="Helps us show shops and trades near you" value={s.brief.city ?? ""} onChange={(e) => brief("city", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="r">Any renovation restrictions?</label>
            <select id="r" className="select" value={s.brief.restrictions ?? RESTRICTIONS[0]} onChange={(e) => brief("restrictions", e.target.value)}>
              {RESTRICTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
      </section>
      <div className="actions">
        <Back to="S1-State" />
        <Go
          className="btn auto"
          to="S2-Vision"
          style={{ marginLeft: "auto" }}
          onClick={() => {
            void saveStep1(s).then((ids) => ids && set({ ...ids, done: Array.from(new Set([...s.done, 1])) }));
          }}
        >
          Continue to step 2: Inspiration
          <I.next />
        </Go>
      </div>
    </Screen>
  );
}
