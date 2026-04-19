import { supabase } from "@/integrations/supabase/client";

export type AnalyticsEventType =
  | "journey_start"
  | "output_generated"
  | "ai_call"
  | "satisfied";

/**
 * Fire-and-forget analytics tracker. Silently no-ops if user is not logged in.
 */
export async function trackEvent(
  eventType: AnalyticsEventType,
  screen: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("analytics_events").insert({
      user_id: user.id,
      event_type: eventType,
      screen,
      metadata: metadata as never,
    });
  } catch (err) {
    // Never break the app over analytics
    console.warn("[analytics] failed to track", eventType, err);
  }
}
