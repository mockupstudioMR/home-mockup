import { useEffect, useRef, useState } from "react";

/**
 * "How a room gets built — in eighteen moves"
 * An animated layer film: each beat adds the next construction layer to the
 * room section drawing. Click any line to jump to that move.
 */

const NAMES = [
  "Electricity",
  "Plumbing",
  "Electrical machines",
  "Things that use water",
  "Walls & ceiling",
  "Floor",
  "Electricity interface & testing",
  "Main furniture",
  "Complementary pieces",
  "Fixed lights",
  "Lamps",
  "Storage",
  "Soft layers",
  "On the walls",
  "Decorative objects",
  "Waste",
  "Maintenance kit",
  "Everyday basics",
];

const BEATS = [
  "Cables and socket boxes go into the open wall.",
  "Water in, waste out. Pipes before anything closes.",
  "Oven, hob, fridge chosen now — their sizes rule the kitchen.",
  "Sink and tap chosen now — they fix the worktop cut-out.",
  "Walls boarded, plastered, primed. Wet work, done first.",
  "Floor laid across all three zones in one run.",
  "Sockets and switches on, circuits tested, paint dry.",
  "The four big pieces land: island, table, sofa, sideboard.",
  "Stools, chairs and small tables fill in around them.",
  "Pendants and wall lights hung to the real heights.",
  "Lamps plugged in. Light at three different heights.",
  "Baskets, boxes, inserts. Everything gets a home.",
  "Rug, curtains, cushions. The room stops echoing.",
  "Art, mirrors, hooks. All the drilling in one go.",
  "A few large objects. Nothing on the island.",
  "Bins, in a cabinet, before you need them.",
  "The right cleaners for wood, stone and bouclé.",
  "Towels, soap, spare bulbs. Now the room works.",
];

type Shape = {
  n: number;
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  fill: string;
  stroke?: string;
  dash?: string;
};

const FILM: Shape[] = [
  { n: 0, x: 60, y: 56, w: 790, h: 12, r: 2, fill: "#4A4059" },
  { n: 0, x: 60, y: 68, w: 24, h: 266, r: 0, fill: "#4A4059" },
  { n: 0, x: 60, y: 334, w: 790, h: 16, r: 2, fill: "#4A4059" },
  { n: 1, x: 66, y: 120, w: 8, h: 120, r: 4, fill: "#C97F5E" },
  { n: 1, x: 62, y: 240, w: 18, h: 18, r: 3, fill: "#C97F5E" },
  { n: 2, x: 84, y: 150, w: 8, h: 184, r: 4, fill: "#7E9AB0" },
  { n: 3, x: 250, y: 254, w: 74, h: 80, r: 4, fill: "none", stroke: "#8E7FA6", dash: "4 5" },
  { n: 4, x: 344, y: 254, w: 64, h: 22, r: 4, fill: "none", stroke: "#8E7FA6", dash: "4 5" },
  { n: 5, x: 84, y: 68, w: 16, h: 266, r: 0, fill: "#EFE6E1" },
  { n: 5, x: 100, y: 68, w: 750, h: 14, r: 0, fill: "#EFE6E1" },
  { n: 6, x: 100, y: 318, w: 750, h: 16, r: 0, fill: "#A3785F" },
  { n: 7, x: 110, y: 246, w: 20, h: 20, r: 3, fill: "#D9D0C4" },
  { n: 8, x: 230, y: 246, w: 180, h: 72, r: 4, fill: "#425D73" },
  { n: 8, x: 224, y: 238, w: 192, h: 10, r: 3, fill: "#D9D0C4" },
  { n: 8, x: 560, y: 264, w: 210, h: 54, r: 8, fill: "#B8B3AE" },
  { n: 9, x: 426, y: 282, w: 26, h: 36, r: 5, fill: "#734F38" },
  { n: 9, x: 460, y: 282, w: 26, h: 36, r: 5, fill: "#734F38" },
  { n: 10, x: 316, y: 82, w: 4, h: 76, r: 2, fill: "#BEA774" },
  { n: 10, x: 294, y: 158, w: 48, h: 18, r: 9, fill: "#BEA774" },
  { n: 11, x: 806, y: 206, w: 6, h: 112, r: 3, fill: "#BEA774" },
  { n: 11, x: 788, y: 176, w: 42, h: 32, r: 6, fill: "#D9D0C4" },
  { n: 12, x: 500, y: 284, w: 44, h: 34, r: 6, fill: "#BEA774" },
  { n: 13, x: 540, y: 318, w: 250, h: 8, r: 4, fill: "#898B7F" },
  { n: 13, x: 824, y: 68, w: 26, h: 250, r: 6, fill: "#D9D0C4" },
  { n: 14, x: 610, y: 120, w: 96, h: 66, r: 3, fill: "#734F38" },
  { n: 15, x: 352, y: 206, w: 22, h: 32, r: 6, fill: "#D9D0C4" },
  { n: 16, x: 168, y: 274, w: 36, h: 44, r: 5, fill: "#898B7F" },
  { n: 17, x: 130, y: 288, w: 28, h: 30, r: 4, fill: "#7E9AB0" },
  { n: 18, x: 504, y: 262, w: 36, h: 22, r: 3, fill: "#EFE6E1" },
];

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

interface LayerFilmProps {
  loop?: boolean;
  beatMs?: number;
  className?: string;
}

export function LayerFilm({ loop = true, beatMs = 1150, className }: LayerFilmProps) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const playingRef = useRef(playing);
  playingRef.current = playing;

  useEffect(() => {
    const timer = setInterval(() => {
      if (!playingRef.current) return;
      setStep((s) => {
        if (s < 18) return s + 1;
        if (loop) return 0;
        setPlaying(false);
        return s;
      });
    }, beatMs);
    return () => clearInterval(timer);
  }, [loop, beatMs]);

  const stepNum = step === 0 ? "00" : pad(step);
  const stepName = step === 0 ? "Empty shell" : NAMES[step - 1];
  const stepBeat =
    step === 0 ? "Bare walls, bare screed. Eighteen layers from here." : BEATS[step - 1];
  const playCta = playing ? "Pause" : step >= 18 ? "Play again" : "Play";

  return (
    <div
      className={className}
      style={{
        background: "#2A2336",
        color: "#F7F1ED",
        fontFamily: "'Work Sans', Helvetica, Arial, sans-serif",
      }}
    >
      <div className="mx-auto w-full max-w-[1080px] px-6 py-10 sm:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-5">
          <div
            className="text-[11px] font-semibold uppercase"
            style={{ letterSpacing: ".16em", color: "#C9AFA4" }}
          >
            How a room gets built — in eighteen moves
          </div>
          <button
            type="button"
            onClick={() => {
              if (playing) setPlaying(false);
              else {
                if (step >= 18) setStep(0);
                setPlaying(true);
              }
            }}
            className="rounded-full px-4 py-[7px] text-[12.5px] font-semibold transition-colors"
            style={{ background: "#E9CEC1", color: "#2A2336" }}
          >
            {playCta}
          </button>
        </div>

        <div className="mt-5 grid items-start gap-8 lg:grid-cols-[1.6fr_minmax(260px,1fr)]">
          <div>
            <svg viewBox="0 0 910 380" className="block h-auto w-full">
              {FILM.map((f, i) => {
                const on = f.n <= step;
                return (
                  <rect
                    key={i}
                    x={f.x}
                    y={f.y}
                    width={f.w}
                    height={f.h}
                    rx={f.r}
                    fill={f.fill}
                    stroke={f.stroke || "none"}
                    strokeDasharray={f.dash || "0"}
                    opacity={on ? 1 : 0}
                    transform={on ? "translate(0,0)" : "translate(0,14)"}
                    style={{ transition: "opacity .5s ease, transform .5s ease" }}
                  />
                );
              })}
            </svg>
            <div className="mt-4 flex items-baseline gap-[18px]">
              <div
                className="min-w-[56px] text-[40px] leading-none"
                style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: "#6E5F80" }}
              >
                {stepNum}
              </div>
              <div>
                <div
                  className="text-[28px] leading-[1.15]"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: "#F7F1ED" }}
                >
                  {stepName}
                </div>
                <div className="mt-1 text-[15px] leading-[1.55]" style={{ color: "#BDB0C4" }}>
                  {stepBeat}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div
              className="pb-2 text-[11px] font-semibold uppercase"
              style={{ letterSpacing: ".14em", color: "#7A6B8C" }}
            >
              Click any line to see that move
            </div>
            {NAMES.map((nm, i) => {
              const n = i + 1;
              const cur = n === step;
              const past = n < step;
              return (
                <div
                  key={nm}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setStep(n);
                    setPlaying(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setStep(n);
                      setPlaying(false);
                    }
                  }}
                  className="flex cursor-pointer items-baseline gap-3 px-[10px] py-[7px] transition-colors"
                  style={{
                    borderLeft: `2px solid ${
                      cur ? "#C97F5E" : past ? "rgba(233,206,193,.5)" : "rgba(233,206,193,.16)"
                    }`,
                    background: cur ? "rgba(233,206,193,.14)" : "transparent",
                  }}
                >
                  <div
                    className="w-[18px] flex-none text-[11.5px] font-semibold tabular-nums"
                    style={{ color: cur ? "#E9CEC1" : past ? "#9C8CA8" : "#5C4F6E" }}
                  >
                    {pad(n)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-sm font-medium"
                      style={{ color: cur ? "#F7F1ED" : past ? "#C3B6CC" : "#7A6B8C" }}
                    >
                      {nm}
                    </div>
                    {cur && (
                      <div
                        className="mt-[3px] text-[12.5px] leading-[1.5]"
                        style={{ color: "#A697B4" }}
                      >
                        {BEATS[i]}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LayerFilm;
