import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthCheck } from "@/components/AuthCheck";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CategoryPage from "./pages/CategoryPage";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import ProductForm from "./pages/admin/ProductForm";
import Categories from "./pages/admin/Categories";
import CategoryForm from "./pages/admin/CategoryForm";
import Subcategories from "./pages/admin/Subcategories";
import SubcategoryForm from "./pages/admin/SubcategoryForm";
import Variants from "./pages/admin/Variants";
import VariantForm from "./pages/admin/VariantForm";
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
          <Route path="/admin/products/new" element={
            <AuthCheck requireAdmin={true}>
              <ProductForm />
            </AuthCheck>
          } />
          <Route path="/admin/products/edit/:id" element={
            <AuthCheck requireAdmin={true}>
              <ProductForm />
            </AuthCheck>
          } />
          <Route path="/admin/categories" element={
            <AuthCheck requireAdmin={true}>
              <Categories />
            </AuthCheck>
          } />
          <Route path="/admin/categories/new" element={
            <AuthCheck requireAdmin={true}>
              <CategoryForm />
            </AuthCheck>
          } />
          <Route path="/admin/categories/edit/:id" element={
            <AuthCheck requireAdmin={true}>
              <CategoryForm />
            </AuthCheck>
          } />
          <Route path="/admin/subcategories" element={
            <AuthCheck requireAdmin={true}>
              <Subcategories />
            </AuthCheck>
          } />
          <Route path="/admin/subcategories/new" element={
            <AuthCheck requireAdmin={true}>
              <SubcategoryForm />
            </AuthCheck>
          } />
          <Route path="/admin/subcategories/edit/:id" element={
            <AuthCheck requireAdmin={true}>
              <SubcategoryForm />
            </AuthCheck>
          } />
          <Route path="/admin/variants" element={
            <AuthCheck requireAdmin={true}>
              <Variants />
            </AuthCheck>
          } />
          <Route path="/admin/variants/new" element={
            <AuthCheck requireAdmin={true}>
              <VariantForm />
            </AuthCheck>
          } />
          <Route path="/admin/variants/edit/:id" element={
            <AuthCheck requireAdmin={true}>
              <VariantForm />
            </AuthCheck>
          } />
          <Route path="/categoria/:categorySlug" element={<CategoryPage />} />
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
