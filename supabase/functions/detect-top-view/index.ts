// Generate a realistic TOP-DOWN photographic view of the room based on the
// rendered design image. Returns { imageUrl } as a data URI (PNG/JPEG).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Providers cannot always crawl remote URLs (robots.txt / throttling), which
 * surfaces as a 400 "Cannot fetch content from the provided URL". Download the
 * image here and inline it as a base64 data URL instead.
 */
async function toDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Image fetch failed", res.status, url.slice(0, 120));
      return null;
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    if (!buf.length) return null;
    const mime = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    let bin = "";
    for (let i = 0; i < buf.length; i += 8192) {
      bin += String.fromCharCode(...buf.subarray(i, i + 8192));
    }
    return `data:${mime};base64,${btoa(bin)}`;
  } catch (e) {
    console.error("Image inline error", e);
    return null;
  }
}



Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, roomShape, dimensions, expectedFurniture } =
      await req.json();

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "imageUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const dimsLabel = dimensions
      ? Object.entries(dimensions)
          .map(([k, v]) => `${k}=${v}m`)
          .join(", ")
      : "unknown";

    const expected = Array.isArray(expectedFurniture) && expectedFurniture.length
      ? `Expected furniture from the user's plan: ${expectedFurniture.join(", ")}.`
      : "";

    const prompt = `Generate a PHOTOREALISTIC TOP-DOWN (bird's-eye, orthographic) view of the EXACT same room shown in the reference image. 

ROOM GEOMETRY:
- Shape: ${roomShape || "rectangle"}
- Dimensions: ${dimsLabel}
- The room outline must fill the frame and match this exact shape.

CONTENT RULES:
- Same furniture, same colors, same materials, same textures as the reference image, just viewed from directly above.
- ${expected}
- Show the floor (rugs, wood/tile pattern), and the TOPS of all furniture (bed covers, table tops, sofa cushions, etc.).
- No walls visible from the side — only seen as edges around the room.
- No people, no perspective distortion, no tilt. Pure 90° top-down camera.

STYLE:
- Photorealistic interior photography, soft natural daylight, magazine quality.
- 1:1 or 4:3 aspect ratio framed tightly to the room.`;

    const resp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      if (resp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (resp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway ${resp.status}`);
    }

    const data = await resp.json();
    const message = data.choices?.[0]?.message;
    // Gemini image responses include images in message.images[].image_url.url
    const imgUrl: string | undefined =
      message?.images?.[0]?.image_url?.url ||
      message?.images?.[0]?.url ||
      undefined;

    if (!imgUrl) {
      console.error("No image returned:", JSON.stringify(message)?.slice(0, 500));
      return new Response(
        JSON.stringify({ error: "No top-view image returned by AI." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ imageUrl: imgUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("detect-top-view error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
