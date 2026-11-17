import { useState } from "react";
import { GeneratorProShowroom } from "@/components/showroom/GeneratorProShowroom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/looseDb";
import { Back, Go, Screen } from "../Shell";
import { useJourney } from "../state";
import { PlanDrawing } from "./Step4";

const WALL_OF = { wall_a: "A", wall_b: "B", wall_c: "C", wall_d: "D" } as const;

const views = [
  ["room", "Whole room"], ["wall_a", "Wall A"], ["wall_b", "Wall B"],
  ["wall_c", "Wall C"], ["wall_d", "Wall D"],
] as const;
const SCRIPT_URL = "/generator-pro/showroom-configurator.js";

/**
 * Layout-to-showroom handoff. What is shown for the chosen view:
 * 1. the person's own prepared scene (showroom_scenes, status ready), when one exists
 * 2. otherwise the wall's own layered photograph made in step 5 (wallScenes), for a wall view
 * 3. otherwise a pointer to step 5, where every wall's picture is made.
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
  const own = view in WALL_OF ? s.showroom?.scenes?.[WALL_OF[view as keyof typeof WALL_OF]] : undefined;
  const ownReady = !hasLiveScene && own?.status === "ready" && own.manifestUrl && own.assetsUrl ? own : undefined;

  if (!layout) {
    return <Screen board="S4-Showroom" step={4} dock={<Back to="S4-Layouts" />}>
      <h1 className="h1">Choose your layout first</h1>
      <p className="sub">The showroom uses your confirmed furniture layout and room dimensions.</p>
      <Go className="btn auto" to="S4-Layouts">Choose layout</Go>
    </Screen>;
  }

  let sub = "Your room is shown wall by wall, as real pictures in the style of your preview. Tap a piece to swap it.";
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
    <div className="panel" style={{ marginTop: 24, overflow: "hidden", padding: 0 }}>
      {hasLiveScene ? (
        <GeneratorProShowroom scriptUrl={SCRIPT_URL} configUrl={scene!.manifest_url} assetsUrl={scene!.assets_url} />
      ) : ownReady ? (
        <GeneratorProShowroom key={ownReady.manifestUrl} scriptUrl={SCRIPT_URL} configUrl={ownReady.manifestUrl!} assetsUrl={ownReady.assetsUrl!} />
      ) : (
        <div style={{ padding: 36 }}>
          <p className="p">{view === "room" ? "Your room's pictures are made one wall at a time." : "This wall's picture isn't ready yet."}</p>
          <p className="small">They are made in step 5, from your layout and in the style of your preview.</p>
          <Go className="btn auto" to="S5-Walls" style={{ marginTop: 12 }}>Go to your walls</Go>
        </div>
      )}
    </div>
    <section className="panel" style={{ marginTop: 24, padding: 24 }}>
      <h2 className="h3">Confirmed layout · {layout.name}</h2>
      <p className="small">The pictures follow this plan.</p>
      <div style={{ display: "flex", justifyContent: "center", overflow: "auto", marginTop: 16 }}>
        <PlanDrawing layout={layout} s={s} box={{ w: 300, h: 392 }} />
      </div>
    </section>
  </Screen>;
}
