import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";

interface RoomConfig {
  id: string;
  room_type: string;
  room_label: string;
  furniture_items: string[];
  description: string | null;
}

const RoomFurnitureManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<RoomConfig>>({});
  const [newItem, setNewItem] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newRoom, setNewRoom] = useState({ room_type: "", room_label: "", description: "", furniture_items: [] as string[] });
  const [newRoomItem, setNewRoomItem] = useState("");

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["room-furniture-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_furniture_config")
        .select("*")
        .order("room_label");
      if (error) throw error;
      return data as RoomConfig[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<RoomConfig>) => {
      const { error } = await supabase
        .from("room_furniture_config")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-furniture-config"] });
      setEditingId(null);
      setEditData({});
      toast({ title: "Room config updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newRoom) => {
      const { error } = await supabase
        .from("room_furniture_config")
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-furniture-config"] });
      setAddingNew(false);
      setNewRoom({ room_type: "", room_label: "", description: "", furniture_items: [] });
      toast({ title: "Room type added" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("room_furniture_config")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-furniture-config"] });
      toast({ title: "Room type deleted" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const startEdit = (room: RoomConfig) => {
    setEditingId(room.id);
    setEditData({ ...room });
  };

  const addFurnitureItem = (items: string[], setItems: (items: string[]) => void, item: string, clearInput: () => void) => {
    const trimmed = item.trim();
    if (trimmed && !items.includes(trimmed)) {
      setItems([...items, trimmed]);
      clearInput();
    }
  };

  const removeFurnitureItem = (items: string[], setItems: (items: string[]) => void, index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Room Types & Furniture</h3>
          <p className="text-sm text-muted-foreground">Define furniture items for each room type used in design generation</p>
        </div>
        <Button onClick={() => setAddingNew(true)} disabled={addingNew} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Room Type
        </Button>
      </div>

      {addingNew && (
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Room Type Key</Label>
                <Input
                  placeholder="e.g. dining-room"
                  value={newRoom.room_type}
                  onChange={(e) => setNewRoom({ ...newRoom, room_type: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Display Label</Label>
                <Input
                  placeholder="e.g. Dining Room"
                  value={newRoom.room_label}
                  onChange={(e) => setNewRoom({ ...newRoom, room_label: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Input
                placeholder="A brief description..."
                value={newRoom.description}
                onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Furniture Items</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add furniture item..."
                  value={newRoomItem}
                  onChange={(e) => setNewRoomItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFurnitureItem(newRoom.furniture_items, (items) => setNewRoom({ ...newRoom, furniture_items: items }), newRoomItem, () => setNewRoomItem(""));
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addFurnitureItem(newRoom.furniture_items, (items) => setNewRoom({ ...newRoom, furniture_items: items }), newRoomItem, () => setNewRoomItem(""))}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {newRoom.furniture_items.map((item, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {item}
                    <button onClick={() => removeFurnitureItem(newRoom.furniture_items, (items) => setNewRoom({ ...newRoom, furniture_items: items }), idx)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setAddingNew(false)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => createMutation.mutate(newRoom)}
                disabled={!newRoom.room_type || !newRoom.room_label || createMutation.isPending}
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {rooms?.map((room) => {
        const isEditing = editingId === room.id;
        const data = isEditing ? editData : room;

        return (
          <Card key={room.id} className={isEditing ? "border-primary/30" : ""}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Room Type Key</Label>
                        <Input
                          value={data.room_type || ""}
                          onChange={(e) => setEditData({ ...editData, room_type: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Display Label</Label>
                        <Input
                          value={data.room_label || ""}
                          onChange={(e) => setEditData({ ...editData, room_label: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{room.room_label}</h4>
                      <Badge variant="outline" className="text-xs font-mono">{room.room_type}</Badge>
                    </div>
                  )}
                  {isEditing ? (
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={data.description || ""}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{room.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setEditingId(null); setEditData({}); }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateMutation.mutate({
                          id: room.id,
                          room_type: editData.room_type,
                          room_label: editData.room_label,
                          description: editData.description,
                          furniture_items: editData.furniture_items,
                        })}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => startEdit(room)}>Edit</Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(room.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Furniture items */}
              <div>
                <Label className="text-xs text-muted-foreground">Furniture Items</Label>
                {isEditing && (
                  <div className="flex gap-2 mt-1 mb-2">
                    <Input
                      placeholder="Add item..."
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addFurnitureItem(
                            editData.furniture_items || [],
                            (items) => setEditData({ ...editData, furniture_items: items }),
                            newItem,
                            () => setNewItem("")
                          );
                        }
                      }}
                      className="h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => addFurnitureItem(
                        editData.furniture_items || [],
                        (items) => setEditData({ ...editData, furniture_items: items }),
                        newItem,
                        () => setNewItem("")
                      )}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-1 mt-1">
                  {(data.furniture_items || []).map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs gap-1">
                      {item}
                      {isEditing && (
                        <button onClick={() => removeFurnitureItem(
                          editData.furniture_items || [],
                          (items) => setEditData({ ...editData, furniture_items: items }),
                          idx
                        )}>
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default RoomFurnitureManager;
