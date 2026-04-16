import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, Ruler } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FurnitureSpec {
  id: string;
  name: string;
  width_cm: number;
  depth_cm: number;
  min_clearance_cm: number;
  must_against_wall: boolean;
  default_orientation: string;
  grouping_key: string | null;
  companion_of: string | null;
}

const EMPTY: Omit<FurnitureSpec, "id"> = {
  name: "",
  width_cm: 80,
  depth_cm: 60,
  min_clearance_cm: 40,
  must_against_wall: false,
  default_orientation: "any",
  grouping_key: null,
  companion_of: null,
};

export default function FurnitureSpecsManager() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [edits, setEdits] = useState<Record<string, Partial<FurnitureSpec>>>({});
  const [newRow, setNewRow] = useState<Omit<FurnitureSpec, "id"> | null>(null);

  const { data: specs, isLoading } = useQuery({
    queryKey: ["furniture-specs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("furniture_specs")
        .select("*")
        .order("grouping_key", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data as FurnitureSpec[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, ...values }: FurnitureSpec) => {
      const { error } = await supabase.from("furniture_specs").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["furniture-specs"] });
      toast({ title: "Saved" });
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  const insertMutation = useMutation({
    mutationFn: async (values: Omit<FurnitureSpec, "id">) => {
      const { error } = await supabase.from("furniture_specs").insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["furniture-specs"] });
      setNewRow(null);
      toast({ title: "Added" });
    },
    onError: (e: any) => toast({ title: e.message || "Insert failed", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("furniture_specs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["furniture-specs"] });
      toast({ title: "Deleted" });
    },
  });

  const getVal = (spec: FurnitureSpec, field: keyof FurnitureSpec) => {
    return edits[spec.id]?.[field] ?? spec[field];
  };

  const setVal = (id: string, field: keyof FurnitureSpec, value: any) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSave = (spec: FurnitureSpec) => {
    const merged = { ...spec, ...edits[spec.id] } as FurnitureSpec;
    saveMutation.mutate(merged);
    setEdits((prev) => {
      const next = { ...prev };
      delete next[spec.id];
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="w-5 h-5" />
          Furniture Specifications
        </CardTitle>
        <CardDescription>
          Define dimensions, clearances, wall preferences, and grouping for each furniture type
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-20">W (cm)</TableHead>
                  <TableHead className="w-20">D (cm)</TableHead>
                  <TableHead className="w-20">Clearance</TableHead>
                  <TableHead className="w-16">Wall</TableHead>
                  <TableHead>Orientation</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Companion Of</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {specs?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Input
                        value={getVal(s, "name") as string}
                        onChange={(e) => setVal(s.id, "name", e.target.value)}
                        className="h-8 text-xs w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={getVal(s, "width_cm") as number}
                        onChange={(e) => setVal(s.id, "width_cm", +e.target.value)}
                        className="h-8 text-xs w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={getVal(s, "depth_cm") as number}
                        onChange={(e) => setVal(s.id, "depth_cm", +e.target.value)}
                        className="h-8 text-xs w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={getVal(s, "min_clearance_cm") as number}
                        onChange={(e) => setVal(s.id, "min_clearance_cm", +e.target.value)}
                        className="h-8 text-xs w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={getVal(s, "must_against_wall") as boolean}
                        onCheckedChange={(v) => setVal(s.id, "must_against_wall", v)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={getVal(s, "default_orientation") as string}
                        onChange={(e) => setVal(s.id, "default_orientation", e.target.value)}
                        className="h-8 text-xs w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={(getVal(s, "grouping_key") as string) || ""}
                        onChange={(e) => setVal(s.id, "grouping_key", e.target.value || null)}
                        className="h-8 text-xs w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={(getVal(s, "companion_of") as string) || ""}
                        onChange={(e) => setVal(s.id, "companion_of", e.target.value || null)}
                        className="h-8 text-xs w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {edits[s.id] && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSave(s)}>
                            <Save className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteMutation.mutate(s.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {/* New row */}
                {newRow && (
                  <TableRow>
                    <TableCell>
                      <Input value={newRow.name} onChange={(e) => setNewRow({ ...newRow, name: e.target.value })} className="h-8 text-xs w-28" placeholder="Name" />
                    </TableCell>
                    <TableCell><Input type="number" value={newRow.width_cm} onChange={(e) => setNewRow({ ...newRow, width_cm: +e.target.value })} className="h-8 text-xs w-16" /></TableCell>
                    <TableCell><Input type="number" value={newRow.depth_cm} onChange={(e) => setNewRow({ ...newRow, depth_cm: +e.target.value })} className="h-8 text-xs w-16" /></TableCell>
                    <TableCell><Input type="number" value={newRow.min_clearance_cm} onChange={(e) => setNewRow({ ...newRow, min_clearance_cm: +e.target.value })} className="h-8 text-xs w-16" /></TableCell>
                    <TableCell><Switch checked={newRow.must_against_wall} onCheckedChange={(v) => setNewRow({ ...newRow, must_against_wall: v })} /></TableCell>
                    <TableCell><Input value={newRow.default_orientation} onChange={(e) => setNewRow({ ...newRow, default_orientation: e.target.value })} className="h-8 text-xs w-28" /></TableCell>
                    <TableCell><Input value={newRow.grouping_key || ""} onChange={(e) => setNewRow({ ...newRow, grouping_key: e.target.value || null })} className="h-8 text-xs w-24" /></TableCell>
                    <TableCell><Input value={newRow.companion_of || ""} onChange={(e) => setNewRow({ ...newRow, companion_of: e.target.value || null })} className="h-8 text-xs w-24" /></TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => insertMutation.mutate(newRow)} disabled={!newRow.name}>
                        <Save className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setNewRow({ ...EMPTY })}>
          <Plus className="w-4 h-4 mr-1" /> Add Furniture
        </Button>
      </CardContent>
    </Card>
  );
}
