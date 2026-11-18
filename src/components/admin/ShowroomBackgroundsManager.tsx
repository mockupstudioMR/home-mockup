/** Showroom backgrounds: the starting picture per room state × room type × view. Generate, review, approve. */
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/looseDb";
import { useToast } from "@/hooks/use-toast";

const STATES: [string, string][] = [["core_shell", "Core & shell"], ["empty", "Empty"], ["partially_furnished", "Partly furnished"], ["redo_all", "Redo it all"]];
const ROOMS: [string, string][] = [
  ["living-room", "Living room"], ["bedroom", "Bedroom"], ["kitchen", "Kitchen"], ["dining-room", "Dining room"],
  ["office", "Home office"], ["bathroom", "Bathroom"], ["kids-room", "Kids' room"], ["hallway", "Hallway & entry"],
];
const VIEWS: [string, string][] = [["room", "Whole room"], ["wall_a", "Wall A"], ["wall_b", "Wall B"], ["wall_c", "Wall C"], ["wall_d", "Wall D"]];
const STATUS: Record<string, string> = { to_generate: "To generate", generated: "To review", approved: "Approved" };

type Row = { id: string; starting_state: string; room_type: string; view: string; label: string; prompt: string; image_path: string | null; status: string };

export default function ShowroomBackgroundsManager() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [room, setRoom] = useState("living-room");
  const [running, setRunning] = useState<string | null>(null);
  const stop = useRef(false);
  const [open, setOpen] = useState<Row | null>(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["showroom-backgrounds"],
    queryFn: async () => {
      const { data, error } = await supabase.from("showroom_backgrounds").select("*");
      if (error) throw error;
      return data as Row[];
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["showroom-backgrounds"] });
  const count = (f: (r: Row) => boolean) => rows.filter(f).length;

  async function call(body: Record<string, string>) {
    const { data, error } = await supabase.functions.invoke("generate-showroom-backgrounds", { body });
    if (error || data?.error) throw new Error(data?.error ?? error?.message ?? "Generation failed");
    return data as { done: boolean; remaining: number; row?: Row };
  }

  async function generateAll(roomType?: string) {
    stop.current = false;
    setRunning(roomType ?? "all");
    try {
      for (;;) {
        if (stop.current) break;
        const res = await call(roomType ? { roomType } : {});
        refresh();
        if (res.done || res.remaining === 0) break;
      }
      toast({ title: stop.current ? "Paused" : "Backgrounds generated", description: stop.current ? "Press Generate to carry on." : "Review them and approve the ones that work." });
    } catch (e) {
      toast({ title: "Generation stopped", description: (e as Error).message, variant: "destructive" });
    } finally {
      setRunning(null);
      refresh();
    }
  }

  async function redo(r: Row) {
    setRunning(r.id);
    try {
      await call({ id: r.id });
      toast({ title: "New version ready", description: r.label });
    } catch (e) {
      toast({ title: "Could not redo it", description: (e as Error).message, variant: "destructive" });
    } finally {
      setRunning(null);
      refresh();
    }
  }

  async function setStatus(ids: string[], status: string) {
    const { error } = await supabase.from("showroom_backgrounds").update({ status, updated_at: new Date().toISOString() }).in("id", ids);
    if (error) toast({ title: "Could not save", description: error.message, variant: "destructive" });
    refresh();
  }

  const inRoom = rows.filter((r) => r.room_type === room);
  const left = count((r) => r.room_type === room && r.status === "to_generate");
  const toReview = inRoom.filter((r) => r.status === "generated");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Showroom backgrounds</h2>
        <p className="text-sm text-muted-foreground max-w-3xl">
          The picture the showroom opens on before a user's own room is drawn: one per room state, room type and view (the whole room and walls A–D).
          The whole-room picture is made first; the walls use it so they look like the same room.
        </p>
        <p className="text-sm mt-2">
          <b>{count((r) => r.status === "approved")}</b> approved · <b>{count((r) => r.status === "generated")}</b> to review · <b>{count((r) => r.status === "to_generate")}</b> to generate · {rows.length} in all
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Room type">
        {ROOMS.map(([id, l]) => {
          const n = rows.filter((r) => r.room_type === id);
          const done = n.filter((r) => r.status === "approved").length;
          return (
            <button key={id} type="button" role="tab" aria-selected={room === id} onClick={() => setRoom(id)}
              className={`min-h-[44px] px-4 rounded-full border text-sm font-medium ${room === id ? "bg-foreground text-background" : "bg-background"}`}>
              {l} <span className="opacity-70">· {done}/{n.length || 20}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {running ? (
          <button type="button" className="min-h-[44px] px-5 rounded-lg border font-medium" onClick={() => { stop.current = true; }}>
            Pause after this picture
          </button>
        ) : (
          <>
            <button type="button" disabled={!left} className="min-h-[44px] px-5 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50" onClick={() => generateAll(room)}>
              {left ? `Generate ${ROOMS.find(([id]) => id === room)?.[1].toLowerCase()} (${left})` : "All generated"}
            </button>
            <button type="button" disabled={!count((r) => r.status === "to_generate")} className="min-h-[44px] px-5 rounded-lg border font-medium disabled:opacity-50" onClick={() => generateAll()}>
              Generate every room
            </button>
            {toReview.length > 0 && (
              <button type="button" className="min-h-[44px] px-5 rounded-lg border font-medium" onClick={() => setStatus(toReview.map((r) => r.id), "approved")}>
                Approve all {toReview.length} in this room
              </button>
            )}
          </>
        )}
        {running && <span className="text-sm text-muted-foreground" role="status">Generating… about 30 seconds a picture.</span>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-2" style={{ minWidth: 980 }}>
          <thead>
            <tr>
              <th className="text-left text-xs uppercase tracking-wide text-muted-foreground w-36">State</th>
              {VIEWS.map(([, l]) => <th key={l} className="text-left text-xs uppercase tracking-wide text-muted-foreground">{l}</th>)}
            </tr>
          </thead>
          <tbody>
            {STATES.map(([st, sl]) => (
              <tr key={st}>
                <th scope="row" className="text-left align-top text-sm font-semibold pt-2">{sl}</th>
                {VIEWS.map(([v]) => {
                  const r = inRoom.find((x) => x.starting_state === st && x.view === v);
                  if (!r) return <td key={v} className="text-xs text-muted-foreground">—</td>;
                  return (
                    <td key={v} className="align-top">
                      <button type="button" onClick={() => setOpen(r)} aria-label={`Open ${r.label}`}
                        className={`block w-full aspect-video rounded-lg overflow-hidden border-2 ${r.status === "approved" ? "border-green-600" : r.status === "generated" ? "border-amber-500" : "border-dashed border-muted-foreground/40"} bg-muted`}>
                        {r.image_path ? <img src={r.image_path} alt={r.label} className="w-full h-full object-cover" loading="lazy" /> : <span className="text-xs text-muted-foreground">{running === r.id ? "Generating…" : "Not yet"}</span>}
                      </button>
                      <span className="text-xs text-muted-foreground">{STATUS[r.status]}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (() => {
        const r = rows.find((x) => x.id === open.id) ?? open;
        return (
          <div role="dialog" aria-modal="true" aria-label={r.label} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
            <div className="bg-background rounded-2xl max-w-4xl w-full p-5 space-y-4 max-h-[92vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div><h3 className="text-lg font-semibold">{r.label}</h3><span className="text-sm text-muted-foreground">{STATUS[r.status]}</span></div>
                <button type="button" className="min-h-[44px] px-4 rounded-lg border" onClick={() => setOpen(null)}>Close</button>
              </div>
              {r.image_path ? <img src={r.image_path} alt={r.label} className="w-full rounded-xl" /> : <p className="text-sm text-muted-foreground">No picture yet.</p>}
              <details><summary className="text-sm font-medium cursor-pointer">What the AI is asked to draw</summary><p className="text-sm text-muted-foreground mt-2">{r.prompt}</p></details>
              <div className="flex flex-wrap gap-2">
                {r.image_path && r.status !== "approved" && <button type="button" className="min-h-[44px] px-5 rounded-lg bg-primary text-primary-foreground font-medium" onClick={() => setStatus([r.id], "approved")}>Approve</button>}
                {r.status === "approved" && <button type="button" className="min-h-[44px] px-5 rounded-lg border font-medium" onClick={() => setStatus([r.id], "generated")}>Un-approve</button>}
                <button type="button" disabled={!!running} className="min-h-[44px] px-5 rounded-lg border font-medium disabled:opacity-50" onClick={() => redo(r)}>{running === r.id ? "Generating…" : r.image_path ? "Make a new version" : "Generate"}</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
