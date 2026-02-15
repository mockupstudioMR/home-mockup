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
import Start from "./pages/Start";
import StyleTree from "./pages/StyleTree";
import AnalyzeRoom from "./pages/AnalyzeRoom";
import AnalyzeProducts from "./pages/AnalyzeProducts";

import Quiz from "./pages/Quiz";
import Generate from "./pages/Generate";
import Gallery from "./pages/Gallery";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import DesignerDashboard from "./pages/DesignerDashboard";
import ShopDashboard from "./pages/ShopDashboard";

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
