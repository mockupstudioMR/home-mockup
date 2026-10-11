/** Data helpers shared by the admin screens: the vocabulary, scan images, slugs. */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Term = Tables<"taxonomy_terms">;
export type Facet = Term["facet"];

/** Every vocabulary term (admins also see proposed and retired ones), keyed by id. */
export function useTerms() {
  return useQuery({
    queryKey: ["admin-terms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("taxonomy_terms")
        .select("*")
        .order("facet")
        .order("label")
        .limit(5000);
      if (error) throw error;
      const byId = new Map<string, Term>();
      for (const t of data) byId.set(t.id, t);
      return { list: data, byId };
    },
    staleTime: 60_000,
  });
}

export const facetLabel: Record<string, string> = {
  category: "Category",
  color: "Colour",
  style: "Style",
  material: "Material",
  finish: "Finish",
  shape: "Shape",
  pattern: "Pattern",
  mood: "Mood",
  room_type: "Room type",
};


export function useScanImage(path: string | null | undefined, fallbackUrl?: string | null) {
  return useQuery({
    queryKey: ["scan-image", path],
    enabled: !!path,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("admin-scans").createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
    staleTime: 30 * 60_000,
    initialData: path ? undefined : fallbackUrl ?? undefined,
  });
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
