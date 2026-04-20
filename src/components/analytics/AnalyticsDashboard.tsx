import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Rocket, Sparkles, Cpu, Heart } from "lucide-react";

interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: string;
  screen: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface Props {
  /** If true, fetch all events (admin). Otherwise fetch only current user's. */
  scope: "user" | "admin";
}

const AnalyticsDashboard = ({ scope }: Props) => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      let query = supabase
        .from("analytics_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000);

      if (scope === "user") {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setEvents([]);
          setLoading(false);
          return;
        }
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;
      if (!error && data) setEvents(data as unknown as AnalyticsEvent[]);
      setLoading(false);
    };
    fetchEvents();
  }, [scope]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const counts = events.reduce(
    (acc, e) => {
      acc.total++;
      acc.byType[e.event_type] = (acc.byType[e.event_type] || 0) + 1;
      const screenKey = `${e.event_type}::${e.screen}`;
      acc.byScreen[screenKey] = (acc.byScreen[screenKey] || 0) + 1;
      return acc;
    },
    { total: 0, byType: {} as Record<string, number>, byScreen: {} as Record<string, number> }
  );

  const journeyStarts = counts.byType["journey_start"] || 0;
  const outputsGenerated = counts.byType["output_generated"] || 0;
  const aiCalls = counts.byType["ai_call"] || 0;
  const satisfied = counts.byType["satisfied"] || 0;
  const satisfactionRate =
    outputsGenerated > 0 ? Math.round((satisfied / outputsGenerated) * 100) : 0;
  const conversionRate =
    journeyStarts > 0 ? Math.round((outputsGenerated / journeyStarts) * 100) : 0;

  const startsByEntry = Object.entries(counts.byScreen)
    .filter(([k]) => k.startsWith("journey_start::"))
    .map(([k, v]) => ({ screen: k.replace("journey_start::", ""), count: v }))
    .sort((a, b) => b.count - a.count);

  const aiByScreen = Object.entries(counts.byScreen)
    .filter(([k]) => k.startsWith("ai_call::"))
    .map(([k, v]) => ({ screen: k.replace("ai_call::", ""), count: v }))
    .sort((a, b) => b.count - a.count);

  const stats = [
    { label: "Journeys started", value: journeyStarts, icon: Rocket, color: "text-primary", sub: null as string | null },
    { label: "Outputs generated", value: outputsGenerated, icon: Sparkles, color: "text-accent-foreground", sub: `${conversionRate}% of journeys` },
    { label: "AI calls", value: aiCalls, icon: Cpu, color: "text-secondary-foreground", sub: null },
    { label: "Satisfied", value: satisfied, icon: Heart, color: "text-primary", sub: `${satisfactionRate}% of outputs` },
  ];

  return (
    <div className="space-y-6">
      {/* Headline stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <span className="text-3xl font-bold tracking-tight">{s.value}</span>
              </div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              {s.sub && (
                <p className="text-xs font-medium text-primary mt-1">{s.sub}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Breakdowns */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Journeys by entry point</CardTitle>
            <CardDescription>Which "Get Started" tile users picked</CardDescription>
          </CardHeader>
          <CardContent>
            {startsByEntry.length === 0 ? (
              <p className="text-sm text-muted-foreground">No journey starts recorded yet.</p>
            ) : (
              <BarList items={startsByEntry} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI usage by screen</CardTitle>
            <CardDescription>Where AI was used most (proxy for credit usage)</CardDescription>
          </CardHeader>
          <CardContent>
            {aiByScreen.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No AI calls tracked yet. Tracking will populate as features are used.
              </p>
            ) : (
              <BarList items={aiByScreen} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Last {Math.min(events.length, 20)} events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {events.slice(0, 20).map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-md bg-secondary text-xs font-medium">
                    {e.event_type}
                  </span>
                  <span className="text-muted-foreground">{e.screen}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(e.created_at).toLocaleString()}
                </span>
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">
                No activity yet. Start a journey from the home screen!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const BarList = ({ items }: { items: { screen: string; count: number }[] }) => {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.screen} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium capitalize">{item.screen.replace(/-/g, " ")}</span>
            <span className="text-muted-foreground">{item.count}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsDashboard;
