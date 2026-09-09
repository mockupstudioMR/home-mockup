import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles, Loader2, Copy, Check, Pin, PinOff, X, Image as ImageIcon, Wand2, Instagram, Linkedin, Mail,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getAiErrorMessage } from "@/lib/aiErrorMessage";
import { trackEvent } from "@/lib/analytics";
import type { RetailerAnalysis, RetailerBrand, RetailerScene } from "./RetailerStyleFlow";

export type PostChannel = "instagram" | "linkedin" | "email";

export interface RetailerPost {
  id: string;
  rowId?: string;
  channel: PostChannel;
  caption?: string;
  body?: string;
  subject?: string;
  preview?: string;
  hashtags?: string;
  imageUrl?: string | null;
  imagePrompt?: string;
  productNames?: string[];
  isPinned: boolean;
}

const CHANNELS: { id: PostChannel; label: string; icon: typeof Instagram; hint: string }[] = [
  { id: "instagram", label: "Instagram", icon: Instagram, hint: "3 punchy captions with hashtags" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, hint: "3 professional posts" },
  { id: "email", label: "Email", icon: Mail, hint: "2 marketing emails" },
];

const LANGUAGES = ["English", "Deutsch", "Français", "Español", "Italiano", "Nederlands"];

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `p_${Math.random().toString(36).slice(2)}_${Date.now()}`;

interface Props {
  analysis: RetailerAnalysis | null;
  brand: RetailerBrand | null;
  images: string[];
  scenes: RetailerScene[];
  productRange?: string;
  salesChannel?: string;
  profileId?: string | null;
}

const RetailerPostsPanel = ({
  analysis, brand, images, scenes, productRange, salesChannel, profileId,
}: Props) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [channel, setChannel] = useState<PostChannel>("instagram");
  const [language, setLanguage] = useState("English");
  const [posts, setPosts] = useState<Record<PostChannel, RetailerPost[]>>({
    instagram: [], linkedin: [], email: [],
  });
  const [loading, setLoading] = useState(false);
  const [appending, setAppending] = useState(false);

  const sceneImages = useMemo(
    () => scenes.map((s) => s.imageUrl).filter((u): u is string => Boolean(u)),
    [scenes],
  );
  const referenceImages = useMemo(
    () => [...sceneImages, ...images].slice(0, 4),
    [sceneImages, images],
  );

  // Restore previously kept posts
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("retailer_posts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_pinned", true)
        .order("created_at", { ascending: false })
        .limit(60);
      if (cancelled || !data?.length) return;
      const next: Record<PostChannel, RetailerPost[]> = { instagram: [], linkedin: [], email: [] };
      for (const row of data as any[]) {
        const ch = (row.channel as PostChannel) || "instagram";
        if (!next[ch]) continue;
        next[ch].push({
          id: makeId(),
          rowId: row.id,
          channel: ch,
          caption: row.caption ?? undefined,
          body: row.body ?? undefined,
          subject: row.subject ?? undefined,
          preview: row.preview ?? undefined,
          hashtags: row.hashtags ?? undefined,
          imageUrl: row.image_url ?? null,
          imagePrompt: row.image_prompt ?? undefined,
          isPinned: true,
        });
      }
      setPosts(next);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const current = posts[channel] ?? [];

  const generate = async (mode: "replace" | "append") => {
    if (!analysis?.products?.length) {
      toast({ title: "Analyse your products first", variant: "destructive" });
      return;
    }
    if (mode === "append") setAppending(true); else setLoading(true);
    try {
      trackEvent("ai_call", "retailer-posts", { fn: "generate-retailer-posts", channel });
      const existingHooks = current
        .map((p) => p.caption || p.subject || p.body || "")
        .filter(Boolean);
      const { data, error } = await supabase.functions.invoke("generate-retailer-posts", {
        body: {
          channel,
          language,
          existingHooks,
          productRange,
          salesChannel,
          overall: analysis.overall,
          products: analysis.products,
          scenes: scenes.map((s) => ({
            room: s.room, style: s.style, isCombination: s.isCombination, productNames: s.productNames,
          })),
          brand,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const incoming = (data?.posts || []) as any[];
      if (!incoming.length) throw new Error("No posts were written");

      const mapped: RetailerPost[] = incoming.map((p) => ({
        id: makeId(),
        channel,
        caption: p.caption || undefined,
        body: p.body || undefined,
        subject: p.subject || undefined,
        preview: p.preview || undefined,
        hashtags: p.hashtags || undefined,
        imagePrompt: p.imagePrompt || undefined,
        productNames: Array.isArray(p.productNames) ? p.productNames : [],
        imageUrl: null,
        isPinned: false,
      }));

      setPosts((prev) => {
        const kept = mode === "append" ? prev[channel] : prev[channel].filter((p) => p.isPinned);
        return { ...prev, [channel]: [...kept, ...mapped] };
      });
    } catch (err) {
      console.error("Retailer posts error", err);
      toast({ title: "Couldn't write the posts", description: getAiErrorMessage(err), variant: "destructive" });
    } finally {
      setLoading(false);
      setAppending(false);
    }
  };

  const patch = (id: string, next: Partial<RetailerPost>) =>
    setPosts((prev) => ({
      ...prev,
      [channel]: prev[channel].map((p) => (p.id === id ? { ...p, ...next } : p)),
    }));

  const togglePin = async (post: RetailerPost) => {
    if (post.isPinned) {
      patch(post.id, { isPinned: false });
      if (user && post.rowId) await supabase.from("retailer_posts").delete().eq("id", post.rowId);
      patch(post.id, { rowId: undefined });
      return;
    }
    patch(post.id, { isPinned: true });
    if (!user) return;
    const { data, error } = await supabase
      .from("retailer_posts")
      .insert({
        user_id: user.id,
        profile_id: profileId ?? null,
        channel: post.channel,
        caption: post.caption ?? null,
        body: post.body ?? null,
        subject: post.subject ?? null,
        preview: post.preview ?? null,
        hashtags: post.hashtags ?? null,
        image_url: post.imageUrl ?? null,
        image_prompt: post.imagePrompt ?? null,
        is_pinned: true,
        language,
        metadata: { productNames: post.productNames ?? [] } as any,
      } as any)
      .select("id")
      .single();
    if (!error && data) patch(post.id, { rowId: (data as any).id });
  };

  const persist = async (post: RetailerPost, next: Partial<RetailerPost>) => {
    if (!user || !post.rowId) return;
    await supabase
      .from("retailer_posts")
      .update({
        caption: next.caption ?? post.caption ?? null,
        body: next.body ?? post.body ?? null,
        subject: next.subject ?? post.subject ?? null,
        hashtags: next.hashtags ?? post.hashtags ?? null,
        image_url: next.imageUrl ?? post.imageUrl ?? null,
        image_prompt: next.imagePrompt ?? post.imagePrompt ?? null,
      } as any)
      .eq("id", post.rowId);
  };

  const remove = async (post: RetailerPost) => {
    setPosts((prev) => ({ ...prev, [channel]: prev[channel].filter((p) => p.id !== post.id) }));
    if (user && post.rowId) await supabase.from("retailer_posts").delete().eq("id", post.rowId);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" /> Ready-to-publish posts
        </h3>
        <p className="text-sm text-muted-foreground">
          Written from your real products, your assortment style{brand ? " and your brand look" : ""} — with matching
          post images from the rooms you just created.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {CHANNELS.map((c) => {
          const Icon = c.icon;
          const active = channel === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setChannel(c.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium border inline-flex items-center gap-2 transition-all ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              <Icon className="w-4 h-4" /> {c.label}
              {(posts[c.id] ?? []).length > 0 && (
                <span className="text-xs opacity-70">{(posts[c.id] ?? []).length}</span>
              )}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-9 rounded-md border border-border/60 bg-card px-2 text-sm"
            aria-label="Post language"
          >
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <Button onClick={() => generate("replace")} disabled={loading || appending}>
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Writing…</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Write {CHANNELS.find((c) => c.id === channel)?.label} posts</>
            )}
          </Button>
        </div>
      </div>

      {loading && current.length === 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      ) : current.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center text-sm text-muted-foreground">
          {CHANNELS.find((c) => c.id === channel)?.hint} — press the button to write them.
        </div>
      ) : (
        <>
          <div className={channel === "instagram" ? "grid md:grid-cols-2 gap-4" : "space-y-4"}>
            {current.map((p, i) => (
              <PostCard
                key={p.id}
                index={i}
                post={p}
                brand={brand}
                overallStyle={analysis?.overall?.styleName}
                palette={analysis?.overall?.palette || []}
                referenceImages={referenceImages}
                onChange={(next) => { patch(p.id, next); void persist(p, next); }}
                onTogglePin={() => void togglePin(p)}
                onDelete={() => void remove(p)}
              />
            ))}
          </div>
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => generate("append")} disabled={loading || appending}>
              {appending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Writing more…</>
              ) : (
                "+ Write more posts"
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const PostCard = ({
  index, post, brand, overallStyle, palette, referenceImages, onChange, onTogglePin, onDelete,
}: {
  index: number;
  post: RetailerPost;
  brand: RetailerBrand | null;
  overallStyle?: string;
  palette: string[];
  referenceImages: string[];
  onChange: (next: Partial<RetailerPost>) => void;
  onTogglePin: () => void;
  onDelete: () => void;
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const fullText = [post.subject ? `Subject: ${post.subject}` : "", post.preview ? `Preview: ${post.preview}` : "", post.caption || post.body || "", post.hashtags || ""]
    .filter(Boolean)
    .join("\n\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({ title: "Couldn't copy", variant: "destructive" });
    }
  };

  const makeImage = async () => {
    setImgLoading(true);
    try {
      trackEvent("ai_call", "retailer-posts", { fn: "generate-retailer-post-image" });
      const { data, error } = await supabase.functions.invoke("generate-retailer-post-image", {
        body: {
          channel: post.channel,
          caption: post.caption || post.body || post.subject || "",
          imagePrompt: post.imagePrompt,
          customPrompt: customPrompt.trim() || undefined,
          sourceImageUrl: customPrompt.trim() && post.imageUrl ? post.imageUrl : undefined,
          referenceImageUrls: referenceImages,
          brand,
          overallStyle,
          palette,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.imageUrl) throw new Error("No image returned");
      onChange({ imageUrl: data.imageUrl as string });
    } catch (err) {
      console.error("Post image error", err);
      toast({ title: "Couldn't create the image", description: getAiErrorMessage(err), variant: "destructive" });
    } finally {
      setImgLoading(false);
    }
  };

  const isEmail = post.channel === "email";

  return (
    <Card className={`overflow-hidden ${post.isPinned ? "border-primary/50 ring-1 ring-primary/20" : "border-border/50"}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-xs">Post {index + 1}</Badge>
          <div className="flex items-center gap-1.5">
            <button
              onClick={copy}
              className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground inline-flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={onTogglePin}
              className={`rounded-full border px-2.5 py-1 text-[11px] inline-flex items-center gap-1 ${
                post.isPinned
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {post.isPinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
              {post.isPinned ? "Kept" : "Keep"}
            </button>
            <button
              onClick={onDelete}
              className="rounded-full border border-border/60 p-1 text-muted-foreground hover:border-destructive/50 hover:text-destructive"
              aria-label="Delete post"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className={`rounded-xl overflow-hidden border border-border/50 bg-secondary ${isEmail || post.channel === "linkedin" ? "aspect-[1.91/1]" : "aspect-square"}`}>
          {post.imageUrl ? (
            <img src={post.imageUrl} alt={post.caption?.slice(0, 80) || "Post image"} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
              {imgLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Creating the image…</>
              ) : (
                <><ImageIcon className="w-6 h-6 opacity-60" /> No image yet</>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={makeImage} disabled={imgLoading}>
            {imgLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5 mr-1.5" />}
            {post.imageUrl ? "Regenerate image" : "Create post image"}
          </Button>
          <button
            onClick={() => setShowPrompt((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            {showPrompt ? "Hide direction" : "Direct the image"}
          </button>
        </div>

        {showPrompt && (
          <Input
            value={customPrompt}
            placeholder="e.g. show the sofa in a bright loft with big windows"
            onChange={(e) => setCustomPrompt(e.target.value)}
          />
        )}

        {isEmail && (
          <div className="space-y-2">
            <Input
              value={post.subject || ""}
              placeholder="Subject"
              onChange={(e) => onChange({ subject: e.target.value })}
              className="font-medium"
            />
            {post.preview && (
              <p className="text-xs text-muted-foreground">{post.preview}</p>
            )}
          </div>
        )}

        <Textarea
          value={post.caption || post.body || ""}
          onChange={(e) => onChange(post.caption !== undefined && post.caption !== null && !post.body ? { caption: e.target.value } : { body: e.target.value })}
          rows={isEmail ? 10 : 6}
          className="resize-y text-sm leading-relaxed"
        />

        {post.hashtags !== undefined && !isEmail && (
          <Input
            value={post.hashtags || ""}
            placeholder="#hashtags"
            onChange={(e) => onChange({ hashtags: e.target.value })}
            className="text-xs text-primary"
          />
        )}

        {post.productNames?.length ? (
          <p className="text-xs text-muted-foreground">Features: {post.productNames.join(", ")}</p>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default RetailerPostsPanel;
