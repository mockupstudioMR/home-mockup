import { lazy, Suspense, type ComponentType } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuizProvider } from "@/contexts/QuizContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary, RouteErrorBoundary } from "@/components/ErrorBoundary";
// Development-only helper. In production builds this branch is removed, so
// the component (and the account emails inside it) never ship to users.
const DevRoleSwitcher = import.meta.env.DEV
  ? lazy(() => import("@/components/DevRoleSwitcher"))
  : () => null;
import Index from "./pages/Index";
import Auth from "./pages/Auth";

const lazyWithReload = <T extends ComponentType<Record<string, never>>>(
  importer: () => Promise<{ default: T }>,
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

// Lazy load heavy pages
const Start = lazyWithReload(() => import("./pages/Start"), "start");
const ChoosePath = lazyWithReload(() => import("./pages/ChoosePath"), "choose-path");
const FloorPlan = lazyWithReload(() => import("./pages/FloorPlan"), "floor-plan");
const PlanRooms = lazyWithReload(() => import("./pages/PlanRooms"), "plan-rooms");
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
          <ErrorBoundary variant="app">
            <BrowserRouter>
              <Suspense fallback={null}>
                <DevRoleSwitcher />
              </Suspense>
              <RouteErrorBoundary>
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
              <Route path="/plan-rooms" element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <PlanRooms />
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
                <AnalyzeRoom />
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
              </RouteErrorBoundary>
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </QuizProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
