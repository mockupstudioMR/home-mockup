import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, Activity, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface RoomActivity {
  id: string;
  room_type: string;
  activity_name: string;
  priority: number;
  furniture_items: string[];
  preferred_zone: string;
  preferred_orientation: string;
  advisory_text: string | null;
  opening_affinity: Record<string, string>;
  space_weight: number;
  is_predefined: boolean;
}

export default function RoomActivitiesManager() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [openRooms, setOpenRooms] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<RoomActivity>>({});
  const [newActivity, setNewActivity] = useState<Partial<RoomActivity> | null>(null);

  const { data: activities, isLoading } = useQuery({
    queryKey: ["room-activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_activities")
        .select("*")
        .order("room_type")
        .order("priority");
      if (error) throw error;
      return data as RoomActivity[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, ...values }: any) => {
      const { error } = await supabase.from("room_activities").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["room-activities"] });
      setEditing(null);
      setEditData({});
      toast({ title: "Saved" });
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  const insertMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("room_activities").insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["room-activities"] });
      setNewActivity(null);
      toast({ title: "Added" });
    },
    onError: (e: any) => toast({ title: e.message || "Insert failed", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("room_activities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["room-activities"] });
      toast({ title: "Deleted" });
    },
  });

  const grouped = (activities || []).reduce<Record<string, RoomActivity[]>>((acc, a) => {
    (acc[a.room_type] = acc[a.room_type] || []).push(a);
    return acc;
  }, {});

  const startEdit = (a: RoomActivity) => {
    setEditing(a.id);
    setEditData({
      activity_name: a.activity_name,
      priority: a.priority,
      furniture_items: a.furniture_items,
      preferred_zone: a.preferred_zone,
      preferred_orientation: a.preferred_orientation,
      advisory_text: a.advisory_text,
      opening_affinity: a.opening_affinity,
      space_weight: a.space_weight,
    });
  };

  const handleSave = (a: RoomActivity) => {
    saveMutation.mutate({ id: a.id, ...editData });
  };

  const handleInsert = () => {
    if (!newActivity?.room_type || !newActivity?.activity_name) return;
    insertMutation.mutate({
      room_type: newActivity.room_type,
      activity_name: newActivity.activity_name,
      priority: newActivity.priority || 1,
      furniture_items: newActivity.furniture_items || [],
      preferred_zone: newActivity.preferred_zone || "center",
      preferred_orientation: newActivity.preferred_orientation || "any",
      advisory_text: newActivity.advisory_text || null,
      opening_affinity: newActivity.opening_affinity || {},
      space_weight: newActivity.space_weight || 0.2,
      is_predefined: true,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Room Activities
        </CardTitle>
        <CardDescription>
          Define activities per room type with placement rules and advisory text
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          Object.entries(grouped).map(([roomType, acts]) => (
            <Collapsible
              key={roomType}
              open={openRooms[roomType] ?? false}
              onOpenChange={(open) => setOpenRooms((p) => ({ ...p, [roomType]: open }))}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between text-left font-medium capitalize">
                  <span>{roomType.replace(/_/g, " ")} ({acts.length} activities)</span>
                  {openRooms[roomType] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pl-2 border-l-2 border-border/50 ml-3 mt-2">
                {acts.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50 space-y-2">
                    {editing === a.id ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <Input value={editData.activity_name || ""} onChange={(e) => setEditData((p) => ({ ...p, activity_name: e.target.value }))} placeholder="Activity name" className="h-8 text-xs" />
                          <Input type="number" value={editData.priority || 1} onChange={(e) => setEditData((p) => ({ ...p, priority: +e.target.value }))} placeholder="Priority" className="h-8 text-xs" />
                          <Input value={editData.preferred_zone || ""} onChange={(e) => setEditData((p) => ({ ...p, preferred_zone: e.target.value }))} placeholder="Zone" className="h-8 text-xs" />
                          <Input type="number" step="0.05" value={editData.space_weight || 0.2} onChange={(e) => setEditData((p) => ({ ...p, space_weight: +e.target.value }))} placeholder="Weight" className="h-8 text-xs" />
                        </div>
                        <Input
                          value={(editData.furniture_items || []).join(", ")}
                          onChange={(e) => setEditData((p) => ({ ...p, furniture_items: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
                          placeholder="Furniture items (comma-separated)"
                          className="h-8 text-xs"
                        />
                        <Input
                          value={editData.preferred_orientation || ""}
                          onChange={(e) => setEditData((p) => ({ ...p, preferred_orientation: e.target.value }))}
                          placeholder="Orientation"
                          className="h-8 text-xs"
                        />
                        <Textarea
                          value={editData.advisory_text || ""}
                          onChange={(e) => setEditData((p) => ({ ...p, advisory_text: e.target.value }))}
                          placeholder="Advisory text shown to users..."
                          className="text-xs min-h-[60px]"
                        />
                        <Input
                          value={JSON.stringify(editData.opening_affinity || {})}
                          onChange={(e) => {
                            try { setEditData((p) => ({ ...p, opening_affinity: JSON.parse(e.target.value) })); } catch {}
                          }}
                          placeholder='Opening affinity JSON: {"window": "near", "door": "away"}'
                          className="h-8 text-xs font-mono"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" onClick={() => handleSave(a)}><Save className="w-3.5 h-3.5 mr-1" /> Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setEditData({}); }}>Cancel</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">P{a.priority}</Badge>
                            <span className="font-medium text-sm">{a.activity_name}</span>
                            <Badge variant="secondary" className="text-[10px]">{a.preferred_zone}</Badge>
                            <Badge variant="secondary" className="text-[10px]">{Math.round(a.space_weight * 100)}%</Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => startEdit(a)}>Edit</Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(a.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{a.furniture_items.join(", ")}</p>
                        {a.advisory_text && <p className="text-xs italic text-muted-foreground/80">💡 {a.advisory_text}</p>}
                      </>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))
        )}

        {/* Add new activity */}
        {newActivity ? (
          <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Input value={newActivity.room_type || ""} onChange={(e) => setNewActivity((p) => ({ ...p, room_type: e.target.value }))} placeholder="room_type" className="h-8 text-xs" />
              <Input value={newActivity.activity_name || ""} onChange={(e) => setNewActivity((p) => ({ ...p, activity_name: e.target.value }))} placeholder="Activity name" className="h-8 text-xs" />
              <Input type="number" value={newActivity.priority || 1} onChange={(e) => setNewActivity((p) => ({ ...p, priority: +e.target.value }))} placeholder="Priority" className="h-8 text-xs" />
              <Input type="number" step="0.05" value={newActivity.space_weight || 0.2} onChange={(e) => setNewActivity((p) => ({ ...p, space_weight: +e.target.value }))} className="h-8 text-xs" />
            </div>
            <Input value={(newActivity.furniture_items || []).join(", ")} onChange={(e) => setNewActivity((p) => ({ ...p, furniture_items: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))} placeholder="Furniture items (comma-separated)" className="h-8 text-xs" />
            <Input value={newActivity.preferred_zone || ""} onChange={(e) => setNewActivity((p) => ({ ...p, preferred_zone: e.target.value }))} placeholder="Preferred zone" className="h-8 text-xs" />
            <Textarea value={newActivity.advisory_text || ""} onChange={(e) => setNewActivity((p) => ({ ...p, advisory_text: e.target.value }))} placeholder="Advisory text..." className="text-xs min-h-[60px]" />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleInsert} disabled={!newActivity.room_type || !newActivity.activity_name}><Save className="w-3.5 h-3.5 mr-1" /> Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setNewActivity(null)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setNewActivity({ room_type: "", activity_name: "", priority: 1, furniture_items: [], preferred_zone: "center", space_weight: 0.2 })}>
            <Plus className="w-4 h-4 mr-1" /> Add Activity
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
