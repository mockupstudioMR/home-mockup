/** The end-of-step summary every step shares (2.8, 3.5, 4.4 … 9.4). */
import type { ReactNode } from "react";
import { Back, Go, Screen } from "./Shell";
import { I, ROOM_ICON_SM } from "./icons";
import { STEP_NAMES, STEP_TITLES, roomName } from "./data";
import { curRoom, orderedRooms, useJourney } from "./state";
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
  const current = curRoom(s) ?? orderedRooms(s)[0];
  const rooms = [current, ...orderedRooms(s).filter((r) => r !== current)].filter(Boolean) as string[];
  const left = rooms.filter((r) => r !== current && !s.roomsDone.includes(r)).length;
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
              <span className="st">{i === 0 ? `Step ${step} of 10 ✓` : s.roomsDone.includes(r) ? "✓ Done" : "Not started"}</span>
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

/** The other rooms still waiting, as one short line. */
function RoomsLine() {
  const { s } = useJourney();
  const current = curRoom(s) ?? orderedRooms(s)[0];
  const left = orderedRooms(s).filter((r) => r !== current && !s.roomsDone.includes(r)).length;
  if (!current) return null;
  return (
    <div className="sm-rooms">
      <I.repeat />
      <span>
        <b>Rooms still to design: {left}</b>
        {left ? ` — after the ${roomName(current).toLowerCase()}, steps 2–10 repeat for each room.` : " — this is the last one."}
      </span>
    </div>
  );
}

/**
 * The end-of-step summary every step shares, in the compact style: a short centred heading, the 10 steps as one
 * row of pills, what was decided (with its pictures as taped photos) on the left, and what's still open and the
 * project so far on the right.
 */
export function StepSummary({
  step, board, sub, title, media, decisions, open, soFar, back, next, nextLabel,
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
  /** Kept for callers; the compact summary always lists decisions in their own block. */
  decWrap?: boolean;
}) {
  return (
    <Screen board={board} step={step} right="Summary" wrapStyle={{ maxWidth: "1160px" }}>
      <div className="sm">
        <p className="script">
          Step {step} complete · {STEP_TITLES[step]}
        </p>
        <h1 className="sm-h1">
          Here's where we <span className="brush">stand</span>
        </h1>
        <p className="sm-sub">{sub}</p>
        <nav className="sm-strip" aria-label="Your journey">
          {STEP_NAMES.slice(1).map((name, i) => {
            const n = i + 1;
            const cls = n < step ? "done" : n === step ? "now" : n === step + 1 ? "next" : "";
            return (
              <span key={n} className={cls}>
                <i>{n <= step ? "✓" : n}</i>
                {name}
              </span>
            );
          })}
        </nav>
        <div className="sm-cols">
          <section className="sm-main">
            <h2 className="sm-h2">{title ?? `What we decided in step ${step}`}</h2>
            {media && <div className="sm-media">{media}</div>}
            <dl className="sm-decs">
              {decisions.map((d) => (
                <div className="sm-dec" key={d.k}>
                  <dt>{d.k}</dt>
                  <dd>{d.v}</dd>
                  {d.edit && (
                    <Go className="ed" to={d.edit} extra={d.editExtra}>
                      {d.editLabel ?? "Edit"}
                    </Go>
                  )}
                </div>
              ))}
            </dl>
          </section>
          <aside className="sm-side">
            <div>
              <h2 className="sm-hand">Still open</h2>
              <ul className="sm-open">
                {open.length ? (
                  open.map((o) => (
                    <li key={o}>
                      <i aria-hidden="true" />
                      {o}
                    </li>
                  ))
                ) : (
                  <li className="ok">Nothing open for this step.</li>
                )}
              </ul>
            </div>
            <div className="sm-sep">
              <h2 className="sm-hand">Your project so far</h2>
              <ol className="sm-sofar">
                {soFar.map(([n, t]) => (
                  <li key={n} className={Number(n) === step ? "now" : ""}>
                    <span>{n}</span>
                    <b>{t}</b>
                  </li>
                ))}
              </ol>
            </div>
            <RoomsLine />
          </aside>
        </div>
        <div className="sm-foot">
          <Back to={back} />
          <Go className="btn auto" to={next}>
            {nextLabel ?? `Next: ${STEP_TITLES[step + 1]}`}
            <I.next />
          </Go>
        </div>
      </div>
    </Screen>
  );
}
