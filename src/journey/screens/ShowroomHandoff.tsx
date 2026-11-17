import { lazy, Suspense, useState } from "react";
import { GeneratorProShowroom } from "@/components/showroom/GeneratorProShowroom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/looseDb";
import { Back, Go, Screen } from "../Shell";
import { useJourney } from "../state";
import { PlanDrawing } from "./Step4";

// The 3D room is loaded only when this screen opens, so the rest of the journey stays light.
const Showroom3D = lazy(() => import("../showroom3d/Showroom3D"));
const VIEW_3D = { room: "room", wall_a: "A", wall_b: "B", wall_c: "C", wall_d: "D" } as const;

const views = [
  ["room", "Whole room"], ["wall_a", "Wall A"], ["wall_b", "Wall B"],
  ["wall_c", "Wall C"], ["wall_d", "Wall D"],
] as const;
const SCRIPT_URL = "/generator-pro/showroom-configurator.js";

/**
 * Layout-to-showroom handoff. What is shown for the chosen view:
 * 1. the person's own prepared scene (showroom_scenes, status ready), when one exists
 * 2. otherwise their own room in 3D (showroom3d): built from their moodboard colours, their chosen layout's
 *    pieces and their room's size, doors and windows. It needs no prepared assets, so every person gets it.
 * The sample scene and reference backgrounds are no longer shown in place of the person's own room.
 */
export function ShowroomHandoff() {
  const { s } = useJourney();
  const [view, setView] = useState<string>("room");
  const layout = s.layouts[s.chosenLayout ?? 0];
  const { data: scene } = useQuery({
    queryKey: ["showroom-scene", s.projectId, s.roomId, layout?.id, view],
    enabled: Boolean(s.projectId && s.roomId && layout?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from("showroom_scenes")
        .select("id,manifest_url,assets_url,version")
        .eq("project_id", s.projectId)
        .eq("room_id", s.roomId)
        .eq("layout_id", layout!.id)
        .eq("view", view)
        .eq("status", "ready")
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    retry: false,
  });
  const hasLiveScene = Boolean(scene?.manifest_url && scene?.assets_url);
  const own3d = !hasLiveScene;

  if (!layout) {
    return <Screen board="S4-Showroom" step={4} dock={<Back to="S4-Layouts" />}>
      <h1 className="h1">Choose your layout first</h1>
      <p className="sub">The showroom uses your confirmed furniture layout and room dimensions.</p>
      <Go className="btn auto" to="S4-Layouts">Choose layout</Go>
    </Screen>;
  }

  let sub = "Your own room, built from your moodboard colours and your layout. Tap a piece to change its colour or shape.";
  if (hasLiveScene) sub = "Tap a dot in the room, or a tab below it, and swap what's there. Every change shows straight away.";

  return <Screen board="S4-Showroom" step={4} right={layout.name}
    dock={<><Back to="S4-Summary" /><Go className="btn auto" to="S5-Walls">Continue to your walls</Go></>}>
    <p className="eyebrow">Your room · showroom</p>
    <h1 className="h1">Your layout, in your room</h1>
    <p className="sub">{sub}</p>
    <div className="chips" role="group" aria-label="Showroom view" style={{ marginTop: 24 }}>
      {views.map(([key, label]) => <button key={key} type="button"
        aria-pressed={view === key} className={`chip${view === key ? " sel" : ""}`}
        onClick={() => setView(key)}>{label}</button>)}
    </div>
    {own3d ? (
      <Suspense fallback={<div className="panel" role="status" style={{ marginTop: 24, padding: 36 }}>Building your room…</div>}>
        <Showroom3D view={VIEW_3D[view as keyof typeof VIEW_3D] ?? "room"} />
      </Suspense>
    ) : (
    <div className="panel" style={{ marginTop: 24, overflow: "hidden", padding: 0 }}>
      {hasLiveScene ? (
        <GeneratorProShowroom scriptUrl={SCRIPT_URL} configUrl={scene!.manifest_url} assetsUrl={scene!.assets_url} />
      ) : (
        <div style={{ padding: 36 }}><p className="p">Loading your showroom…</p></div>
      )}
    </div>
    )}
    <section className="panel" style={{ marginTop: 24, padding: 24 }}>
      <h2 className="h3">Confirmed layout · {layout.name}</h2>
      <p className="small">The room above is drawn from this plan.</p>
      <div style={{ display: "flex", justifyContent: "center", overflow: "auto", marginTop: 16 }}>
        <PlanDrawing layout={layout} s={s} box={{ w: 300, h: 392 }} />
      </div>
    </section>
  </Screen>;
}
