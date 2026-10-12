/**
 * App languages. English is the source; Egyptian Arabic comes from a dictionary of the
 * app's English UI text (src/i18n/ar.json) applied to the page as it renders, so every
 * screen — journey, retailer tools, admin — follows the chosen language without
 * per-component wiring. AI calls also carry the language so generated text matches.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Lang = "en" | "ar";
export const LANGS: { code: Lang; label: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية (مصري)", dir: "rtl" },
];
const KEY = "hm_lang";

let current: Lang = (() => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
})();
const listeners = new Set<(l: Lang) => void>();
export const getLang = () => current;

// ---------- dictionary ----------
let dict: Record<string, string> | null = null;
const loadDict = async () => (dict ??= (await import("./ar.json")).default as Record<string, string>);

const lookup = (raw: string): string | null => {
  if (!dict) return null;
  const t = raw.replace(/\s+/g, " ").trim();
  if (!t) return null;
  if (dict[t]) return dict[t];
  const m = /^(.*?)([:.…!?]+)$/.exec(t);
  if (m && dict[m[1]]) return dict[m[1]] + m[2];
  return null;
};

// ---------- page translator ----------
const ATTRS = ["placeholder", "title", "aria-label", "alt"] as const;
const SKIP = new Set(["SCRIPT", "STYLE", "CODE", "PRE", "TEXTAREA", "NOSCRIPT"]);
const textOrig = new WeakMap<Text, { src: string; out: string }>();
const attrOrig = new WeakMap<Element, Record<string, { src: string; out: string }>>();
let observer: MutationObserver | null = null;
const touched = new Set<WeakRef<Node>>();

const skipEl = (el: Element | null) => {
  for (let e = el; e; e = e.parentElement) {
    if (SKIP.has(e.tagName) || e.hasAttribute("data-no-translate") || (e as HTMLElement).isContentEditable) return true;
  }
  return false;
};

function translateText(n: Text) {
  const prev = textOrig.get(n);
  const value = n.data;
  if (prev && value === prev.out) return;
  const src = value; // React rewrote it (or first sight): this is the new English
  const tr = lookup(src);
  if (!tr) return;
  const lead = /^\s*/.exec(src)![0];
  const trail = /\s*$/.exec(src)![0];
  const out = lead + tr + trail;
  textOrig.set(n, { src, out });
  touched.add(new WeakRef(n));
  n.data = out;
}

function translateAttrs(el: Element) {
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (!v) continue;
    const rec = attrOrig.get(el) ?? {};
    if (rec[a] && rec[a].out === v) continue;
    const tr = lookup(v);
    if (!tr) continue;
    rec[a] = { src: v, out: tr };
    attrOrig.set(el, rec);
    touched.add(new WeakRef(el));
    el.setAttribute(a, tr);
  }
}

function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    if (!skipEl(root.parentElement)) translateText(root as Text);
    return;
  }
  if (!(root instanceof Element) || skipEl(root)) return;
  translateAttrs(root);
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n instanceof Element && (SKIP.has(n.tagName) || n.hasAttribute("data-no-translate")) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) translateText(n as Text);
    else translateAttrs(n as Element);
  }
}

function start() {
  walk(document.body);
  observer?.disconnect();
  observer = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "characterData") walk(m.target);
      else if (m.type === "attributes") translateAttrs(m.target as Element);
      else m.addedNodes.forEach(walk);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
}

function stop() {
  observer?.disconnect();
  observer = null;
  for (const ref of touched) {
    const n = ref.deref();
    if (!n) continue;
    if (n.nodeType === Node.TEXT_NODE) {
      const o = textOrig.get(n as Text);
      if (o && (n as Text).data === o.out) (n as Text).data = o.src;
      textOrig.delete(n as Text);
    } else {
      const rec = attrOrig.get(n as Element);
      if (rec) for (const [a, o] of Object.entries(rec)) if ((n as Element).getAttribute(a) === o.out) (n as Element).setAttribute(a, o.src);
      attrOrig.delete(n as Element);
    }
  }
  touched.clear();
}

async function apply(l: Lang) {
  const meta = LANGS.find((x) => x.code === l)!;
  document.documentElement.lang = l;
  document.documentElement.dir = meta.dir;
  if (l === "ar") {
    await loadDict();
    if (current === "ar") start();
  } else stop();
}

export function setLang(l: Lang) {
  current = l;
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* ignore */
  }
  void apply(l);
  listeners.forEach((f) => f(l));
}

export function useLang(): [Lang, (l: Lang) => void] {
  const [l, set] = useState(current);
  useEffect(() => {
    listeners.add(set);
    return () => void listeners.delete(set);
  }, []);
  return [l, setLang];
}

// ---------- AI calls carry the language ----------
let installed = false;
export function installI18n() {
  if (installed) return;
  installed = true;
  const fns = supabase.functions as unknown as { invoke: (name: string, opts?: { body?: unknown }) => Promise<unknown> };
  const orig = fns.invoke.bind(fns);
  fns.invoke = (name, opts) => {
    const body = opts?.body;
    if (current !== "en" && body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob) && !Array.isArray(body)) {
      opts = { ...opts, body: { ...(body as Record<string, unknown>), uiLanguage: current } };
    }
    return orig(name, opts);
  };
  void apply(current);
}

/** Small language switch that floats on every screen. */
export function LanguageSwitcher() {
  const [lang, change] = useLang();
  return (
    <div
      data-no-translate
      className="fixed bottom-3 start-3 z-[100] flex overflow-hidden rounded-full border border-border bg-background/95 text-xs shadow-md backdrop-blur print:hidden"
      role="group"
      aria-label="Language"
    >
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => change(l.code)}
          aria-pressed={lang === l.code}
          className={`px-3 py-1.5 transition-colors ${lang === l.code ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}
        >
          {l.code === "en" ? "EN" : "عربي"}
        </button>
      ))}
    </div>
  );
}
