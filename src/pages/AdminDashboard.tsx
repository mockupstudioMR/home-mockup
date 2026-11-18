/** /admin — the admin, built from the admin design boards (src/admin). Older tools without a board yet sit inside the same frame. */
import { useSearchParams } from "react-router-dom";
import { AdminShell, type Section } from "@/admin/ui";
import Home from "@/admin/sections/Home";
import { BatchView, ScanHome, Setup } from "@/admin/sections/Scan";
import { Queue, ReviewPiece, SpotCheck } from "@/admin/sections/Review";
import { Vocabulary } from "@/admin/sections/Vocabulary";
import { Combinations, Schemes } from "@/admin/sections/Schemes";
import { Styles } from "@/admin/sections/Styles";
import { Sizes } from "@/admin/sections/Sizes";
import { Products } from "@/admin/sections/Products";
import { ProjectDetail, Projects } from "@/admin/sections/Projects";
import { Users } from "@/admin/sections/Users";
import { Settings } from "@/admin/sections/Settings";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

const AdminDashboard = () => {
  const [params] = useSearchParams();
  const section = (params.get("section") as Section) || "home";
  const view = params.get("view");
  switch (section) {
    case "scan": {
      const batch = params.get("batch");
      if (batch) return <BatchView id={batch} view={view} />;
      return view === "setup" ? <Setup /> : <ScanHome />;
    }
    case "review": {
      const piece = params.get("piece");
      if (piece) return <ReviewPiece id={piece} />;
      return view === "spotcheck" ? <SpotCheck /> : <Queue />;
    }
    case "vocabulary":
      return <Vocabulary />;
    case "schemes":
      return params.get("tab") === "combinations" ? <Combinations /> : <Schemes />;
    case "styles":
      return <Styles />;
    case "sizes":
      return <Sizes />;
    case "products":
      return <Products />;
    case "projects": {
      const project = params.get("project");
      return project ? <ProjectDetail id={project} /> : <Projects />;
    }
    case "users":
      return <Users />;
    case "cms":
      return <Settings />;
    case "analytics":
      return (
        <AdminShell board="Analytics" section="analytics">
          <h1 className="ah1">Analytics</h1>
          <div className="legacy sec">
            <AnalyticsDashboard scope="admin" />
          </div>
        </AdminShell>
      );
    case "billing":
      return (
        <AdminShell board="Billing" section="billing">
          <h1 className="ah1">Billing</h1>
          <p className="asub">Credit packages and payment settings. Payment integration is coming soon.</p>
        </AdminShell>
      );
    default:
      return <Home />;
  }
};

export default AdminDashboard;
