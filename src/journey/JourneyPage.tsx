/** /journey/* — the "Designing my home" journey, one design board per screen. */
import { useEffect, type ComponentType } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { JourneyProvider } from "./state";
import { screenFor, type ScreenId } from "./routes";
import { SCREEN_COMPONENTS } from "./screens";

function Inner() {
  const params = useParams();
  const location = useLocation();
  const { user, loading } = useAuth();
  const found = screenFor(params["*"] ?? "");
  useEffect(() => {
    document.title = "Home Mockup — Designing my home";
  }, []);

  if (!found) return <Navigate to="/journey" replace />;
  if (found.id !== "Main") {
    if (loading)
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  const Comp = SCREEN_COMPONENTS[found.id] as ComponentType<{ param?: string }> | undefined;
  if (!Comp) return <NotBuilt id={found.id} />;
  return <Comp param={found.param} />;
}

function NotBuilt({ id }: { id: ScreenId }) {
  return <div style={{ padding: 40, fontFamily: "system-ui" }}>Screen {id} is not built yet.</div>;
}

export default function JourneyPage() {
  return (
    <JourneyProvider>
      <Inner />
    </JourneyProvider>
  );
}
