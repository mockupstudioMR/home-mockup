import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const caller = await requireAdmin(req, corsHeaders);
  if (caller instanceof Response) return caller;

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find designs with base64 image_url (they start with "data:")
    // Process in small batches to avoid timeouts
    const { data: designs, error } = await supabase
      .from("generated_designs")
      .select("id, user_id, image_url")
      .like("image_url", "data:%")
      .limit(5);

    if (error) throw error;
    if (!designs || designs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No base64 images to migrate", migrated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let migrated = 0;
    const errors: string[] = [];

    for (const design of designs) {
      try {
        const base64DataUri = design.image_url;
        const mimeMatch = base64DataUri.match(/^data:(image\/\w+);base64,/);
        const mimeType = mimeMatch?.[1] || "image/png";
        const ext = mimeType === "image/jpeg" ? "jpg" : "png";
        const base64 = base64DataUri.replace(/^data:image\/\w+;base64,/, "");
        
        // Decode base64
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const fileName = `${design.user_id}/design-migrated-${design.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("design-images")
          .upload(fileName, bytes, { contentType: mimeType, upsert: true });

        if (uploadError) {
          errors.push(`${design.id}: upload failed - ${uploadError.message}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("design-images")
          .getPublicUrl(fileName);

        // Update the record
        const { error: updateError } = await supabase
          .from("generated_designs")
          .update({ image_url: urlData.publicUrl })
          .eq("id", design.id);

        if (updateError) {
          errors.push(`${design.id}: update failed - ${updateError.message}`);
          continue;
        }

        migrated++;
        console.log(`Migrated design ${design.id}`);
      } catch (e) {
        errors.push(`${design.id}: ${e instanceof Error ? e.message : "unknown error"}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Migrated ${migrated}/${designs.length} designs`,
        migrated,
        remaining: designs.length - migrated,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Migration failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
