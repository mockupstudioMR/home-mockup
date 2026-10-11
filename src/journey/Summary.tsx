/** The end-of-step summary every step shares (2.8, 3.5, 4.4 … 9.4). */
import type { ReactNode } from "react";
import { Back, Go, Screen } from "./Shell";
import { I, ROOM_ICON_SM } from "./icons";
import { STEP_NAMES, STEP_TITLES, roomName } from "./data";
import { orderedRooms, useJourney } from "./state";
import type { ScreenId } from "./routes";

export type Decision = { k: string; v: ReactNode; edit?: ScreenId; editLabel?: string; editExtra?: string };

/** The 10-step strip: done steps ticked, this one highlighted, the next one dashed. */
export function JourneyStrip({ step }: { step: number }) {
  return (
    <nav className="jr" aria-label="Your journey">
      {STEP_NAMES.slice(1).map((name, i) => {
        const n = i + 1;
        const cls = n < step ? "s done" : n === step ? "s now" : n === step + 1 ? "s next" : "s";
        return (
          <span key={n} className={cls}>
            <i>{n <= step ? "✓" : n}</i>
            {name}
          </span>
        );
      })}
    </nav>
  );
}

/** Rail card: the other rooms, waiting their turn. */
export function RoomsLeft({ step }: { step: number }) {
  const { s } = useJourney();
  const rooms = orderedRooms(s);
  const current = rooms[0];
  const left = Math.max(0, rooms.length - 1);
  return (
    <div className="rail-card rooms">
      <div className="row between">
        <h2 className="h3">Rooms still to design</h2>
        <span className="tag" style={{ background: "#fff", color: "#7A4A1E" }}>
          {left} left
        </span>
      </div>
      <div>
        {rooms.map((r, i) => {
          const Icon = ROOM_ICON_SM[r] ?? ROOM_ICON_SM["living-room"];
          return (
            <div key={r} className={`rmi${i === 0 ? " cur" : ""}`}>
              <Icon />
              <b>{roomName(r)}</b>
              <span className="st">{i === 0 ? `Step ${step} of 10 ✓` : "Not started"}</span>
            </div>
          );
        })}
      </div>
      <div className="rep">
        <I.repeat />
        <span>
          After the {roomName(current).toLowerCase()}, <b>steps 2–10 repeat for each room</b>. Your project basics from step 1 carry over.
        </span>
      </div>
    </div>
  );
}

export function StepSummary({
  step, board, sub, title, media, decisions, open, soFar, back, next, nextLabel, decWrap,
}: {
  step: number;
  board: string;
  sub: string;
  title?: string;
  media?: ReactNode;
  decisions: Decision[];
  open: string[];
  soFar: [string, string][];
  back: ScreenId;
  next: ScreenId;
  nextLabel?: string;
  /** Decisions sit in their own block (no picture above them). */
  decWrap?: boolean;
}) {
  const decs = decisions.map((d) => (
    <div className="dec" key={d.k}>
      <span className="k">{d.k}</span>
      <span className="v">{d.v}</span>
      {d.edit && (
        <Go className="ed" to={d.edit} extra={d.editExtra}>
          {d.editLabel ?? "Edit"}
        </Go>
      )}
    </div>
  ));
  return (
    <Screen board={board} step={step} right="Summary" wrapStyle={{ maxWidth: "1160px" }}>
      <p className="eyebrow">
        Step {step} complete · {STEP_TITLES[step]}
      </p>
      <h1 className="h1">Here's where we stand</h1>
      <p className="sub">{sub}</p>
      <JourneyStrip step={step} />
      <div className="split" style={{ marginTop: "32px" }}>
        <section className="panel main">
          <h2 className="h3">{title ?? `What we decided in step ${step}`}</h2>
          {media}
          {decWrap ? <div style={{ marginTop: "12px" }}>{decs}</div> : decs}
        </section>
        <aside className="rail stack" style={{ gap: "20px" }}>
          <RoomsLeft step={step} />
          <div className="rail-card">
            <h2 className="h3">Still open</h2>
            <div>
              {open.length ? (
                open.map((o) => (
                  <div className="ol" key={o}>
                    <i>!</i>
                    {o}
                  </div>
                ))
              ) : (
                <div className="ol" style={{ color: "var(--ok)" }}>
                  Nothing open for this step.
                </div>
              )}
            </div>
          </div>
          <div className="rail-card">
            <h2 className="h3">Your project so far</h2>
            <div className="sofar">
              {soFar.map(([n, t]) => (
                <div key={n}>
                  <span>{n}</span>
                  <b>{t}</b>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
      <div className="actions">
        <Back to={back} />
      </div>
      <Go className="btn next-btn" to={next} style={{ marginTop: "16px" }}>
        {nextLabel ?? `Continue to step ${step + 1}: ${STEP_TITLES[step + 1]}`}
        <I.next />
      </Go>
    </Screen>
  );
}
