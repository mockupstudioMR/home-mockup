import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

const DEV_ACCOUNTS = {
  admin: "monicariad@gmail.com",
  user: "monica@mockupstudio.io",
};

const DevRoleSwitcher = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const isAdmin = role === "admin";
  const targetRole = isAdmin ? "user" : "admin";
  const targetEmail = DEV_ACCOUNTS[targetRole];

  const handleSwitch = async () => {
    toast.info(`Signing out… Log in as ${targetRole}: ${targetEmail}`);
    await signOut();
    navigate("/auth");
  };

  return (
    <button
      onClick={handleSwitch}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
      title={`Switch to ${targetRole} (${targetEmail})`}
    >
      <ArrowLeftRight className="w-3 h-3" />
      <span className="hidden sm:inline">{role ?? "user"}</span>
      <span>→ {targetRole}</span>
    </button>
  );
};

export default DevRoleSwitcher;
