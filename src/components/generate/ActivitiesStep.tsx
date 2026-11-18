import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, Loader2 } from "lucide-react";

interface Activity {
  id: string;
  activity_name: string;
  furniture_items: string[];
  advisory_text: string | null;
}

const STORAGE_KEY = "selected_room_activities";

export default function ActivitiesStep({ roomType }: { roomType?: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>(() => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}").ids ?? []; } catch { return []; }
  });

  const rt = (roomType || "living_room").replace(/-/g, "_");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("room_activities")
      .select("id, activity_name, furniture_items, advisory_text")
      .eq("room_type", rt)
      .order("priority")
      .then(({ data }) => {
        if (cancelled) return;
        setActivities((data as Activity[]) ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [rt]);

  const furniture = useMemo(() => {
    const counts = new Map<string, number>();
    activities.filter((a) => selected.includes(a.id)).forEach((a) => {
      const local = new Map<string, number>();
      a.furniture_items.forEach((f) => local.set(f, (local.get(f) ?? 0) + 1));
      local.forEach((n, f) => counts.set(f, Math.max(counts.get(f) ?? 0, n)));
    });
    return Array.from(counts.entries());
  }, [activities, selected]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        ids: selected,
        names: activities.filter((a) => selected.includes(a.id)).map((a) => a.activity_name),
        furniture: furniture.flatMap(([f, n]) => Array(n).fill(f)),
      }));
    } catch { /* ignore */ }
  }, [selected, furniture, activities]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  if (!loading && activities.length === 0) return null;

  return (
    <div className="max-w-3xl mx-auto rounded-2xl border bg-card p-6 space-y-4">
      <div>
        <h3 className="font-semibold">How will you use this room?</h3>
        <p className="text-sm text-muted-foreground">Pick all that apply — we'll plan the furniture for each.</p>
      </div>
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activities.map((a) => {
            const on = selected.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggle(a.id)}
                className={`text-left rounded-xl border p-4 transition-colors ${on ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{a.activity_name}</span>
                  {on && <Check className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{a.furniture_items.join(", ")}</p>
              </button>
            );
          })}
        </div>
      )}
      {furniture.length > 0 && (
        <div className="text-sm">
          <span className="font-medium">Furniture for your layout: </span>
          <span className="text-muted-foreground">
            {furniture.map(([f, n]) => (n > 1 ? `${n}× ${f}` : f)).join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}
