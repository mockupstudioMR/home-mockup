import { useState } from "react";
import { GeneratorProShowroom } from "@/components/showroom/GeneratorProShowroom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/looseDb";
import { Back, Go, Screen } from "../Shell";
import { curRoom, useJourney } from "../state";
import { PlanDrawing } from "./Step4";

const stateMap: Record<string, string> = {
  "core-shell": "core_shell",
  empty: "empty",
  partial: "partially_furnished",
  redoing: "redo_all",
};
const views = [
  ["room", "Whole room"], ["wall_a", "Wall A"], ["wall_b", "Wall B"],
  ["wall_c", "Wall C"], ["wall_d", "Wall D"],
] as const;
const SCRIPT_URL = "/generator-pro/showroom-configurator.js";

/**
 * Sample scenes shipped with the app (public/showroom-demo). They are real
 * Generator PRO scenes: camera-aligned, transparent variation layers made from
 * the sample photo itself. They let people try the showroom before their own
 * room has been prepared, and are always labelled as a sample.
 */
const SAMPLE_SCENES: Record<string, { configUrl: string; assetsUrl: string }> = {
  "living-room": { configUrl: "/showroom-demo/living-room/manifest.json", assetsUrl: "/showroom-demo/living-room/" },
};

/**
 * Layout-to-showroom handoff. Order of what is shown for the chosen view:
 * 1. the person's own prepared scene (showroom_scenes, status ready)
 * 2. the sample scene for this room type, labelled as a sample (whole-room view only)
 * 3. the approved reference background for this room state (a picture, not interactive)
 * Backgrounds are references, NOT Generator PRO compositing assets.
 */
export function ShowroomHandoff() {
  const { s } = useJourney();
  const [view, setView] = useState<string>("room");
  const layout = s.layouts[s.chosenLayout ?? 0];
  const roomType = curRoom(s) ?? "living-room";
  const startingState = stateMap[s.houseState ?? "empty"] ?? "empty";
  const { data: backgrounds = [], isLoading, error } = useQuery({
    queryKey: ["showroom-backgrounds", roomType, startingState],
    queryFn: async () => {
      const { data, error } = await supabase.from("showroom_backgrounds")
        .select("view,image_path,status")
        .eq("room_type", roomType)
        .eq("starting_state", startingState)
        .eq("status", "approved");
      if (error) throw error;
      return data ?? [];
    },
  });
  const background = backgrounds.find((row) => row.view === view && row.image_path);
  const { data: scene, isLoading: sceneLoading } = useQuery({
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
  const sample = !hasLiveScene && view === "room" ? SAMPLE_SCENES[roomType] : undefined;

  if (!layout) {
    return <Screen board="S4-Showroom" step={4} dock={<Back to="S4-Layouts" />}>
      <h1 className="h1">Choose your layout first</h1>
      <p className="sub">The showroom uses your confirmed furniture layout and room dimensions.</p>
      <Go className="btn auto" to="S4-Layouts">Choose layout</Go>
    </Screen>;
  }

  let sub = "Preview your approved background while the interactive scene is being prepared.";
  if (hasLiveScene) sub = "Tap a dot in the room, or a tab below it, and swap what's there. Every change shows straight away.";
  else if (sample) sub = "Try it in a sample room while yours is prepared: tap a dot, or a tab below, and swap the sofa or the wall colour.";

  return <Screen board="S4-Showroom" step={4} right={layout.name}
    dock={<><Back to="S4-Summary" /><Go className="btn auto" to="S3-Existing">Continue to furniture</Go></>}>
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
      ) : sample ? (
        <>
          <p className="small" role="note" style={{ margin: 0, padding: "12px 20px", background: "var(--tbc-bg, #FBE9DA)", color: "var(--tbc-ink, #7A4A1E)", fontWeight: 600 }}>
            Sample room · your own room appears here once it's prepared
          </p>
          <GeneratorProShowroom scriptUrl={SCRIPT_URL} configUrl={sample.configUrl} assetsUrl={sample.assetsUrl} />
        </>
      ) : background ? (
        <img src={background.image_path} alt={`Approved ${view} reference background`}
          style={{ display: "block", width: "100%", maxHeight: 620, objectFit: "contain" }} />
      ) : (
        <div style={{ padding: 36 }}>
          <p className="p">{isLoading || sceneLoading ? "Loading showroom background…" : error ? "Could not load the showroom background." : "No approved reference image for this view yet."}</p>
          <p className="small">The chosen floor plan is available below. Backgrounds can be approved in Admin → Showroom backgrounds.</p>
        </div>
      )}
    </div>
    <section className="panel" style={{ marginTop: 24, padding: 24 }}>
      <h2 className="h3">Confirmed layout · {layout.name}</h2>
      <p className="small">{hasLiveScene ? "This plan is your actual layout." : "The room picture above is illustrative; this plan is your actual layout."}</p>
      <div style={{ display: "flex", justifyContent: "center", overflow: "auto", marginTop: 16 }}>
        <PlanDrawing layout={layout} s={s} box={{ w: 300, h: 392 }} />
      </div>
    </section>
  </Screen>;
}
