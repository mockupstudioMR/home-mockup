import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

type AppRole = "admin" | "designer" | "furniture_shop" | "user";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  redirectTo?: string;
}

const ProtectedRoute = ({
  children,
  allowedRoles,
  redirectTo = "/auth",
}: ProtectedRouteProps) => {
  const { user, loading, role, roleLoading } = useAuth();
  const location = useLocation();

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect based on role
    const roleRedirects: Record<AppRole, string> = {
      admin: "/admin",
      designer: "/designer",
      furniture_shop: "/shop",
      user: "/start",
    };
    return <Navigate to={roleRedirects[role] || "/start"} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
