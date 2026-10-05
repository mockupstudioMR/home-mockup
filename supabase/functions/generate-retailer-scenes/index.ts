import { createClient } from "npm:@supabase/supabase-js@2";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProductIn {
  imageIndex: number;
  name: string;
  category?: string;
  styleTags?: string[];
  colors?: string[];
  materials?: string[];
}

interface SceneRequest {
  images: string[];
  products: ProductIn[];
  overallStyle?: string;
  palette?: string[];
  brand?: {
    brandName?: string;
    styleName?: string;
    description?: string;
    keywords?: string[];
    palette?: string[];
    materials?: string[];
    url?: string;
  } | null;
}

const ROOM_BY_CATEGORY: Record<string, string> = {
  sofa: "living room",
  armchair: "living room",
  chair: "dining area",
  table: "dining area",
  "coffee-table": "living room",
  desk: "home office",
  bed: "bedroom",
  storage: "living room",
  shelving: "living room",
  lighting: "living room",
  rug: "living room",
  textile: "bedroom",
  mirror: "entryway",
  decor: "living room",
  outdoor: "terrace",
};

const STYLE_VARIANTS = [
  "modern minimal with clean lines, soft neutral tones and Scandinavian calm",
  "warm Japandi with natural oak, linen textures and quiet contrast",
  "contemporary elegance with deep tones, layered textiles and sculptural lighting",
  "bright Mediterranean with lime-washed walls, terracotta accents and abundant daylight",
  "refined mid-century with walnut wood, muted colour blocking and graphic shapes",
];

async function toDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (!buf.length) return null;
    const mime = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    let bin = "";
    for (let i = 0; i < buf.length; i += 8192) bin += String.fromCharCode(...buf.subarray(i, i + 8192));
    return `data:${mime};base64,${btoa(bin)}`;
  } catch {
    return null;
  }
}

function planScenes(products: ProductIn[]) {
  const byRoom = new Map<string, ProductIn[]>();
  products.forEach((p, i) => {
    const cat = (p.category || "decor").toLowerCase();
    const room = ROOM_BY_CATEGORY[cat] || "living room";
    byRoom.set(room, [...(byRoom.get(room) || []), { ...p, imageIndex: p.imageIndex ?? i }]);
  });

  const combined: { room: string; items: ProductIn[] }[] = [];
  const solo: { room: string; items: ProductIn[] }[] = [];
  for (const [room, items] of byRoom.entries()) {
    if (items.length > 1) combined.push({ room, items: items.slice(0, 4) });
    else solo.push({ room, items });
  }

  const plans = [...combined, ...solo].slice(0, 5);
  return plans.map((plan, idx) => ({
    room: plan.room,
    items: plan.items,
    isCombination: plan.items.length > 1,
    style: STYLE_VARIANTS[idx % STYLE_VARIANTS.length],
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const caller = await requireUser(req, corsHeaders);
  if (caller instanceof Response) return caller;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body: SceneRequest = await req.json();
    const images = Array.isArray(body.images) ? body.images.slice(0, 5) : [];
    const products = Array.isArray(body.products) ? body.products : [];
    if (!images.length || !products.length) {
      return new Response(JSON.stringify({ error: "No products to place in a scene" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inlined = await Promise.all(images.map((u) => toDataUrl(u)));
    const plans = planScenes(products);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const storage = SUPABASE_URL && SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY) : null;

    const results = await Promise.all(
      plans.map(async (plan, planIndex) => {
        const names = plan.items.map((p) => p.name).filter(Boolean);
        const refs = plan.items
          .map((p) => inlined[p.imageIndex])
          .filter((u): u is string => Boolean(u))
          .slice(0, 4);

        const brand = body.brand || null;
        const brandPalette = (brand?.palette || []).filter(Boolean).slice(0, 5);
        const paletteHint = (brandPalette.length ? brandPalette : (body.palette || []).slice(0, 5)).join(", ");
        const brandLine = brand
          ? `BRAND DIRECTION: this room must look like it belongs to ${brand.brandName || "this brand"}${brand.url ? ` (${brand.url})` : ""} — a ${brand.styleName || "signature"} world. ${brand.description || ""} Style keywords: ${(brand.keywords || []).join(", ")}. Favour materials such as ${(brand.materials || []).join(", ") || "the brand's typical materials"}. Match the brand palette exactly where possible.\n`
          : "";
        const prompt = `Photorealistic interior photography of a ${plan.room} designed in a ${brand?.styleName ? `${brand.styleName} brand` : plan.style} style.
${brandLine}
CRITICAL: the reference images show real products that MUST appear in the scene as an exact pixel-faithful copy — identical shape, proportions, colour, material and detailing. Do not substitute look-alike furniture. Products to feature: ${names.join(", ")}.
${plan.isCombination ? "Compose these products together in one believable arrangement so they clearly work as a set." : "Make this product the hero of the room."}
Design the rest of the room around them${paletteHint ? ` using a palette close to ${paletteHint}` : ""}${body.overallStyle ? `, consistent with a ${body.overallStyle} feel` : ""}.
Magazine-quality lighting, natural daylight, ultra high resolution, 16:9 composition, no text or watermarks.`;

        const content: any[] = [{ type: "text", text: prompt }];
        for (const url of refs) content.push({ type: "image_url", image_url: { url } });

        try {
          const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3-pro-image",
              messages: [{ role: "user", content }],
              modalities: ["image", "text"],
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            console.error("scene gen failed", res.status, text.slice(0, 250));
            return { ...plan, imageUrl: null, error: `HTTP ${res.status}` };
          }

          const data = await res.json();
          const b64 = data?.data?.[0]?.b64_json;
          if (!b64) return { ...plan, imageUrl: null, error: "No image returned" };

          let imageUrl = `data:image/png;base64,${b64}`;
          if (storage) {
            try {
              const bin = atob(b64);
              const bytes = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
              const fileName = `retailer-scenes/${Date.now()}-${planIndex}.png`;
              const { error: upErr } = await storage.storage
                .from("design-images")
                .upload(fileName, new Blob([bytes], { type: "image/png" }), { contentType: "image/png" });
              if (!upErr) {
                const { data: urlData } = storage.storage.from("design-images").getPublicUrl(fileName);
                imageUrl = urlData.publicUrl;
              }
            } catch (e) {
              console.error("scene upload failed", e);
            }
          }

          return { ...plan, imageUrl };
        } catch (e) {
          console.error("scene error", e);
          return { ...plan, imageUrl: null, error: String(e) };
        }
      }),
    );

    const scenes = results.map((r) => ({
      room: r.room,
      style: r.style,
      isCombination: r.isCombination,
      productNames: r.items.map((p: ProductIn) => p.name),
      productIndices: r.items.map((p: ProductIn) => p.imageIndex),
      imageUrl: r.imageUrl,
      error: (r as any).error,
    }));

    return new Response(JSON.stringify({ scenes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-retailer-scenes error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Scene generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
