import { afterEach, describe, expect, it, vi } from "vitest";
import JSZip from "jszip";
import { downloadWallLayers } from "@/journey/wallScenes/downloadLayers";
import type { WallScene } from "@/journey/wallScenes/runner";

const base = "https://x.supabase.co/storage/v1/object/public/design-images/u/scenes/k-a/";
const manifest = {
  mode: "pro", background: base + "room.jpg", photo: base + "background.jpg", imageSize: { width: 1920, height: 1080 },
  layers: {
    sofa: { title: "Sofa", order: 10, blend: "pro", variations: [base + "sofa-1.webp", base + "sofa-2.webp"], shadows: [base + "sofa-1-shadow.webp", base + "sofa-2-shadow.webp"], shadow: base + "sofa-1-shadow.webp", thumbnails: [base + "sofa-1-thumb.jpg", base + "sofa-2-thumb.jpg"], variationNames: ["Velvet sofa", "Linen sofa"] },
    walls: { title: "Wall colour", order: 1, variations: [base + "none.webp", base + "walls-2.webp"], variationNames: ["As it is", "Sage"] },
  },
};

describe("download all layers (debug)", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("puts every layer of each made wall in the ZIP, in drawing order, each option with its own shadow", async () => {
    let saved: Blob | null = null;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.endsWith("manifest.json")) return new Response(JSON.stringify(manifest));
      if (url.endsWith("sofa-2-thumb.jpg")) return new Response("", { status: 404 });
      return new Response(new Uint8Array([1, 2, 3]));
    }));
    URL.createObjectURL = vi.fn((b: Blob) => { saved = b; return "blob:zip"; }) as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const scene = (key: string): WallScene => ({ status: "ready", key, manifestUrl: base + "manifest.json", at: "2026-11-28" });
    const failed: WallScene = { status: "failed", key: "b", at: "2026-11-28", error: "Your wall's drawing could not be saved: Payload too large." };
    const stored = vi.fn(async () => [{ path: "b-b-mz1/guide.jpg", url: base + "guide.jpg" }]);
    const r = await downloadWallLayers({ A: scene("a"), room: scene("r"), B: failed }, undefined, stored);

    expect(click).toHaveBeenCalledOnce();
    const bytes = await new Promise<ArrayBuffer>((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result as ArrayBuffer); fr.readAsArrayBuffer(saved!); });
    const zip = await JSZip.loadAsync(bytes);
    const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir).sort();
    expect(names).toContain("wall-A/manifest.json");
    expect(names).toContain("wall-A/00-empty-room.jpg");
    expect(names).toContain("wall-A/00-photo.jpg");
    // the wall colour (order 1) is drawn before the sofa (order 10)
    expect(names).toContain("wall-A/01-walls/1-as-it-is.webp");
    expect(names).toContain("wall-A/02-sofa/1-velvet-sofa.webp");
    expect(names).toContain("wall-A/02-sofa/2-linen-sofa-shadow.webp");
    expect(names).toContain("whole-room/02-sofa/1-velvet-sofa-thumb.jpg");
    // a failed wall: its status and error, and what its run had saved
    expect(await zip.file("wall-B/status.txt")!.async("string")).toMatch(/failed\nerror: .*Payload too large/);
    expect(names).toContain("wall-B/stored-files/b-b-mz1/guide.jpg");
    expect(stored).toHaveBeenCalledOnce(); // only for the picture without a manifest
    expect(names.some((n) => n.startsWith("wall-C/"))).toBe(false); // never made
    const list = await zip.file("wall-A/layers.txt")!.async("string");
    expect(list).toMatch(/2-linen-sofa: own shadow/);
    expect(list).toMatch(/1-as-it-is: no shadow \(see-through\) {2}· {2}empty/);
    expect(await zip.file("wall-A/MISSING.txt")!.async("string")).toMatch(/2-linen-sofa-thumb\.jpg/);
    expect(r.missing).toHaveLength(2); // the missing thumbnail, once per picture
  });
});

describe("download all layers (debug), nothing finished", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("still downloads when every wall failed, with each wall's error", async () => {
    let saved: Blob | null = null;
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([1]))));
    URL.createObjectURL = vi.fn((b: Blob) => { saved = b; return "blob:zip"; }) as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const failed = (key: string): WallScene => ({ status: "failed", key, at: "", error: "Sign in to make your room's pictures." });
    await downloadWallLayers({ A: failed("a"), B: failed("b"), room: failed("r") }, undefined, async () => []);
    const bytes = await new Promise<ArrayBuffer>((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result as ArrayBuffer); fr.readAsArrayBuffer(saved!); });
    const zip = await JSZip.loadAsync(bytes);
    expect(await zip.file("whole-room/status.txt")!.async("string")).toMatch(/Sign in/);
  });
  it("says so when no picture was ever started", async () => {
    await expect(downloadWallLayers({}, undefined, async () => [])).rejects.toThrow(/No wall pictures/);
  });
});
