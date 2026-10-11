/** X3 · CMS & settings */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ProductMatchingWeights from "@/components/admin/ProductMatchingWeights";
import TypeFamiliesManager from "@/components/admin/TypeFamiliesManager";
import CMSEditor from "@/components/admin/CMSEditor";
import { AdminShell, Crumb } from "../ui";
import { since } from "./Users";

type ScanSettings = { auto_save_threshold: number; max_pages_per_pdf: number; spot_check_sample: number; undo_days: number };
const DEFAULTS: ScanSettings = { auto_save_threshold: 0.85, max_pages_per_pdf: 20, spot_check_sample: 10, undo_days: 14 };
const FIELDS: { k: keyof ScanSettings; label: string; unit: string; hint: string; check: (v: number) => string | null }[] = [
  { k: "auto_save_threshold", label: "Auto-save when at least", unit: "sure", hint: "Between 0.50 and 1.00. Batches can raise it.", check: (v) => (v >= 0.5 && v <= 1 ? null : "Must be between 0.50 and 1.00") },
  { k: "max_pages_per_pdf", label: "Max pages per PDF", unit: "pages", hint: "Each page counts as one design.", check: (v) => (Number.isInteger(v) && v >= 1 ? (v <= 200 ? null : "At most 200") : "Must be 1 or more") },
  { k: "spot_check_sample", label: "Spot-check sample", unit: "items / round", hint: "Random AI-saved items shown in a spot-check.", check: (v) => (Number.isInteger(v) && v >= 1 && v <= 100 ? null : "A whole number from 1 to 100") },
  { k: "undo_days", label: "Undo a batch for", unit: "days", hint: "After this, a batch can only be fixed piece by piece.", check: (v) => (Number.isInteger(v) && v >= 0 && v <= 365 ? null : "A whole number from 0 to 365") },
];
const SHORT: Record<string, string> = { auto_save_threshold: "Threshold", max_pages_per_pdf: "Max PDF pages", spot_check_sample: "Spot-check sample", undo_days: "Undo days" };

type Key = "scan" | "weights" | "families" | "landing" | "quiz" | "emails";
const KEYS: { g: string; items: { id: Key; label: string; cms: string; sub?: (n: number) => string; prefix?: RegExp }[] }[] = [
  {
    g: "Settings",
    items: [
      { id: "scan", label: "Scan & review", cms: "scan_settings", sub: () => "scan_auto_save_threshold, …" },
      { id: "weights", label: "Product matching weights", cms: "product_matching_weights" },
      { id: "families", label: "Type families", cms: "strict_type_families" },
    ],
  },
  {
    g: "Copy",
    items: [
      { id: "landing", label: "Landing page", cms: "", prefix: /^(landing|hero|home)/i, sub: (n) => `Text · ${n} fields` },
      { id: "quiz", label: "Quiz questions", cms: "", prefix: /^quiz/i, sub: (n) => `Text · ${n} steps` },
      { id: "emails", label: "Emails", cms: "", prefix: /^email/i, sub: (n) => `Text · ${n} templates` },
    ],
  },
];

export function Settings() {
  const [key, setKey] = useState<Key>("scan");
  const { data: keys } = useQuery({
    queryKey: ["cms-keys"],
    queryFn: async () => ((await supabase.from("cms_content").select("key, content_type")).data ?? []).map((r) => r.key),
  });
  const n = (re?: RegExp) => (re ? (keys ?? []).filter((k) => re.test(k)).length : 0);
  const cur = KEYS.flatMap((g) => g.items).find((i) => i.id === key)!;
  return (
    <AdminShell board="X3-Settings" section="cms">
      <Crumb items={["Run"]} />
      <h1 className="ah1">CMS & settings</h1>
      <p className="asub">Copy and app settings. Every setting has a form that checks its values before saving, and every save is kept so it can be rolled back.</p>
      <div className="row sec" style={{ alignItems: "flex-start", gap: "24px" }}>
        <nav className="keys rail-card" style={{ gap: "2px", padding: "14px" }} aria-label="Content keys">
          {KEYS.map((g) => (
            <div key={g.g} style={{ display: "contents" }}>
              <span className="g">{g.g}</span>
              {g.items.map((i) => (
                <a key={i.id} href="#" className={key === i.id ? "on" : undefined} onClick={(e) => { e.preventDefault(); setKey(i.id); }}>
                  {i.label}
                  <small>{i.sub ? i.sub(n(i.prefix)) : i.cms}</small>
                </a>
              ))}
            </div>
          ))}
        </nav>
        <section className="ed">
          {key === "scan" ? (
            <ScanForm />
          ) : key === "weights" ? (
            <div className="legacy">
              <ProductMatchingWeights />
            </div>
          ) : key === "families" ? (
            <div className="legacy">
              <TypeFamiliesManager />
            </div>
          ) : (
            <div className="legacy">
              <CMSEditor />
            </div>
          )}
          <History cmsKey={cur.cms} prefix={cur.prefix} />
        </section>
      </div>
    </AdminShell>
  );
}

function ScanForm() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: current } = useQuery({
    queryKey: ["scan-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("cms_content").select("value").eq("key", "scan_settings").maybeSingle();
      try {
        return { ...DEFAULTS, ...JSON.parse(data?.value ?? "{}") } as ScanSettings;
      } catch {
        return DEFAULTS;
      }
    },
  });
  const [form, setForm] = useState<Record<keyof ScanSettings, string>>(() => Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, String(v)])) as Record<keyof ScanSettings, string>);
  useEffect(() => {
    if (current) setForm(Object.fromEntries(Object.entries(current).map(([k, v]) => [k, String(v)])) as Record<keyof ScanSettings, string>);
  }, [current]);
  const [json, setJson] = useState(false);
  const values = Object.fromEntries(FIELDS.map((f) => [f.k, Number(form[f.k])])) as ScanSettings;
  const errs = FIELDS.map((f) => [f.k, form[f.k].trim() === "" || Number.isNaN(values[f.k]) ? "Enter a number" : f.check(values[f.k])] as const).filter(([, e]) => e);
  const changed = current && FIELDS.some((f) => values[f.k] !== current[f.k]);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("cms_content").upsert({ key: "scan_settings", content_type: "json", value: JSON.stringify(values) }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scan-settings"] });
      qc.invalidateQueries({ queryKey: ["settings-versions"] });
      toast({ title: "Settings saved", description: "The previous version is kept in the history." });
    },
    onError: (e: Error) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });
  return (
    <div className="panel" style={{ padding: "30px" }}>
      <div className="row between">
        <h2 className="h3">Scan & review</h2>
        <span className={`tag ${errs.length ? "tbc" : "ok"}`}>{errs.length ? "Fails the schema check" : "Checked against schema"}</span>
      </div>
      {json ? (
        <pre className="small" style={{ marginTop: "20px", whiteSpace: "pre-wrap", background: "#FBF8F6", padding: "16px", borderRadius: "14px" }}>
          {JSON.stringify(values, null, 2)}
        </pre>
      ) : (
        <div className="frm" style={{ marginTop: "20px" }}>
          {FIELDS.map((f, i) => {
            const err = errs.find(([k]) => k === f.k)?.[1];
            return (
              <div className="field" key={f.k}>
                <label htmlFor={`s${i + 1}`}>{f.label}</label>
                <div className="unit">
                  <input id={`s${i + 1}`} className={`input${err ? " bad" : ""}`} inputMode="decimal" value={form[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} aria-invalid={!!err} />
                  <span>{f.unit}</span>
                </div>
                {err ? <span className="err">{err}</span> : <span className="hint">{f.hint}</span>}
              </div>
            );
          })}
        </div>
      )}
      <div className="actions" style={{ marginTop: "26px" }}>
        <button className="link-btn" type="button" onClick={() => setJson((j) => !j)}>
          {json ? "Show as form" : "Show as JSON"}
        </button>
        <span className="small">{errs.length ? `${errs.length} problem${errs.length > 1 ? "s" : ""} to fix before saving` : changed ? "Ready to save" : "No changes"}</span>
        <button className={`btn sm${errs.length || !changed ? " dis" : ""}`} type="button" style={{ marginLeft: "auto" }} disabled={!!errs.length || !changed || save.isPending} onClick={() => save.mutate()}>
          Save
        </button>
      </div>
    </div>
  );
}

/** What changed between two saved JSON values, in words ("Threshold 0.80 → 0.85"). */
function diffLine(prev: string | undefined, next: string, key: string) {
  try {
    const a = prev ? JSON.parse(prev) : {}, b = JSON.parse(next);
    if (b && typeof b === "object" && !Array.isArray(b)) {
      const parts = Object.keys(b).filter((k) => JSON.stringify(a?.[k]) !== JSON.stringify(b[k])).map((k) => `${SHORT[k] ?? k.replace(/_/g, " ")} ${a?.[k] ?? "—"} → ${b[k]}`);
      if (parts.length) return parts.slice(0, 2).join(" · ");
    }
  } catch {
    /* plain text */
  }
  return `${key.replace(/_/g, " ")} edited`;
}

function History({ cmsKey, prefix }: { cmsKey: string; prefix?: RegExp }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["settings-versions"],
    queryFn: async () => {
      const [{ data: versions }, { data: profiles }, { data: auth }] = await Promise.all([
        supabase.from("settings_versions").select("*").order("saved_at", { ascending: false }).limit(200),
        supabase.from("profiles").select("user_id, display_name, email").limit(2000),
        supabase.auth.getUser(),
      ]);
      return { versions: versions ?? [], who: new Map((profiles ?? []).map((p) => [p.user_id, p.display_name || p.email || "Admin"])), me: auth.user?.id };
    },
  });
  const rows = useMemo(() => (data?.versions ?? []).filter((v) => (cmsKey ? v.key === cmsKey : prefix?.test(v.key))), [data, cmsKey, prefix]);
  const { data: currentValue } = useQuery({
    queryKey: ["cms-value", cmsKey],
    enabled: !!cmsKey,
    queryFn: async () => (await supabase.from("cms_content").select("value").eq("key", cmsKey).maybeSingle()).data?.value,
  });
  const restore = useMutation({
    mutationFn: async (v: { key: string; value: string }) => {
      const { error } = await supabase.from("cms_content").update({ value: v.value }).eq("key", v.key);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scan-settings"] });
      qc.invalidateQueries({ queryKey: ["settings-versions"] });
      qc.invalidateQueries({ queryKey: ["cms-value"] });
      qc.invalidateQueries({ queryKey: ["cms-content"] });
      toast({ title: "Restored" });
    },
    onError: (e: Error) => toast({ title: "Could not restore", description: e.message, variant: "destructive" }),
  });
  // settings_versions keeps the value BEFORE each save; the change it records is old → the next newer value.
  return (
    <div className="rail-card" style={{ marginTop: "16px" }}>
      <h2 className="h3" style={{ fontSize: "19px" }}>
        History
      </h2>
      <div>
        {rows.slice(0, 8).map((v, i) => {
          const newer = i === 0 ? currentValue ?? undefined : rows[i - 1]?.value;
          const who = v.saved_by === data?.me ? "You" : v.saved_by ? data?.who.get(v.saved_by) ?? "Admin" : "Admin";
          return (
            <div className="lr" key={v.id}>
              <span>
                <span className="t">{newer ? diffLine(v.value, newer, v.key) : `${v.key.replace(/_/g, " ")} saved`}</span>
                <br />
                <span className="m">
                  {who} · {since(v.saved_at).toLowerCase()}
                </span>
              </span>
              <span className="end">
                <a href="#" style={{ fontWeight: "600", fontSize: "14px" }} onClick={(e) => { e.preventDefault(); restore.mutate(v); }}>
                  Restore
                </a>
              </span>
            </div>
          );
        })}
        {data && !rows.length && <div className="lr m">No earlier versions yet.</div>}
      </div>
    </div>
  );
}
