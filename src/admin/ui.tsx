/** Admin frame and small parts, drawn with the classes of the admin design boards. */
import type { CSSProperties, ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Ic, I } from "@/journey/icons";
import type { Term } from "@/admin/data";
import "@/journey/mu.css";
import "./admin.css";
import "./boards.css";

const p = (d: string) => <path d={d} />;

export type Section =
  | "home" | "scan" | "review" | "vocabulary" | "schemes" | "styles" | "sizes" | "products" | "projects" | "users" | "cms" | "analytics" | "billing";

export const NAV_ICON: Record<Section, () => JSX.Element> = {
  home: () => <I.home />,
  scan: () => <Ic>{p("M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16")}</Ic>,
  review: () => <Ic>{p("M4 13h4l2 3h4l2-3h4M4 13l2-8h12l2 8v6H4z")}</Ic>,
  vocabulary: () => <Ic>{p("M3 12V4h8l10 10-8 8zM7.5 7.5h.01")}</Ic>,
  schemes: () => <Ic>{p("M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z")}</Ic>,
  styles: () => <Ic>{p("M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8zM7.5 11h.01M10 7h.01M15 7h.01")}</Ic>,
  sizes: () => <I.ruler />,
  products: () => <Ic>{p("M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2")}</Ic>,
  projects: () => <Ic>{p("M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z")}</Ic>,
  users: () => <Ic>{p("M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7M18 14a6 6 0 0 1 4 7")}</Ic>,
  cms: () => <Ic>{p("M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5")}</Ic>,
  analytics: () => <Ic>{p("M4 20V10M10 20V4M16 20v-7M22 20H2")}</Ic>,
  billing: () => <Ic>{p("M3 6h18v12H3zM3 10h18M7 15h3")}</Ic>,
};

export function useCounts() {
  return useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const head = { count: "exact" as const, head: true };
      const [waiting, proposed, pendingShops] = await Promise.all([
        supabase.from("detected_pieces").select("id", head).eq("status", "waiting"),
        supabase.from("taxonomy_terms").select("id", head).eq("status", "proposed"),
        supabase.from("shops").select("id", head).eq("status", "pending"),
      ]);
      const [{ data: used }, { data: sized }] = await Promise.all([
        supabase.from("furniture_schemes").select("category_id").eq("status", "active").limit(5000),
        supabase.from("furniture_specs").select("category_term_id").not("category_term_id", "is", null),
      ]);
      const sizedSet = new Set((sized ?? []).map((s) => s.category_term_id));
      const missingSizes = new Set((used ?? []).map((u) => u.category_id).filter((c) => !sizedSet.has(c))).size;
      return { waiting: waiting.count ?? 0, proposed: proposed.count ?? 0, pendingShops: pendingShops.count ?? 0, missingSizes };
    },
    refetchInterval: 60_000,
  });
}

/** Admin address: /admin?section=…&… */
export const adminHref = (section: Section, extra: Record<string, string> = {}) => {
  const q = new URLSearchParams(section === "home" ? extra : { section, ...extra }).toString();
  return `/admin${q ? `?${q}` : ""}`;
};

export function useAdminNav() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  return {
    params,
    go: (section: Section, extra: Record<string, string> = {}) => {
      navigate(adminHref(section, extra));
      window.scrollTo({ top: 0 });
    },
  };
}

/** A link inside the admin. */
export function A({ to, extra, className, style, children, ariaLabel }: { to: Section; extra?: Record<string, string>; className?: string; style?: CSSProperties; children: ReactNode; ariaLabel?: string }) {
  return (
    <Link to={adminHref(to, extra)} className={className} style={style} aria-label={ariaLabel} onClick={() => window.scrollTo({ top: 0 })}>
      {children}
    </Link>
  );
}

const GROUPS: { label: string; items: { id: Section; label: string; count?: "waiting" | "proposed" | "missingSizes" | "pendingShops"; soon?: boolean }[] }[] = [
  { label: "Overview", items: [{ id: "home", label: "Admin home" }] },
  { label: "Feed", items: [{ id: "scan", label: "Scan & upload" }, { id: "review", label: "Review queue", count: "waiting" }] },
  {
    label: "Curate",
    items: [
      { id: "vocabulary", label: "Vocabulary", count: "proposed" },
      { id: "schemes", label: "Schemes & combinations" },
      { id: "styles", label: "Styles & palettes" },
      { id: "sizes", label: "Sizes, scope & config", count: "missingSizes" },
      { id: "products", label: "Products & shops", count: "pendingShops" },
    ],
  },
  {
    label: "Run",
    items: [
      { id: "projects", label: "Projects support" },
      { id: "users", label: "Users & invites" },
      { id: "cms", label: "CMS & settings" },
      { id: "analytics", label: "Analytics" },
      { id: "billing", label: "Billing", soon: true },
    ],
  },
];

/** Top bar of every admin screen. */
export function AdminTop({ right }: { right?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="top">
      <Link className="brand" to="/admin">
        <span className="brand-mark">
          <I.home />
        </span>
        Home Mockup
      </Link>
      <span className="adm-tag">Admin</span>
      <form
        className="search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const q = new FormData(e.currentTarget).get("q")?.toString().trim();
          if (q) navigate(adminHref("vocabulary", { q }));
        }}
      >
        <label className="sr" htmlFor="q">
          Search admin
        </label>
        <Ic>
          <circle cx="11" cy="11" r="7" />
          {p("M20 20l-4-4")}
        </Ic>
        <input id="q" name="q" className="input" placeholder="Search users, projects, schemes, terms" />
      </form>
      <div className="top-actions">
        {right ?? (
          <Link className="link-btn" to="/journey">
            View app
          </Link>
        )}
        <Link className="avatar" aria-label="Account" to="/my-stats">
          <I.user />
        </Link>
      </div>
    </header>
  );
}

export function AdminShell({ board, section, children }: { board: string; section: Section; children: ReactNode }) {
  const { data: counts } = useCounts();
  return (
    <div className={`mu mua app ab-${board}`} data-board={board}>
      <div className="blob" />
      <AdminTop />
      <div className="adm">
        <nav className="side" aria-label="Admin">
          {GROUPS.map((g) => (
            <div key={g.label} style={{ display: "contents" }}>
              <div className="nav-g">{g.label}</div>
              {g.items.map((it) => {
                const Icon = NAV_ICON[it.id];
                const n = it.count ? counts?.[it.count] : undefined;
                return (
                  <A key={it.id} to={it.id} className={`nv${section === it.id ? " on" : ""}`}>
                    <Icon />
                    {it.label}
                    {n ? <span className="cnt">{n}</span> : null}
                    {it.soon && <span className="soon">Soon</span>}
                  </A>
                );
              })}
            </div>
          ))}
        </nav>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

export function Crumb({ items }: { items: (string | [string, Section, Record<string, string>?])[] }) {
  return (
    <div className="crumb">
      <A to="home">Admin</A>
      {items.map((it, i) => (
        <span key={i} style={{ display: "contents" }}>
          <span>›</span>
          {typeof it === "string" ? (
            <span>{it}</span>
          ) : (
            <A to={it[1]} extra={it[2]}>
              {it[0]}
            </A>
          )}
        </span>
      ))}
    </div>
  );
}

/** Status badge in the board's colours. */
export function Bdg({ status, children }: { status: string; children?: ReactNode }) {
  const cls =
    { saved: "saved", confirmed: "saved", done: "saved", approved: "saved", active: "saved", matched: "match", merged: "match", pinned: "match", waiting: "review", needs_review: "review", pending: "review", proposed: "review", failed: "fail", rejected: "fail", unreadable: "fail", detecting: "idle", queued: "ai", dropped: "idle", retired: "idle", undone: "idle" }[status] ?? "idle";
  const text = children ?? { needs_review: "Needs review", waiting: "Needs review", saved: "Saved", detecting: "Detecting", done: "Done", failed: "Failed", queued: "Queued" }[status] ?? status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  return <span className={`bdg ${cls}`}>{text}</span>;
}

export function Conf({ value, threshold = 0.85 }: { value: number | null; threshold?: number }) {
  const v = Math.max(0, Math.min(1, value ?? 0));
  return (
    <span className="conf">
      {v.toFixed(2)}
      <span className={`bar${v >= threshold ? " ok" : ""}`}>
        <span style={{ width: `${v * 100}%` }} />
      </span>
    </span>
  );
}

export const FACET_SHORT: Record<string, string> = { category: "Cat", color: "Colour", style: "Style", material: "Material", finish: "Finish", shape: "Shape", pattern: "Pattern", mood: "Mood", room_type: "Room" };

/** One scheme chip: facet label + value; dashed when the word is only proposed. */
export function Chip({ term, facet, fallback, plain }: { term?: Term | null; facet?: string; fallback?: string | null; plain?: boolean }) {
  const proposed = term?.status === "proposed";
  return (
    <span className={`sc${proposed ? " new" : ""}`}>
      {!plain && facet && <i>{FACET_SHORT[facet] ?? facet}</i>}
      {term?.hex && <span className="dot" style={{ background: term.hex }} />}
      {term?.label ?? fallback ?? "—"}
      {proposed && !plain ? " · new word" : ""}
    </span>
  );
}

export type Box = { x: number; y: number; w: number; h: number };
/** The scan picture with each piece outlined: green saved, purple matched, amber dashed waiting. */
export function Scan({
  src, pieces, selected, onSelect, labels = true, alt = "Scanned design with detected pieces outlined",
}: { src?: string | null; pieces: { id: string; box: Box | null; status: string; label: string; n: number; matched?: boolean }[]; selected?: string | null; onSelect?: (id: string) => void; labels?: boolean; alt?: string }) {
  return (
    <div className="scan">
      {src ? <img src={src} alt={alt} /> : <div style={{ aspectRatio: "2.1/1" }} />}
      {pieces.map((pc) => {
        if (!pc.box) return null;
        const wait = pc.status === "waiting";
        const cls = `bx${wait ? " rv" : pc.matched ? " mt" : ""}${selected === pc.id ? " sel" : ""}${selected && selected !== pc.id ? " dimb" : ""}${pc.box.y < 0.12 ? " lowlab" : pc.box.y > 0.6 ? " inlab" : ""}`;
        return (
          <span
            key={pc.id}
            className={cls}
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onClick={() => onSelect?.(pc.id)}
            style={{ left: `${pc.box.x * 100}%`, top: `${pc.box.y * 100}%`, width: `${pc.box.w * 100}%`, height: `${pc.box.h * 100}%`, cursor: onSelect ? "pointer" : undefined }}
          >
            <b>
              {pc.n}
              {labels ? ` ${pc.label}${wait ? " · review" : ""}` : ""}
            </b>
          </span>
        );
      })}
    </div>
  );
}

/** A zoomed crop of one piece from its scan. */
export function Crop({ src, box, alt = "" }: { src?: string | null; box: Box | null; alt?: string }) {
  const zoom = box ? Math.min(4, 1 / Math.max(box.w, box.h, 0.25)) : 1;
  const cx = box ? (box.x + box.w / 2) * 100 : 50;
  const cy = box ? (box.y + box.h / 2) * 100 : 50;
  return <span className="crop">{src && <img src={src} alt={alt} style={{ transform: `scale(${zoom})`, transformOrigin: `${cx}% ${cy}%` }} />}</span>;
}

export const ago = (iso: string) => {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 2) return "Now";
  if (mins < 60) return `${mins} min ago`;
  const today = new Date();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return `Today, ${time}`;
  const y = new Date(today.getTime() - 86400000);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString();
};

/** A filter pill that opens a native select ("Category: any"). */
export function PillSel({ label, value, options, onChange, anyLabel = "any", bare }: { label?: string; value: string; options: [string, string][]; onChange: (v: string) => void; anyLabel?: string; bare?: boolean }) {
  const cur = options.find((o) => o[0] === value)?.[1];
  const text = bare ? cur ?? anyLabel : `${label}: ${cur ?? anyLabel}`;
  return (
    <label className={`pill${bare && value ? " on" : ""}`} style={{ position: "relative" }}>
      {text}
      <select aria-label={label ?? text} value={value} onChange={(e) => onChange(e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}>
        <option value="">{label ? `${label}: ${anyLabel}` : anyLabel}</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Style that zooms an image onto one detected box. */
export const zoomTo = (box: Box | null | undefined): CSSProperties | undefined => {
  if (!box) return undefined;
  const zoom = Math.min(4, 1 / Math.max(box.w, box.h, 0.25));
  return { transform: `scale(${zoom})`, transformOrigin: `${(box.x + box.w / 2) * 100}% ${(box.y + box.h / 2) * 100}%` };
};
