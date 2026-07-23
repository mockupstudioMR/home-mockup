import { getThumbnailImageUrl } from "@/lib/imageOptimization";
import ImageWithLoader from "./ImageWithLoader";
import { Pin } from "lucide-react";

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

type Tile =
  | { kind: "image"; src?: string; label?: string; span: string; pinned?: boolean }
  | { kind: "colors"; colors: string[]; span: string };

const ImageTile = ({
  src,
  label,
  pinned,
}: {
  src?: string;
  label?: string;
  pinned?: boolean;
}) => (
  <div
    className={
      "group relative w-full h-full overflow-hidden rounded-sm bg-muted " +
      (pinned
        ? "ring-2 ring-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.15),0_10px_24px_-8px_hsl(var(--primary)/0.5)]"
        : "")
    }
  >
    <ImageWithLoader
      src={src ? getThumbnailImageUrl(src) : undefined}
      alt={label || ""}
      loading="lazy"
      decoding="async"
    />
    {pinned && (
      <>
        <span className="absolute inset-0 pointer-events-none bg-gradient-to-t from-primary/25 via-transparent to-transparent" />
        <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider shadow-md">
          <Pin className="w-3 h-3" fill="currentColor" />
          Pinned
        </span>
      </>
    )}
    {label && (
      <div
        className="absolute bottom-0 left-0 right-0 px-2 py-1 text-center text-foreground/85 bg-card/85 backdrop-blur-[2px]"
        style={{ fontFamily: "'Caveat', cursive", fontSize: "0.9rem" }}
      >
        {label}
      </div>
    )}
  </div>
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
  // Build an ordered tile list. Must-includes first (largest + highlighted),
  // then inspiration, architecture, furniture, materials, decor. Colors slot
  // in as a single tile. Sizes vary to feel like a real moodboard.
  const tiles: Tile[] = [];

  mustInclude.forEach((m, i) => {
    tiles.push({
      kind: "image",
      src: m.imageUrl,
      label: m.label,
      pinned: true,
      span: i === 0 ? "col-span-3 row-span-3" : "col-span-2 row-span-2",
    });
  });

  inspiration.slice(0, 3).forEach((img, i) => {
    tiles.push({
      kind: "image",
      src: img,
      span: i === 0 ? "col-span-2 row-span-2" : "col-span-2 row-span-1",
    });
  });

  architecture.forEach((a, i) => {
    tiles.push({
      kind: "image",
      src: a.imageUrl,
      label: a.label,
      span: i % 2 === 0 ? "col-span-2 row-span-2" : "col-span-2 row-span-1",
    });
  });

  if (colors.length > 0) {
    tiles.push({ kind: "colors", colors, span: "col-span-2 row-span-1" });
  }

  furniture.forEach((f, i) => {
    tiles.push({
      kind: "image",
      src: f.imageUrl,
      label: f.label,
      span: i === 0 ? "col-span-3 row-span-2" : "col-span-2 row-span-2",
    });
  });

  materials.forEach((m) => {
    tiles.push({
      kind: "image",
      src: m.imageUrl,
      label: m.label,
      span: "col-span-1 row-span-1",
    });
  });

  decor.forEach((d) => {
    tiles.push({
      kind: "image",
      src: d.imageUrl,
      label: d.label,
      span: "col-span-1 row-span-1",
    });
  });

  return (
    <div
      className="relative rounded-2xl p-4 md:p-6 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--secondary) / 0.45), hsl(var(--muted) / 0.6))",
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
          className="relative text-center mb-5 text-foreground/70"
          style={{ fontFamily: "'Caveat', cursive", fontSize: "1.3rem" }}
        >
          {headline}
        </div>
      )}

      {/* One unified image: tight tiled grid, no gaps between tiles. */}
      <div
        className="relative grid gap-1.5 md:gap-2 auto-rows-[70px] md:auto-rows-[90px] grid-cols-6 md:grid-cols-8"
      >
        {tiles.map((t, i) => {
          if (t.kind === "colors") {
            return (
              <div
                key={`t-${i}`}
                className={`${t.span} flex overflow-hidden rounded-sm shadow-[0_6px_16px_-8px_hsl(var(--foreground)/0.35)]`}
              >
                {t.colors.slice(0, 6).map((c, ci) => (
                  <div key={ci} className="flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>
            );
          }
          if (t.kind !== "image") return null;
          return (
            <div key={`t-${i}`} className={`${t.span} min-h-0`}>
              <ImageTile src={t.src} label={t.label} pinned={t.pinned} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MoodboardCollage;