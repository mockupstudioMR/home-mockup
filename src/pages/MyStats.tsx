import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

const MyStats = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <button
          onClick={() => navigate("/start")}
          className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Logo size={32} />
          <span className="font-semibold text-lg tracking-tight text-foreground">HomeMockUp</span>
        </button>
        <Button variant="ghost" size="sm" onClick={() => navigate("/start")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </header>

      <main className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-2 py-6 md:py-10">
            <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Your activity
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">My HomeMockUp Stats</h1>
            <p className="text-muted-foreground">
              See how often you start a journey, generate designs, and what you love
            </p>
          </div>

          <AnalyticsDashboard scope="user" />
        </div>
      </main>
    </div>
  );
};

export default MyStats;
