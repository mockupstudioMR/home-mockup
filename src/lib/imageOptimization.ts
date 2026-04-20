export interface ImageResizeOptions {
  maxDimension: number;
  quality?: number;
  mimeType?: "image/webp" | "image/jpeg";
}

const loadImage = (source: Blob | string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = typeof source === "string" ? source : URL.createObjectURL(source);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (typeof source !== "string") URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      if (typeof source !== "string") URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, mimeType: string, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (nextBlob) => (nextBlob ? resolve(nextBlob) : reject(new Error("Image optimization failed"))),
      mimeType,
      quality,
    );
  });

const resizeToCanvas = async (source: Blob | string, maxDimension: number) => {
  const image = await loadImage(source);
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported");

  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
};

export const optimizeImageFile = async (
  file: File,
  { maxDimension, quality = 0.82, mimeType = "image/webp" }: ImageResizeOptions,
): Promise<File> => {
  const canvas = await resizeToCanvas(file, maxDimension);
  const blob = await canvasToBlob(canvas, mimeType, quality);
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  const ext = mimeType === "image/webp" ? "webp" : "jpg";
  return new File([blob], `${baseName}.${ext}`, { type: mimeType, lastModified: Date.now() });
};

export const optimizeImageSourceToDataUrl = async (
  source: Blob | string,
  { maxDimension, quality = 0.78, mimeType = "image/webp" }: ImageResizeOptions,
): Promise<string> => {
  const canvas = await resizeToCanvas(source, maxDimension);
  return canvas.toDataURL(mimeType, quality);
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
