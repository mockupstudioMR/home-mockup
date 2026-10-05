import { supabase } from "@/integrations/supabase/client";

// Upload a base64 data URI to storage and return the public URL.
// Never returns the data URI itself: a multi-megabyte base64 string written
// to generated_designs.image_url bloats the database, slows the gallery and
// overflows sessionStorage. Retries transient failures, then throws.
export async function uploadDesignImage(base64DataUri: string, userId: string): Promise<string> {
  if (!base64DataUri.startsWith('data:')) return base64DataUri;
  const mimeMatch = base64DataUri.match(/^data:(image\/\w+);base64,/);
  const mimeType = mimeMatch?.[1] || 'image/png';
  const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png';
  const base64 = base64DataUri.replace(/^data:image\/\w+;base64,/, '');
  const byteString = atob(base64);
  const ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ia], { type: mimeType });
  const fileName = `${userId}/design-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const maxAttempts = 3;
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { error: uploadError } = await supabase.storage
      .from('design-images')
      .upload(fileName, blob, { contentType: mimeType });
    // "already exists" means an earlier attempt did succeed (the response
    // was lost), so the file is there under this unique name.
    const alreadyThere = !!uploadError && /exists|duplicate/i.test(uploadError.message);
    if (!uploadError || alreadyThere) {
      return supabase.storage.from('design-images').getPublicUrl(fileName).data.publicUrl;
    }
    lastError = uploadError;
    console.error(`Design image upload failed (attempt ${attempt}/${maxAttempts}):`, uploadError);
    if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 800 * attempt));
  }
  throw new Error(
    `We couldn't save the design image. Please check your connection and try again.${
      lastError instanceof Error ? ` (${lastError.message})` : ''
    }`,
  );
}
