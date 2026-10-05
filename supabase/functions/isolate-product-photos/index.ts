import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { forbidUnlessDesignOwner, requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface IsolateRequest {
  designId: string;
  designImageUrl: string;
  items: Array<{
    id: string;
    item_name: string;
    item_description: string;
    item_type: string;
    color?: string;
    material?: string;
    bounding_box?: { x: number; y: number; width: number; height: number };
  }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const caller = await requireUser(req, corsHeaders);
  if (caller instanceof Response) return caller;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const { designId, designImageUrl, items }: IsolateRequest = await req.json();

    if (!designId || !designImageUrl || !items?.length) {
      throw new Error("designId, designImageUrl and items are required");
    }

    const denied = await forbidUnlessDesignOwner(caller, designId, corsHeaders);
    if (denied) return denied;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Filter to only non-wall items (furniture, lighting, textile, decor)
    const productItems = items.filter(
      (item) => !item.item_type.includes("wall") && item.item_type !== "floor_material" && item.item_type !== "architectural"
    );

    console.log(`Isolating ${productItems.length} product photos from design ${designId}`);

    // Process items in parallel batches of 3 to avoid rate limits
    const batchSize = 3;
    const results: Array<{ itemId: string; photoUrl: string | null }> = [];

    for (let i = 0; i < productItems.length; i += batchSize) {
      const batch = productItems.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(async (item) => {
          try {
            const locationHint = item.bounding_box
              ? ` It is located at approximately ${item.bounding_box.x}% from left, ${item.bounding_box.y}% from top of the image.`
              : "";

            const traits = [item.color, item.material].filter(Boolean).join(", ");
            const prompt = `Look at this interior design photo. Find the "${item.item_name}" (${item.item_description}).${locationHint}${traits ? ` Its colour/material: ${traits}.` : ""}

Produce a clean e-commerce product photo of that ONE object only, cut out of the room:
- Pure white background (#FFFFFF), edge to edge, completely empty.
- EXACTLY ONE object in the frame. No second item, no partial objects, no walls, floor, ceiling, windows, rugs, plants, cushions or decor unless the item itself IS that thing.
- If the object is partially hidden in the photo, complete it plausibly so the whole item is visible.
- Keep the object's exact shape, colour, material and finish from the photo; same viewing angle.
- Centre it, filling roughly 80% of a square frame, fully inside the frame.
- No text, watermarks, labels, props, people, reflections or drop shadows.`;

            const response = await fetch(
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
                        { type: "image_url", image_url: { url: designImageUrl } },
                      ],
                    },
                  ],
                  modalities: ["image", "text"],
                }),
              }
            );

            if (!response.ok) {
              console.error(`AI error for ${item.item_name}: ${response.status}`);
              return { itemId: item.id, photoUrl: null };
            }

            const data = await response.json();
            const imageData =
              data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

            if (!imageData) {
              console.log(`No image generated for ${item.item_name}`);
              return { itemId: item.id, photoUrl: null };
            }

            // Upload to storage
            const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
            const byteString = atob(base64);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let j = 0; j < byteString.length; j++) {
              ia[j] = byteString.charCodeAt(j);
            }
            const blob = new Blob([ab], { type: "image/png" });

            const fileName = `${designId}/product-${item.id}.png`;
            const { error: uploadError } = await supabase.storage
              .from("design-images")
              .upload(fileName, blob, {
                contentType: "image/png",
                upsert: true,
              });

            if (uploadError) {
              console.error(`Upload error for ${item.item_name}:`, uploadError);
              return { itemId: item.id, photoUrl: null };
            }

            const { data: urlData } = supabase.storage
              .from("design-images")
              .getPublicUrl(fileName);

            return { itemId: item.id, photoUrl: urlData.publicUrl };
          } catch (err) {
            console.error(`Error isolating ${item.item_name}:`, err);
            return { itemId: item.id, photoUrl: null };
          }
        })
      );

      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          results.push(result.value);
        }
      }
    }

    // Update design_items with product photo URLs
    const updates = results.filter((r) => r.photoUrl);
    for (const update of updates) {
      await supabase
        .from("design_items")
        .update({ product_photo_url: update.photoUrl })
        .eq("id", update.itemId);
    }

    // Register every isolated item in the shared products catalog. Items we
    // create ourselves belong to the "MockUp Studio" shop; real shops added
    // later land in the same table under their own shop name.
    if (updates.length) {
      const { data: designRow } = await supabase
        .from("generated_designs")
        .select("user_id")
        .eq("id", designId)
        .maybeSingle();

      const byId = new Map(productItems.map((i) => [i.id, i]));
      const rows = updates.map((u) => {
        const item = byId.get(u.itemId);
        return {
          shop_name: "MockUp Studio",
          name: item?.item_name || "Product",
          description: item?.item_description || null,
          type: item?.item_type || null,
          color: item?.color || null,
          material: item?.material || null,
          image_url: u.photoUrl,
          design_id: designId,
          design_item_id: u.itemId,
          created_by: (designRow as { user_id?: string } | null)?.user_id ?? null,
        };
      });

      const { error: productsError } = await supabase
        .from("products")
        .upsert(rows, { onConflict: "design_item_id" });
      if (productsError) console.error("Products upsert error:", productsError);
      else console.log(`Catalogued ${rows.length} products`);
    }


    console.log(
      `Completed: ${updates.length}/${productItems.length} product photos generated`
    );

    return new Response(
      JSON.stringify({
        success: true,
        generated: updates.length,
        total: productItems.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Isolate product photos error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to isolate products",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
