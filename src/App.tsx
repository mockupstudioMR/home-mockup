import { lazy, Suspense } from "react";
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

// Lazy load heavy pages
const Start = lazy(() => import("./pages/Start"));
const StyleTree = lazy(() => import("./pages/StyleTree"));
const AnalyzeRoom = lazy(() => import("./pages/AnalyzeRoom"));
const AnalyzeProducts = lazy(() => import("./pages/AnalyzeProducts"));
const B2BSolutions = lazy(() => import("./pages/B2BSolutions"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Generate = lazy(() => import("./pages/Generate"));
const Gallery = lazy(() => import("./pages/Gallery"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const DesignerDashboard = lazy(() => import("./pages/DesignerDashboard"));
const ShopDashboard = lazy(() => import("./pages/ShopDashboard"));

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
          <BrowserRouter>
            <DevRoleSwitcher />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/b2b-solutions" element={<B2BSolutions />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* User routes */}
              <Route path="/start" element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <Start />
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

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QuizProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
