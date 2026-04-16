import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, DoorOpen } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OpeningRule {
  id: string;
  opening_type: string;
  clearance_cm: number;
  requires_path_to: string[];
  attracts_furniture: string[];
  repels_furniture: string[];
}

export default function OpeningRulesManager() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [edits, setEdits] = useState<Record<string, Partial<OpeningRule>>>({});
  const [newRow, setNewRow] = useState<Omit<OpeningRule, "id"> | null>(null);

  const { data: rules, isLoading } = useQuery({
    queryKey: ["opening-rules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("opening_rules").select("*").order("opening_type");
      if (error) throw error;
      return data as OpeningRule[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, ...values }: OpeningRule) => {
      const { error } = await supabase.from("opening_rules").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["opening-rules"] }); toast({ title: "Saved" }); },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  const insertMutation = useMutation({
    mutationFn: async (values: Omit<OpeningRule, "id">) => {
      const { error } = await supabase.from("opening_rules").insert(values);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["opening-rules"] }); setNewRow(null); toast({ title: "Added" }); },
    onError: (e: any) => toast({ title: e.message || "Insert failed", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("opening_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["opening-rules"] }); toast({ title: "Deleted" }); },
  });

  const getVal = (rule: OpeningRule, field: keyof OpeningRule) => edits[rule.id]?.[field] ?? rule[field];
  const setVal = (id: string, field: keyof OpeningRule, value: any) => setEdits((p) => ({ ...p, [id]: { ...p[id], [field]: value } }));

  const arrToStr = (arr: string[]) => arr.join(", ");
  const strToArr = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  const handleSave = (rule: OpeningRule) => {
    saveMutation.mutate({ ...rule, ...edits[rule.id] } as OpeningRule);
    setEdits((p) => { const n = { ...p }; delete n[rule.id]; return n; });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DoorOpen className="w-5 h-5" />
          Opening Rules
        </CardTitle>
        <CardDescription>
          Define clearance zones, traffic paths, and furniture affinities per opening type
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
                  <TableHead>Type</TableHead>
                  <TableHead className="w-24">Clearance (cm)</TableHead>
                  <TableHead>Requires Path To</TableHead>
                  <TableHead>Attracts Furniture</TableHead>
                  <TableHead>Repels Furniture</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules?.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Input value={getVal(r, "opening_type") as string} onChange={(e) => setVal(r.id, "opening_type", e.target.value)} className="h-8 text-xs w-28" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={getVal(r, "clearance_cm") as number} onChange={(e) => setVal(r.id, "clearance_cm", +e.target.value)} className="h-8 text-xs w-20" />
                    </TableCell>
                    <TableCell>
                      <Input value={arrToStr(getVal(r, "requires_path_to") as string[])} onChange={(e) => setVal(r.id, "requires_path_to", strToArr(e.target.value))} className="h-8 text-xs" placeholder="comma-separated" />
                    </TableCell>
                    <TableCell>
                      <Input value={arrToStr(getVal(r, "attracts_furniture") as string[])} onChange={(e) => setVal(r.id, "attracts_furniture", strToArr(e.target.value))} className="h-8 text-xs" placeholder="comma-separated" />
                    </TableCell>
                    <TableCell>
                      <Input value={arrToStr(getVal(r, "repels_furniture") as string[])} onChange={(e) => setVal(r.id, "repels_furniture", strToArr(e.target.value))} className="h-8 text-xs" placeholder="comma-separated" />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {edits[r.id] && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSave(r)}>
                            <Save className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(r.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {newRow && (
                  <TableRow>
                    <TableCell><Input value={newRow.opening_type} onChange={(e) => setNewRow({ ...newRow, opening_type: e.target.value })} className="h-8 text-xs w-28" placeholder="e.g. door" /></TableCell>
                    <TableCell><Input type="number" value={newRow.clearance_cm} onChange={(e) => setNewRow({ ...newRow, clearance_cm: +e.target.value })} className="h-8 text-xs w-20" /></TableCell>
                    <TableCell><Input value={arrToStr(newRow.requires_path_to)} onChange={(e) => setNewRow({ ...newRow, requires_path_to: strToArr(e.target.value) })} className="h-8 text-xs" /></TableCell>
                    <TableCell><Input value={arrToStr(newRow.attracts_furniture)} onChange={(e) => setNewRow({ ...newRow, attracts_furniture: strToArr(e.target.value) })} className="h-8 text-xs" /></TableCell>
                    <TableCell><Input value={arrToStr(newRow.repels_furniture)} onChange={(e) => setNewRow({ ...newRow, repels_furniture: strToArr(e.target.value) })} className="h-8 text-xs" /></TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => insertMutation.mutate(newRow)} disabled={!newRow.opening_type}>
                        <Save className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setNewRow({ opening_type: "", clearance_cm: 80, requires_path_to: [], attracts_furniture: [], repels_furniture: [] })}>
          <Plus className="w-4 h-4 mr-1" /> Add Opening Rule
        </Button>
      </CardContent>
    </Card>
  );
}
