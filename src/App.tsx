import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthCheck } from "@/components/AuthCheck";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Categories from "./pages/admin/Categories";
import Content from "./pages/admin/Content";
import Settings from "./pages/admin/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={
            <AuthCheck requireAdmin={true}>
              <Dashboard />
            </AuthCheck>
          } />
          <Route path="/admin/products" element={
            <AuthCheck requireAdmin={true}>
              <Products />
            </AuthCheck>
          } />
          <Route path="/admin/categories" element={
            <AuthCheck requireAdmin={true}>
              <Categories />
            </AuthCheck>
          } />
          <Route path="/admin/content" element={
            <AuthCheck requireAdmin={true}>
              <Content />
            </AuthCheck>
          } />
          <Route path="/admin/settings" element={
            <AuthCheck requireAdmin={true}>
              <Settings />
            </AuthCheck>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
