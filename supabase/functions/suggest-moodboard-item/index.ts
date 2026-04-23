import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Layer = "architecture" | "furniture" | "decor";

interface SuggestRequest {
  layer: Layer;
  existingLabels: string[];
  roomType?: string;
  style?: string;
  designDescription?: string;
}

const LAYER_GUIDE: Record<Layer, string> = {
  architecture:
    "an architectural finish (wall paint color, wall material/treatment, ceiling treatment, flooring, trim/molding, paneling, wallpaper or tile)",
  furniture:
    "a furniture piece appropriate for the room (sofa, chair, table, bed, storage, desk, etc.) — NOT decor/lighting",
  decor:
    "a decor item (lamp, rug, art, plant, mirror, pillow, curtain, sconce, accessory) — NOT large furniture",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: SuggestRequest = await req.json();
    const { layer, existingLabels = [], roomType, style, designDescription } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const guide = LAYER_GUIDE[layer] ?? LAYER_GUIDE.furniture;

    const userPrompt = `Suggest exactly ONE new ${guide} that would complement and enhance the current design.

Room type: ${roomType || "unspecified"}
Style: ${style || "unspecified"}
Current design: ${designDescription?.slice(0, 600) || "n/a"}

Already included (do NOT repeat any of these or close variants):
${existingLabels.length ? existingLabels.map((l) => `- ${l}`).join("\n") : "(none)"}

Reply with a SHORT, concrete label only (3-7 words), like "brushed brass arc floor lamp" or "warm white limewash walls" — no quotes, no explanation.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are an interior designer assistant. Reply with one short, concrete item label only — no extra words.",
          },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (resp.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (resp.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? "";
    const suggestion = raw
      .replace(/^["'\s\-•*]+|["'\s\-•*]+$/g, "")
      .split("\n")[0]
      .trim()
      .slice(0, 80);

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-moodboard-item error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});