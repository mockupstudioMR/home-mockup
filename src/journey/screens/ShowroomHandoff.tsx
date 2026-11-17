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

/**
 * Layout-to-showroom handoff. Backgrounds are references, NOT Generator PRO
 * compositing assets. Never represent this preview as an interactive renderer.
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
  // Live rendering needs a real scene manifest and prepared WebP assets.
  const scriptUrl = import.meta.env.VITE_GENERATOR_PRO_SCRIPT_URL as string | undefined;
  const manifestUrl = import.meta.env.VITE_GENERATOR_PRO_CONFIG_URL as string | undefined;
  const assetsUrl = import.meta.env.VITE_GENERATOR_PRO_ASSETS_URL as string | undefined;
  const hasLiveScene = Boolean(scriptUrl && manifestUrl && assetsUrl && view === "room");
  if (!layout) {
    return <Screen board="S4-Showroom" step={4} dock={<Back to="S4-Layouts" />}>
      <h1 className="h1">Choose your layout first</h1>
      <p className="sub">The showroom uses your confirmed furniture layout and room dimensions.</p>
      <Go className="btn auto" to="S4-Layouts">Choose layout</Go>
    </Screen>;
  }
  return <Screen board="S4-Showroom" step={4} right={layout.name}
    dock={<><Back to="S4-Summary" /><Go className="btn auto" to="S3-Existing">Continue to furniture</Go></>}>
    <p className="eyebrow">Your room · showroom preview</p>
    <h1 className="h1">Your layout, in your room</h1>
    <p className="sub">{hasLiveScene ? "Customize your prepared showroom scene." : "This is a reference background. Interactive swaps require a prepared Generator PRO scene."}</p>
    <div className="chips" role="group" aria-label="Showroom view" style={{ marginTop: 24 }}>
      {views.map(([key, label]) => <button key={key} type="button"
        aria-pressed={view === key} className={`chip${view === key ? " sel" : ""}`}
        onClick={() => setView(key)}>{label}</button>)}
    </div>
    <div className="panel" style={{ marginTop: 24, overflow: "hidden" }}>
      {hasLiveScene ? <GeneratorProShowroom scriptUrl={scriptUrl!} configUrl={manifestUrl!} assetsUrl={assetsUrl!} /> : background ? <img src={background.image_path} alt={`Approved ${view} reference background`}
        style={{ display: "block", width: "100%", maxHeight: 620, objectFit: "contain" }} /> :
        <div style={{ padding: 36 }}>
          <p className="p">{isLoading ? "Loading showroom background…" : error ? "Could not load the showroom background." : "No approved reference image for this view yet."}</p>
          <p className="small">The chosen floor plan is available below. Backgrounds can be approved in Admin → Showroom backgrounds.</p>
        </div>}
    </div>
    <section className="panel" style={{ marginTop: 24, padding: 24 }}>
      <h2 className="h3">Confirmed layout · {layout.name}</h2>
      <p className="small">The room picture above is illustrative; this plan is your actual layout.</p>
      <div style={{ display: "flex", justifyContent: "center", overflow: "auto", marginTop: 16 }}>
        <PlanDrawing layout={layout} s={s} box={{ w: 300, h: 392 }} />
      </div>
    </section>
  </Screen>;
}
