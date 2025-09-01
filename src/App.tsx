import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthCheck } from "@/components/AuthCheck";
import { AdminLayout } from "@/components/AdminLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CategoryPage from "./pages/CategoryPage";
import ProductDetail from "./pages/ProductDetail";
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
          <Route path="/admin/*" element={
            <AuthCheck requireAdmin={true}>
              <AdminLayout>
                <Routes>
                  <Route index element={<Dashboard />} />
                  <Route path="products" element={<Products />} />
                  <Route path="products/new" element={<ProductForm />} />
                  <Route path="products/edit/:id" element={<ProductForm />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="categories/new" element={<CategoryForm />} />
                  <Route path="categories/edit/:id" element={<CategoryForm />} />
                  <Route path="subcategories" element={<Subcategories />} />
                  <Route path="subcategories/new" element={<SubcategoryForm />} />
                  <Route path="subcategories/edit/:id" element={<SubcategoryForm />} />
                  <Route path="variants" element={<Variants />} />
                  <Route path="variants/new" element={<VariantForm />} />
                  <Route path="variants/edit/:id" element={<VariantForm />} />
                  <Route path="content" element={<Content />} />
                  <Route path="settings" element={<Settings />} />
                </Routes>
              </AdminLayout>
            </AuthCheck>
          } />
          <Route path="/categoria/:categorySlug" element={<CategoryPage />} />
          <Route path="/producto/:productSlug" element={<ProductDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
