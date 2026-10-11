import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type ScanSettings = { auto_save_threshold: number; max_pages_per_pdf: number; spot_check_sample: number; undo_days: number };
const DEFAULTS: ScanSettings = { auto_save_threshold: 0.85, max_pages_per_pdf: 20, spot_check_sample: 10, undo_days: 14 };

const problems = (s: ScanSettings) => {
  const p: Partial<Record<keyof ScanSettings, string>> = {};
  if (!(s.auto_save_threshold >= 0.5 && s.auto_save_threshold <= 1)) p.auto_save_threshold = "Between 0.50 and 1.00";
  if (!(Number.isInteger(s.max_pages_per_pdf) && s.max_pages_per_pdf >= 1 && s.max_pages_per_pdf <= 200)) p.max_pages_per_pdf = "A whole number from 1 to 200";
  if (!(Number.isInteger(s.spot_check_sample) && s.spot_check_sample >= 1 && s.spot_check_sample <= 100)) p.spot_check_sample = "A whole number from 1 to 100";
  if (!(Number.isInteger(s.undo_days) && s.undo_days >= 0 && s.undo_days <= 365)) p.undo_days = "A whole number from 0 to 365";
  return p;
};

/** Scan settings with checks before saving, and the saved history of every CMS key. */
export default function SettingsHistory() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<ScanSettings>(DEFAULTS);

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
  useEffect(() => {
    if (current) setForm(current);
  }, [current]);

  const { data: history } = useQuery({
    queryKey: ["settings-versions"],
    queryFn: async () => (await supabase.from("settings_versions").select("*").order("saved_at", { ascending: false }).limit(50)).data ?? [],
  });

  const errs = problems(form);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("cms_content")
        .upsert({ key: "scan_settings", content_type: "json", value: JSON.stringify(form) }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scan-settings"] });
      qc.invalidateQueries({ queryKey: ["settings-versions"] });
      toast({ title: "Settings saved", description: "The previous version is kept in the history below." });
    },
    onError: (e: Error) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });

  const restore = useMutation({
    mutationFn: async (v: { key: string; value: string }) => {
      const { error } = await supabase.from("cms_content").update({ value: v.value }).eq("key", v.key);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scan-settings"] });
      qc.invalidateQueries({ queryKey: ["settings-versions"] });
      qc.invalidateQueries({ queryKey: ["cms-content"] });
      toast({ title: "Restored" });
    },
    onError: (e: Error) => toast({ title: "Could not restore", description: e.message, variant: "destructive" }),
  });

  const field = (key: keyof ScanSettings, label: string, unit: string, step = 1) => (
    <div className="space-y-2">
      <Label htmlFor={`set-${key}`}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={`set-${key}`}
          type="number"
          step={step}
          value={form[key]}
          aria-invalid={!!errs[key]}
          className={errs[key] ? "border-destructive" : ""}
          onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
        />
        <span className="whitespace-nowrap text-sm text-muted-foreground">{unit}</span>
      </div>
      {errs[key] && <p className="text-sm font-semibold text-destructive">{errs[key]}</p>}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Scan &amp; review settings</CardTitle>
          <CardDescription>Checked before saving; every save keeps the old version.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {field("auto_save_threshold", "Auto-save when the AI is at least", "sure", 0.05)}
            {field("max_pages_per_pdf", "Max pages per PDF", "pages")}
            {field("spot_check_sample", "Spot-check sample", "items per round")}
            {field("undo_days", "A batch can be undone for", "days")}
          </div>
          <Button onClick={() => save.mutate()} disabled={Object.keys(errs).length > 0 || save.isPending}>
            {Object.keys(errs).length ? "Fix the values above to save" : "Save settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Earlier versions of any CMS key or setting. Restore puts that version back.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {(history ?? []).length === 0 && <p className="text-muted-foreground">Nothing changed yet.</p>}
          {(history ?? []).map((h) => (
            <div key={h.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{h.key}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">{h.value.slice(0, 140)}</p>
                <p className="text-xs text-muted-foreground">Replaced {new Date(h.saved_at).toLocaleString()}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => restore.mutate({ key: h.key, value: h.value })}>Restore</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
