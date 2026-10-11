import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { TermChip, useTerms } from "./shared";

type ScopeRow = Tables<"scope_defaults">;
const STATES: { id: ScopeRow["starting_state"]; label: string }[] = [
  { id: "core_shell", label: "Core & shell" },
  { id: "empty", label: "Empty" },
  { id: "partially_furnished", label: "Partly furnished" },
  { id: "redo_all", label: "Redo it all" },
];
const MODES: { id: ScopeRow["mode"]; label: string }[] = [
  { id: "in_scope", label: "In scope" },
  { id: "on_request", label: "On request" },
  { id: "kept_as_is", label: "Kept as is" },
];
const NONE = "__none";

export default function ScopeDefaultsManager() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: terms } = useTerms();
  const categories = terms?.list.filter((t) => t.facet === "category" && t.status === "active") ?? [];

  const { data: scope } = useQuery({
    queryKey: ["scope-defaults"],
    queryFn: async () => (await supabase.from("scope_defaults").select("*")).data ?? [],
  });
  const { data: specs } = useQuery({
    queryKey: ["specs-category-links"],
    queryFn: async () => (await supabase.from("furniture_specs").select("id, name, variant, category_term_id, width_cm, depth_cm").order("name")).data ?? [],
  });
  const { data: usedCategories } = useQuery({
    queryKey: ["scheme-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("furniture_schemes").select("category_id").eq("status", "active").limit(5000);
      return [...new Set((data ?? []).map((d) => d.category_id))];
    },
  });

  const missing = useMemo(() => {
    const sized = new Set((specs ?? []).map((s) => s.category_term_id).filter(Boolean));
    return (usedCategories ?? []).filter((c) => !sized.has(c));
  }, [specs, usedCategories]);

  const areas = useMemo(() => [...new Set((scope ?? []).map((s) => s.area))].sort(), [scope]);

  const setMode = useMutation({
    mutationFn: async (row: { starting_state: ScopeRow["starting_state"]; area: string; mode: ScopeRow["mode"] }) => {
      const { error } = await supabase.from("scope_defaults").upsert(row);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scope-defaults"] }),
    onError: (e: Error) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });

  const link = useMutation({
    mutationFn: async ({ id, category }: { id: string; category: string | null }) => {
      const { error } = await supabase.from("furniture_specs").update({ category_term_id: category }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["specs-category-links"] });
      qc.invalidateQueries({ queryKey: ["admin-counts"] });
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Sizes ↔ categories</CardTitle>
          <CardDescription>
            Link each standard size to a category so schemes and the user&apos;s size step can find it.
            {missing.length > 0 && " Categories used by schemes but without a size are listed first."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {missing.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-amber-50 p-4">
              <span className="font-semibold text-amber-900">{missing.length} categories have schemes but no standard size:</span>
              {missing.map((id) => <TermChip key={id} term={terms?.byId.get(id)} />)}
              <span className="text-sm text-amber-900">Add the size in the size database below, then link it here.</span>
            </div>
          )}
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Size</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>W × D</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(specs ?? []).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-semibold capitalize">{s.name}</TableCell>
                    <TableCell>{s.variant}</TableCell>
                    <TableCell>{s.width_cm} × {s.depth_cm} cm</TableCell>
                    <TableCell>
                      <Select value={s.category_term_id ?? NONE} onValueChange={(v) => link.mutate({ id: s.id, category: v === NONE ? null : v })}>
                        <SelectTrigger className="h-9 w-48" aria-label={`Category for ${s.name}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>Not linked</SelectItem>
                          {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scope defaults</CardTitle>
          <CardDescription>What is pre-selected in step 1 for each starting point. Users can still change it per room.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Area</TableHead>
                {STATES.map((s) => <TableHead key={s.id}>{s.label}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.map((area) => (
                <TableRow key={area}>
                  <TableCell className="font-semibold capitalize">{area.replace(/_/g, " ")}</TableCell>
                  {STATES.map((st) => {
                    const row = scope?.find((r) => r.area === area && r.starting_state === st.id);
                    return (
                      <TableCell key={st.id}>
                        <Select value={row?.mode ?? "in_scope"} onValueChange={(v) => setMode.mutate({ starting_state: st.id, area, mode: v as ScopeRow["mode"] })}>
                          <SelectTrigger className="h-9 w-36" aria-label={`${area} for ${st.label}`}><SelectValue /></SelectTrigger>
                          <SelectContent>{MODES.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
