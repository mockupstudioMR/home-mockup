import { Component, lazy, Suspense, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuizProvider } from "@/contexts/QuizContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DevRoleSwitcher from "@/components/DevRoleSwitcher";
import Index from "./pages/Index";
import Auth from "./pages/Auth";

const lazyWithReload = <T extends { default: React.ComponentType<any> }>(
  importer: () => Promise<T>,
  chunkName: string
) =>
  lazy(async () => {
    try {
      const module = await importer();
      sessionStorage.removeItem(`hm_chunk_reload_${chunkName}`);
      return module;
    } catch (error) {
      const isImportFailure =
        error instanceof TypeError ||
        (error instanceof Error && /import|module|chunk|preload/i.test(error.message));
      const reloadKey = `hm_chunk_reload_${chunkName}`;

      if (isImportFailure && sessionStorage.getItem(reloadKey) !== "true") {
        sessionStorage.setItem(reloadKey, "true");
        window.location.reload();
      }

      throw error;
    }
  });

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("App render failed:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
          <div className="max-w-sm space-y-4">
            <h1 className="text-2xl font-semibold">We need to refresh HomeMockUp</h1>
            <p className="text-sm text-muted-foreground">
              A new version is available. Refresh to load the latest experience.
            </p>
            <button
              type="button"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy load heavy pages
const Start = lazyWithReload(() => import("./pages/Start"), "start");
const ChoosePath = lazyWithReload(() => import("./pages/ChoosePath"), "choose-path");
const FloorPlan = lazyWithReload(() => import("./pages/FloorPlan"), "floor-plan");
const StyleTree = lazyWithReload(() => import("./pages/StyleTree"), "style-tree");
const AnalyzeRoom = lazyWithReload(() => import("./pages/AnalyzeRoom"), "analyze-room");
const ExistingRoomFlow = lazyWithReload(() => import("./pages/ExistingRoomFlow"), "existing-room");
const AnalyzeProducts = lazyWithReload(() => import("./pages/AnalyzeProducts"), "analyze-products");
const B2BSolutions = lazyWithReload(() => import("./pages/B2BSolutions"), "b2b-solutions");
const Quiz = lazyWithReload(() => import("./pages/Quiz"), "quiz");
const Generate = lazyWithReload(() => import("./pages/Generate"), "generate");
const Gallery = lazyWithReload(() => import("./pages/Gallery"), "gallery");
const MyStats = lazyWithReload(() => import("./pages/MyStats"), "my-stats");
const NotFound = lazyWithReload(() => import("./pages/NotFound"), "not-found");
const AdminDashboard = lazyWithReload(() => import("./pages/AdminDashboard"), "admin");
const DesignerDashboard = lazyWithReload(() => import("./pages/DesignerDashboard"), "designer");
const ShopDashboard = lazyWithReload(() => import("./pages/ShopDashboard"), "shop");
const WhatsAppPicker = lazyWithReload(() => import("./pages/WhatsAppPicker"), "whatsapp-picker");
const DesignJourney = lazyWithReload(() => import("./pages/DesignJourney"), "design-journey");

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-pulse text-muted-foreground">Loading...</div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <QuizProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppErrorBoundary>
            <BrowserRouter>
              <DevRoleSwitcher />
              <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/b2b-solutions" element={<B2BSolutions />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/choose-path" element={<ChoosePath />} />
              
              {/* User routes */}
              <Route path="/start" element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <Start />
                </ProtectedRoute>
              } />
              <Route path="/floor-plan" element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <FloorPlan />
                </ProtectedRoute>
              } />
              <Route path="/existing-room" element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <ExistingRoomFlow />
                </ProtectedRoute>
              } />
              <Route path="/style-tree" element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <StyleTree />
                </ProtectedRoute>
              } />
              <Route path="/analyze-room" element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <AnalyzeRoom />
                </ProtectedRoute>
              } />
              <Route path="/analyze-products" element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <AnalyzeProducts />
                </ProtectedRoute>
              } />
              <Route path="/quiz" element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <Quiz />
                </ProtectedRoute>
              } />
              <Route path="/generate" element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <Generate />
                </ProtectedRoute>
              } />
              <Route path="/gallery" element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <Gallery />
                </ProtectedRoute>
              } />
              <Route path="/my-stats" element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <MyStats />
                </ProtectedRoute>
              } />

              {/* Admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              {/* Designer routes */}
              <Route path="/designer" element={
                <ProtectedRoute allowedRoles={["designer"]}>
                  <DesignerDashboard />
                </ProtectedRoute>
              } />

              {/* Shop routes */}
              <Route path="/shop" element={
                <ProtectedRoute allowedRoles={["furniture_shop"]}>
                  <ShopDashboard />
                </ProtectedRoute>
              } />

              <Route path="/wa/:sessionId/:visualKind" element={<WhatsAppPicker />} />
              <Route path="/design-journey/:designId" element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <DesignJourney />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </BrowserRouter>
          </AppErrorBoundary>
        </TooltipProvider>
      </QuizProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
