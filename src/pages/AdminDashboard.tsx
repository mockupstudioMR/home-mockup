import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BarChart3,
  CreditCard,
  FileText,
  FolderOpen,
  Home,
  LogOut,
  Ruler,
  ShoppingBag,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import CMSEditor from "@/components/admin/CMSEditor";
import AdminProductManagement from "@/components/admin/AdminProductManagement";
import RoomFurnitureManager from "@/components/admin/RoomFurnitureManager";
import PromptTemplateManager from "@/components/admin/PromptTemplateManager";
import TypeFamiliesManager from "@/components/admin/TypeFamiliesManager";
import FurnitureSpecsManager from "@/components/admin/FurnitureSpecsManager";
import RoomActivitiesManager from "@/components/admin/RoomActivitiesManager";
import OpeningRulesManager from "@/components/admin/OpeningRulesManager";
import ProductMatchingWeights from "@/components/admin/ProductMatchingWeights";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import AdminHome, { type AdminSection, useAdminCounts } from "@/components/admin/AdminHome";
import ProjectSupport from "@/components/admin/ProjectSupport";
import UsersInvites from "@/components/admin/UsersInvites";

type NavItem = { id: AdminSection; label: string; icon: React.ComponentType<{ className?: string }>; count?: number; soon?: boolean };

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [params, setParams] = useSearchParams();
  const section = (params.get("section") as AdminSection) || "home";
  const { data: counts } = useAdminCounts();

  const go = (s: AdminSection) => {
    setParams(s === "home" ? {} : { section: s });
    window.scrollTo({ top: 0 });
  };

  const groups: { label: string; items: NavItem[] }[] = [
    { label: "Overview", items: [{ id: "home", label: "Admin home", icon: Home }] },
    {
      label: "Curate",
      items: [
        { id: "sizes", label: "Sizes, scope & config", icon: Ruler, count: counts?.missingSizes },
        { id: "products", label: "Products & shops", icon: ShoppingBag, count: counts?.newProducts },
      ],
    },
    {
      label: "Run",
      items: [
        { id: "projects", label: "Projects support", icon: FolderOpen },
        { id: "users", label: "Users & invites", icon: Users },
        { id: "cms", label: "CMS & settings", icon: FileText },
        { id: "analytics", label: "Analytics", icon: BarChart3 },
        { id: "billing", label: "Billing", icon: CreditCard, soon: true },
      ],
    },
  ];

  const content = (() => {
    switch (section) {
      case "sizes":
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Sizes, scope &amp; design config</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Standard sizes fill the size step for users (they can still edit them). Scope defaults decide what&apos;s pre-selected for each starting point.
              </p>
            </div>
            <FurnitureSpecsManager />
            <RoomActivitiesManager />
            <OpeningRulesManager />
            <RoomFurnitureManager />
            <TypeFamiliesManager />
            <PromptTemplateManager />
            <ProductMatchingWeights />
          </div>
        );
      case "products":
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Products &amp; shops</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                The shops we search and the products in them. Shops users add in step 5 land here first.
              </p>
            </div>
            <AdminProductManagement />
          </div>
        );
      case "projects": return <ProjectSupport />;
      case "users": return <UsersInvites />;
      case "cms": return <CMSEditor />;
      case "analytics": return <AnalyticsDashboard scope="admin" />;
      case "billing":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Billing &amp; credits</CardTitle>
              <CardDescription>Manage credit packages and payment settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed bg-muted/50 p-6 text-center">
                <p className="font-semibold">Payment integration is coming soon</p>
              </div>
            </CardContent>
          </Card>
        );
      default: return <AdminHome go={go} />;
    }
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-8">
          <button type="button" onClick={() => go("home")} className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Home className="h-4 w-4" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">Home Mockup</span>
            <span className="rounded-full bg-foreground px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-background">Admin</span>
          </button>
          <Button variant="ghost" onClick={async () => { await signOut(); navigate("/"); }}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-start">
        <nav aria-label="Admin" className="flex w-full flex-row flex-wrap gap-1 border-b px-3 py-3 md:sticky md:top-[61px] md:w-64 md:flex-col md:flex-nowrap md:border-b-0 md:px-3 md:py-6">
          {groups.map((g) => (
            <div key={g.label} className="contents md:block">
              <p className="hidden px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground first:pt-0 md:block">{g.label}</p>
              {g.items.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => go(item.id)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold md:w-full",
                      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-left">{item.label}</span>
                    {!!item.count && (
                      <span className={cn("ml-auto rounded-full px-2 py-0.5 text-xs font-extrabold", active ? "bg-background text-primary" : "bg-amber-100 text-amber-900")}>
                        {item.count}
                      </span>
                    )}
                    {item.soon && <span className="ml-auto text-[11px] font-bold opacity-70">Soon</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <main className="min-w-0 flex-1 px-4 py-8 md:px-10">{content}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;
