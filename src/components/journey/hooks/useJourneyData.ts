import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface JourneyData {
  loading: boolean;
  error?: string;
  design?: {
    id: string;
    imageUrl: string;
    sourceImageUrl?: string | null;
    title?: string | null;
    prompt?: string;
    extractedItems?: any;
  };
  history: Array<{ id: string; label: string; image: string; description?: string }>;
}

export const useJourneyData = (designId?: string): JourneyData => {
  const [state, setState] = useState<JourneyData>({ loading: true, history: [] });

  useEffect(() => {
    if (!designId) {
      setState({ loading: false, history: [], error: "No design id" });
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await (supabase as any)
        .from("generated_designs")
        .select("id, image_url, source_image_url, title, prompt, extracted_items, parent_design_id, created_at")
        .eq("id", designId)
        .maybeSingle();

      if (cancelled) return;
      if (error || !data) {
        setState({ loading: false, history: [], error: error?.message || "Not found" });
        return;
      }

      const history: JourneyData["history"] = [];
      if (data.source_image_url) {
        history.push({ id: "original", label: "Original", image: data.source_image_url });
      }
      let parentId = data.parent_design_id;
      const chain: any[] = [];
      while (parentId && chain.length < 6) {
        const { data: p } = await (supabase as any)
          .from("generated_designs")
          .select("id, image_url, title, parent_design_id, created_at")
          .eq("id", parentId)
          .maybeSingle();
        if (!p) break;
        chain.unshift(p);
        parentId = p.parent_design_id;
      }
      chain.forEach((c, i) => history.push({ id: c.id, label: c.title || `Concept ${i + 1}`, image: c.image_url }));
      history.push({ id: data.id, label: data.title || "Final Design", image: data.image_url });

      setState({
        loading: false,
        history,
        design: {
          id: data.id,
          imageUrl: data.image_url,
          sourceImageUrl: data.source_image_url,
          title: data.title,
          prompt: data.prompt,
          extractedItems: data.extracted_items,
        },
      });
    })();
    return () => { cancelled = true; };
  }, [designId]);

  return state;
};