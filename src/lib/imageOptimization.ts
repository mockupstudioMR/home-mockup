export interface ImageResizeOptions {
  maxDimension: number;
  quality?: number;
  mimeType?: "image/webp" | "image/jpeg";
}

const loadImage = (file: Blob): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });

export const optimizeImageFile = async (
  file: File,
  { maxDimension, quality = 0.82, mimeType = "image/webp" }: ImageResizeOptions,
): Promise<File> => {
  const image = await loadImage(file);
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported");

  ctx.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (nextBlob) => (nextBlob ? resolve(nextBlob) : reject(new Error("Image optimization failed"))),
      mimeType,
      quality,
    );
  });

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  const ext = mimeType === "image/webp" ? "webp" : "jpg";
  return new File([blob], `${baseName}.${ext}`, { type: mimeType, lastModified: Date.now() });
};

export const getStorageImageUrl = (
  imageUrl: string,
  options: { width?: number; height?: number; quality?: number } = {},
): string => {
  if (!imageUrl || imageUrl.startsWith("data:")) return imageUrl;

  try {
    const url = new URL(imageUrl);
    if (url.pathname.includes("/storage/v1/object/public/")) {
      url.pathname = url.pathname.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    }
    if (!url.pathname.includes("/storage/v1/render/image/public/")) return imageUrl;
    if (options.width) url.searchParams.set("width", String(options.width));
    if (options.height) url.searchParams.set("height", String(options.height));
    if (options.quality) url.searchParams.set("quality", String(options.quality));
    return url.toString();
  } catch {
    return imageUrl;
  }
};

export const getAiOptimizedImageUrl = (imageUrl: string) =>
  getStorageImageUrl(imageUrl, { width: 1024, quality: 75 });

export const getThumbnailImageUrl = (imageUrl: string) =>
  getStorageImageUrl(imageUrl, { width: 640, quality: 72 });
