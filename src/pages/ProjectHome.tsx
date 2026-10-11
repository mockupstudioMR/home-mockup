import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Home, RotateCw } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ShopChoicePanel from "@/components/shop/ShopChoicePanel";
import { ROOM_LABELS, ensureProject, projectDb, projectsReady } from "@/lib/projectStore";
import { cn } from "@/lib/utils";
import { resumeRoomInJourney } from "@/journey/state";

const STEP_NAMES = ["", "Project", "Inspiration", "Daily life", "Layout", "Furniture", "Colours", "Lighting", "Details", "Make it happen", "Together"];
const STATE_LABEL: Record<string, string> = {
  core_shell: "Core & shell",
  empty: "Empty",
  partially_furnished: "Partly furnished",
  redo_all: "Redoing it all",
};

/** Project home: every room of the project, where each stands, and the next one to design. */
const ProjectHome = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["project-home"],
    queryFn: async () => {
      if (!(await projectsReady())) return { ready: false as const };
      const projectId = await ensureProject();
      if (!projectId) return { ready: false as const };
      const [{ data: project }, { data: rooms }] = await Promise.all([
        projectDb.from("projects").select("*").eq("id", projectId).single(),
        projectDb.from("rooms").select("id, name, room_type, sequence_no, current_step, starting_state").eq("project_id", projectId).order("sequence_no"),
      ]);
      return { ready: true as const, project, rooms: rooms ?? [] };
    },
  });

  const continueRoom = useMutation({
    mutationFn: async (room: { id: string; room_type: string; current_step: number }) => {
      if (room.current_step < 2) await projectDb.from("rooms").update({ current_step: 2 }).eq("id", room.id);
      try {
        localStorage.setItem("hm_room_id", room.id);
      } catch {
        /* private mode */
      }
      return room;
    },
    onSuccess: (room) => {
      qc.invalidateQueries({ queryKey: ["project-home"] });
      resumeRoomInJourney(room.room_type, room.id);
      navigate(room.current_step > 2 ? "/journey" : "/journey/2/vision");
    },
  });

  const rooms = data?.ready ? data.rooms : [];
  const done = rooms.filter((r) => r.current_step >= 10).length;
  const next = rooms.find((r) => r.current_step < 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      <header className="flex items-center justify-between p-4 md:p-6">
        <button onClick={() => navigate("/")} className="flex items-center gap-3">
          <Logo size={32} />
          <span className="text-lg font-semibold tracking-tight">HomeMockUp</span>
        </button>
        <Button variant="ghost" onClick={() => navigate("/journey")}>Start something new</Button>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-4 pb-20">
        <div className="pt-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Your project</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-6xl">{data?.ready ? data.project?.name ?? "My home" : "My home"}</h1>
          {data?.ready && rooms.length > 0 && (
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              {done} of {rooms.length} rooms designed. Your project basics carry over; steps 2–10 repeat for each room.
            </p>
          )}
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading your project…</p>
        ) : !data?.ready ? (
          <Card>
            <CardContent className="space-y-4 py-10 text-center">
              <p className="text-lg font-semibold">Projects are being set up.</p>
              <p className="text-muted-foreground">You can keep designing as usual in the meantime.</p>
              <Button onClick={() => navigate("/journey")}>Continue designing <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ) : rooms.length === 0 ? (
          <Card>
            <CardContent className="space-y-4 py-10 text-center">
              <p className="text-lg font-semibold">No rooms yet</p>
              <p className="text-muted-foreground">Tell us about your place and pick the rooms you want to design.</p>
              <Button onClick={() => navigate("/journey/1/rooms")}>Pick your rooms <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ) : (
          <section className="space-y-4" aria-label="Rooms">
            <div className="grid gap-4 md:grid-cols-2">
              {rooms.map((r) => {
                const finished = r.current_step >= 10;
                const isNext = next?.id === r.id;
                return (
                  <div
                    key={r.id}
                    className={cn(
                      "space-y-4 rounded-3xl border bg-card p-6",
                      isNext && "border-2 border-primary shadow-lg",
                      finished && "border-emerald-300",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xl font-extrabold">{r.name || ROOM_LABELS[r.room_type] || r.room_type}</p>
                        <p className="text-sm text-muted-foreground">{r.starting_state ? STATE_LABEL[r.starting_state] : "Starting point not set"}</p>
                      </div>
                      {finished ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800"><Check className="h-3 w-3" /> Done</span>
                      ) : r.current_step > 2 ? (
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Step {r.current_step} · {STEP_NAMES[r.current_step]}</span>
                      ) : (
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">Not started</span>
                      )}
                    </div>
                    <div className="grid grid-cols-10 gap-1" aria-label={`Step ${r.current_step} of 10`}>
                      {Array.from({ length: 10 }, (_, i) => (
                        <span key={i} className={cn("h-1.5 rounded-full", i + 1 < r.current_step || finished ? "bg-primary/60" : i + 1 === r.current_step ? "bg-primary" : "bg-muted")} />
                      ))}
                    </div>
                    <Button
                      className="w-full"
                      variant={isNext ? "default" : "outline"}
                      disabled={continueRoom.isPending}
                      onClick={() => continueRoom.mutate(r)}
                    >
                      {finished ? <><RotateCw className="mr-2 h-4 w-4" /> Revisit this room</> : r.current_step > 2 ? "Continue this room" : "Start this room — from step 2"}
                    </Button>
                  </div>
                );
              })}
            </div>
            {next && (
              <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Home className="h-4 w-4" /> Next up: {next.name}
              </p>
            )}
          </section>
        )}

        {data?.ready && <ShopChoicePanel compact />}
      </main>
    </div>
  );
};

export default ProjectHome;
