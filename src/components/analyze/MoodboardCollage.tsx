import { getThumbnailImageUrl } from "@/lib/imageOptimization";

interface MoodboardItem {
  label: string;
  imageUrl?: string;
}

interface MoodboardCollageProps {
  inspiration: string[];
  colors: string[];
  materials: MoodboardItem[];
  architecture: MoodboardItem[];
  furniture: MoodboardItem[];
  decor: MoodboardItem[];
  mustInclude: MoodboardItem[];
  headline?: string;
}

// Deterministic pseudo-random helpers so the layout stays stable across renders
const seeded = (i: number, salt = 0) => {
  const x = Math.sin(i * 9301 + salt * 49297) * 233280;
  return x - Math.floor(x);
};
const rot = (i: number, range = 8, salt = 0) => (seeded(i, salt) - 0.5) * range * 2;

const Polaroid = ({
  src,
  caption,
  index,
  size = "md",
  salt = 0,
}: {
  src?: string;
  caption?: string;
  index: number;
  size?: "sm" | "md" | "lg";
  salt?: number;
}) => {
  const dims = size === "lg" ? "w-44 h-52" : size === "sm" ? "w-24 h-28" : "w-32 h-36";
  const r = rot(index, 7, salt);
  return (
    <div
      className="bg-card p-2 pb-6 shadow-[0_10px_24px_-10px_hsl(var(--foreground)/0.4),0_3px_6px_-3px_hsl(var(--foreground)/0.25)] rounded-sm inline-block"
      style={{ transform: `rotate(${r}deg)` }}
    >
      {src ? (
        <img
          src={getThumbnailImageUrl(src)}
          alt={caption || ""}
          className={`${dims} object-cover`}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className={`${dims} bg-muted animate-pulse`} />
      )}
      {caption && (
        <div
          className="mt-1 text-center text-foreground/70 leading-tight"
          style={{ fontFamily: "'Caveat', cursive", fontSize: "0.95rem" }}
        >
          {caption}
        </div>
      )}
    </div>
  );
};

const Tape = ({ className = "" }: { className?: string }) => (
  <span
    aria-hidden
    className={`absolute w-10 h-3 bg-foreground/10 backdrop-blur-[1px] rounded-[1px] ${className}`}
  />
);

const MoodboardCollage = ({
  inspiration,
  colors,
  materials,
  architecture,
  furniture,
  decor,
  mustInclude,
  headline,
}: MoodboardCollageProps) => {
  return (
    <div
      className="relative rounded-2xl p-6 md:p-10 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--secondary) / 0.35), hsl(var(--muted) / 0.5))",
        boxShadow:
          "inset 0 0 60px hsl(var(--foreground) / 0.08), 0 10px 30px -12px hsl(var(--foreground) / 0.25)",
      }}
    >
      {/* subtle paper grain */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.15] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />

      {headline && (
        <div
          className="relative text-center mb-6 text-foreground/70"
          style={{ fontFamily: "'Caveat', cursive", fontSize: "1.3rem" }}
        >
          {headline}
        </div>
      )}

      <div className="relative flex flex-wrap items-start justify-center gap-4 md:gap-5">
        {/* Must-include — biggest, front-and-center */}
        {mustInclude.map((m, i) => (
          <div key={`must-${i}`} className="relative">
            <Tape className="left-1/2 -translate-x-1/2 -top-1 rotate-[-6deg]" />
            <Polaroid src={m.imageUrl} caption={m.label} index={i} size="lg" salt={1} />
          </div>
        ))}

        {/* Inspiration polaroids */}
        {inspiration.slice(0, 4).map((img, i) => (
          <div key={`insp-${i}`} className="relative">
            <Tape className="left-1/2 -translate-x-1/2 -top-1 rotate-[3deg]" />
            <Polaroid src={img} index={i} size="md" salt={2} />
          </div>
        ))}

        {/* Architecture references */}
        {architecture.map((a, i) => (
          <Polaroid
            key={`arch-${i}`}
            src={a.imageUrl}
            caption={a.label}
            index={i}
            size="md"
            salt={3}
          />
        ))}

        {/* Color swatch strip — like a paint chip */}
        {colors.length > 0 && (
          <div
            className="bg-card p-2 shadow-[0_8px_20px_-10px_hsl(var(--foreground)/0.4)] rounded-sm"
            style={{ transform: `rotate(${rot(0, 5, 7)}deg)` }}
          >
            <div className="flex flex-col">
              {colors.slice(0, 6).map((c, i) => (
                <div key={c + i} className="flex items-center gap-2 px-1 py-1">
                  <span
                    className="block w-16 h-8 rounded-sm border border-foreground/10"
                    style={{ backgroundColor: c }}
                  />
                  <span
                    className="text-foreground/60 uppercase tracking-wider"
                    style={{ fontFamily: "'Caveat', cursive", fontSize: "0.85rem" }}
                  >
                    {c}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Materials — fabric/texture squares */}
        {materials.map((m, i) => (
          <div
            key={`mat-${i}`}
            className="relative bg-card p-1.5 shadow-[0_6px_16px_-8px_hsl(var(--foreground)/0.35)] rounded-sm"
            style={{ transform: `rotate(${rot(i, 10, 4)}deg)` }}
          >
            {m.imageUrl ? (
              <img
                src={getThumbnailImageUrl(m.imageUrl)}
                alt={m.label}
                className="w-24 h-24 object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-24 h-24 bg-muted animate-pulse" />
            )}
            <div
              className="mt-1 text-center text-foreground/70 leading-tight"
              style={{ fontFamily: "'Caveat', cursive", fontSize: "0.85rem" }}
            >
              {m.label}
            </div>
          </div>
        ))}

        {/* Furniture — varied sizes */}
        {furniture.map((f, i) => (
          <Polaroid
            key={`furn-${i}`}
            src={f.imageUrl}
            caption={f.label}
            index={i}
            size={i % 3 === 0 ? "lg" : "md"}
            salt={5}
          />
        ))}

        {/* Decor — smaller accents */}
        {decor.map((d, i) => (
          <Polaroid
            key={`dec-${i}`}
            src={d.imageUrl}
            caption={d.label}
            index={i}
            size="sm"
            salt={6}
          />
        ))}
      </div>
    </div>
  );
};

export default MoodboardCollage;