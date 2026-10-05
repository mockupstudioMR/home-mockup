import { createClient } from "npm:@supabase/supabase-js@2";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ImageRequest {
  channel?: "instagram" | "linkedin" | "email";
  caption: string;
  customPrompt?: string;
  imagePrompt?: string;
  sourceImageUrl?: string;
  referenceImageUrls?: string[];
  brand?: {
    brandName?: string;
    styleName?: string;
    description?: string;
    keywords?: string[];
    palette?: string[];
    materials?: string[];
    url?: string;
  } | null;
  overallStyle?: string;
  palette?: string[];
}

async function toDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    const type = res.headers.get("content-type") || "image/jpeg";
    return `data:${type};base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const caller = await requireUser(req, corsHeaders);
  if (caller instanceof Response) return caller;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body: ImageRequest = await req.json();
    const caption = (body.caption || "").slice(0, 800);
    const channel = body.channel || "instagram";
    const isLandscape = channel === "linkedin" || channel === "email";
    const dims = isLandscape
      ? "landscape 1.91:1 composition, designed for a LinkedIn or email hero"
      : "square 1:1 composition, designed for the Instagram feed";

    const brand = body.brand || null;
    const palette = ((brand?.palette || []).length ? brand?.palette : body.palette) || [];

    const refs: string[] = [];
    if (body.sourceImageUrl) {
      const inlined = await toDataUrl(body.sourceImageUrl);
      if (inlined) refs.push(inlined);
    }
    for (const url of (body.referenceImageUrls || []).slice(0, 4)) {
      const inlined = await toDataUrl(url);
      if (inlined) refs.push(inlined);
    }

    const isEditing = Boolean(body.sourceImageUrl && (body.customPrompt || "").trim());

    const userDirective = (body.customPrompt || "").trim()
      ? `=== PRIMARY USER INSTRUCTION (HIGHEST PRIORITY) ===
Follow this direction literally and completely. It overrides every other styling suggestion below.
"""
${body.customPrompt!.trim()}
"""
=== END PRIMARY USER INSTRUCTION ===

`
      : "";

    const editBlock = isEditing
      ? `You are editing the attached source image. Preserve the same products, their exact shape, colour, material and detailing, and the overall scene structure, applying only the requested change.

`
      : `CRITICAL: the attached reference images show the retailer's real products and styled rooms. Any product that appears must be a pixel-faithful copy — identical shape, proportions, colour, material and detailing. Never substitute look-alike furniture.

`;

    const prompt = `${userDirective}${editBlock}Create a scroll-stopping ${channel} post image (${dims}) for ${brand?.brandName || "this furniture retailer"}${brand?.url ? ` (${brand.url})` : ""}.

${brand ? `Brand look: ${brand.styleName || ""}. ${brand.description || ""} Keywords: ${(brand.keywords || []).join(", ")}. Materials: ${(brand.materials || []).join(", ")}.` : ""}
${body.overallStyle ? `Assortment style: ${body.overallStyle}.` : ""}
${palette.length ? `Use a palette close to: ${palette.slice(0, 6).join(", ")}.` : ""}

${body.imagePrompt ? `Visual brief: ${body.imagePrompt}` : ""}

The post copy this image accompanies:
"${caption}"

Requirements:
- Photorealistic interior photography, editorial magazine quality, natural daylight, intentional composition
- ${isLandscape ? "Landscape 1.91:1" : "Square 1:1"} framing
- ABSOLUTELY NO TEXT of any kind: no words, letters, numbers, captions, typography, logos or watermarks
- If a sign, book or screen would naturally carry text, render it blank or abstract`;

    const content: any[] = [{ type: "text", text: prompt }];
    for (const url of refs) content.push({ type: "image_url", image_url: { url } });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: refs.length ? "google/gemini-3-pro-image" : "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content }],
        modalities: ["image", "text"],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return new Response(JSON.stringify({ error: `Image generation failed (${res.status}): ${text.slice(0, 200)}` }), {
        status: res.status === 402 || res.status === 403 ? res.status : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      return new Response(JSON.stringify({ error: "No image returned" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let imageUrl = `data:image/png;base64,${b64}`;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (SUPABASE_URL && SERVICE_KEY) {
      try {
        const storage = createClient(SUPABASE_URL, SERVICE_KEY);
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const fileName = `retailer-posts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
        const { error: upErr } = await storage.storage
          .from("design-images")
          .upload(fileName, new Blob([bytes], { type: "image/png" }), { contentType: "image/png" });
        if (!upErr) {
          const { data: urlData } = storage.storage.from("design-images").getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }
      } catch (e) {
        console.error("post image upload failed", e);
      }
    }

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-retailer-post-image error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
