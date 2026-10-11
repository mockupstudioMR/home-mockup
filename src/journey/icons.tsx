/** Icons from the design boards (24×24 line icons, drawn with the .ic class). */
import type { CSSProperties, ReactNode } from "react";

export function Ic({ children, style, className = "ic" }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" style={style}>
      {children}
    </svg>
  );
}

const p = (d: string) => <path d={d} />;

export const I = {
  home: () => <Ic>{p("M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z")}</Ic>,
  next: () => <Ic>{p("M5 12h14M13 6l6 6-6 6")}</Ic>,
  back: () => <Ic>{p("M19 12H5M11 6l-6 6 6 6")}</Ic>,
  check: () => <Ic>{p("M5 12l5 5L20 7")}</Ic>,
  user: () => (
    <Ic>
      <circle cx="12" cy="8" r="4" />
      {p("M4 21a8 8 0 0 1 16 0")}
    </Ic>
  ),
  sparkle: () => (
    <Ic>
      {p("M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z")}
      {p("M19 3v4M17 5h4M5 17v3M3.5 18.5h3")}
    </Ic>
  ),
  compass: () => (
    <Ic>
      <circle cx="12" cy="12" r="9" />
      {p("M15.5 8.5l-2 5-5 2 2-5z")}
    </Ic>
  ),
  repeat: () => <Ic>{p("M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5")}</Ic>,
  info: () => (
    <Ic>
      <circle cx="12" cy="12" r="9" />
      {p("M12 11v5M12 8h.01")}
    </Ic>
  ),
  warn: () => (
    <Ic>
      <circle cx="12" cy="12" r="9" />
      {p("M12 8v5M12 16h.01")}
    </Ic>
  ),
  upload: () => <Ic>{p("M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3")}</Ic>,
  download: () => <Ic>{p("M12 4v12M7 11l5 5 5-5M4 20h16")}</Ic>,
  share: () => <Ic>{p("M12 3v13M7 8l5-5 5 5M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5")}</Ic>,
  camera: () => (
    <Ic>
      {p("M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z")}
      <circle cx="12" cy="13" r="3.5" />
    </Ic>
  ),
  plus: () => <Ic>{p("M12 5v14M5 12h14")}</Ic>,
  x: () => <Ic>{p("M6 6l12 12M18 6 6 18")}</Ic>,
  link: () => <Ic>{p("M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1")}</Ic>,
  pencil: () => <Ic>{p("M4 20h4L19 9l-4-4L4 16zM14 6l4 4")}</Ic>,
  ruler: () => <Ic>{p("M3 17 17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2")}</Ic>,
  plan: () => <Ic>{p("M4 4h16v16H4zM4 12h8v8M12 4v4")}</Ic>,
};

/** Room-type icons, keyed by the ids the app stores. */
export const ROOM_ICON: Record<string, () => JSX.Element> = {
  "living-room": () => (
    <Ic>
      {p("M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3")}
      {p("M3 13a2 2 0 0 1 4 0v1h10v-1a2 2 0 0 1 4 0v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM6 18v2M18 18v2")}
    </Ic>
  ),
  bedroom: () => <Ic>{p("M3 5v14M21 19v-6a2 2 0 0 0-2-2H9v5M3 16h18")}</Ic>,
  kitchen: () => <Ic>{p("M7 3v8a2 2 0 0 0 2 2v8M5 3v6M9 3v6M17 3c-2 2-2 6 0 8v10")}</Ic>,
  "dining-room": () => <Ic>{p("M4 10h16M6 10v10M18 10v10M8 6h8M12 6v4")}</Ic>,
  office: () => (
    <Ic>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      {p("M12 16v4M8 20h8")}
    </Ic>
  ),
  bathroom: () => <Ic>{p("M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2")}</Ic>,
  "kids-room": () => (
    <Ic>
      <rect x="4" y="12" width="7" height="8" rx="1" />
      <rect x="13" y="12" width="7" height="8" rx="1" />
      <rect x="8.5" y="4" width="7" height="8" rx="1" />
    </Ic>
  ),
  hallway: () => <Ic>{p("M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M3 21h18M14 12h.01")}</Ic>,
};

/** Smaller room icons used in the "rooms still to design" lists (no legs on the sofa). */
export const ROOM_ICON_SM: Record<string, () => JSX.Element> = {
  ...ROOM_ICON,
  "living-room": () => (
    <Ic>
      {p("M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3")}
      {p("M3 13a2 2 0 0 1 4 0v1h10v-1a2 2 0 0 1 4 0v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z")}
    </Ic>
  ),
  bathroom: () => <Ic>{p("M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM6 12V6a2 2 0 0 1 4 0")}</Ic>,
};

/** What a room's scope covers (step 1.5 and the brief). */
export const SCOPE_ICON: Record<string, () => JSX.Element> = {
  furniture: ROOM_ICON_SM["living-room"],
  walls: () => <Ic>{p("M4 4h16v16H4zM4 10h16M10 10v10")}</Ic>,
  floors: () => <Ic>{p("M3 17 12 21l9-4M3 12l9 4 9-4M3 7l9 4 9-4-9-4z")}</Ic>,
  lighting: () => <Ic>{p("M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z")}</Ic>,
  builtins: () => <Ic>{p("M4 3h16v18H4zM4 9h16M4 15h16")}</Ic>,
  electrical: () => <Ic>{p("M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4")}</Ic>,
  water: () => <Ic>{p("M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z")}</Ic>,
  ac: () => <Ic>{p("M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8")}</Ic>,
  heating: () => <Ic>{p("M4 6h16v12H4zM8 6v12M12 6v12M16 6v12M6 18v2M18 18v2")}</Ic>,
  data: () => (
    <Ic>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      {p("M8 3l4 3 4-3")}
    </Ic>
  ),
};
