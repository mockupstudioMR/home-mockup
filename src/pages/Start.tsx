import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import IntentStep from "@/components/quiz/steps/IntentStep";
import { Card, CardContent } from "@/components/ui/card";

const Start = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  const intro = useMemo(() => {
    const fromState = (location.state as { intro?: { name?: string; roomType?: string; vision?: string } } | null)?.intro;
    if (fromState) return fromState;
    try {
      const raw = sessionStorage.getItem("get_started_intro");
      return raw ? JSON.parse(raw) as { name?: string; roomType?: string; vision?: string } : null;
    } catch { return null; }
  }, [location.state]);
  const firstName = intro?.name?.split(/\s+/)[0];

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-2xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-2xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Logo size={32} />
          <span className="font-semibold text-lg tracking-tight text-foreground">HomeMockUp</span>
        </button>
        <button
          onClick={() => navigate("/my-stats")}
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          My Stats
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="text-center space-y-3 py-8 md:py-12">
            <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-muted-foreground">
              {firstName ? `Welcome, ${firstName}` : "Start your journey"}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              How would you like to begin?
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
              {intro?.vision
                ? `We've got your vision in mind — pick the path that matches what you have today.`
                : `Pick the path that matches what you have today`}
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <IntentStep />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Start;
