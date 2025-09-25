import { Component, ErrorInfo, ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";
import { SiteSettingsProvider } from "@/hooks/useSiteSettings";
import WhatsAppWidget from "@/components/WhatsAppWidget";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Algo salió mal</h2>
            <p className="text-muted-foreground mb-4">
              Error: {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
import { AuthCheck } from "@/components/AuthCheck";
import { AdminLayout } from "@/components/AdminLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CategoryPage from "./pages/CategoryPage";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import PaymentResult from "./pages/PaymentResult";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import ProductForm from "./pages/admin/ProductForm";
import Categories from "./pages/admin/Categories";
import CategoryForm from "./pages/admin/CategoryForm";
import Subcategories from "./pages/admin/Subcategories";
import SubcategoryForm from "./pages/admin/SubcategoryForm";
import Variants from "./pages/admin/Variants";
import VariantForm from "./pages/admin/VariantForm";
import AdminOrders from "./pages/admin/Orders";
import Branding from "./pages/admin/Branding";
import Banner from "./pages/admin/Banner";
import BannerForm from "./pages/admin/BannerForm";
import Content from "./pages/admin/Content";
import Settings from "./pages/admin/Settings";
import ProductRelationships from "./pages/admin/ProductRelationships";
import Themes from "./pages/admin/Themes";
import ThemeForm from "./pages/admin/ThemeForm";
import ThemeBulkUpload from "./pages/admin/ThemeBulkUpload";
import ThemeImageBulkUpload from "./pages/admin/ThemeImageBulkUpload";
import ThemeElements from "./pages/admin/ThemeElements";
import UserAddresses from "./pages/UserAddresses";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <SiteSettingsProvider>
        <CartProvider>
          <WishlistProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <WhatsAppWidget />
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
                        <Route path="product-relationships" element={<ProductRelationships />} />
                        <Route path="themes" element={<Themes />} />
                        <Route path="themes/new" element={<ThemeForm />} />
                        <Route path="themes/edit/:id" element={<ThemeForm />} />
                        <Route path="themes/bulk-upload" element={<ThemeBulkUpload />} />
                        <Route path="themes/image-bulk-upload" element={<ThemeImageBulkUpload />} />
                        <Route path="themes/:themeId/elements" element={<ThemeElements />} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="orders/:orderId" element={<OrderDetail />} />
                        <Route path="branding" element={<Branding />} />
                  <Route path="banner" element={<Banner />} />
                  <Route path="banner/new" element={<BannerForm />} />
                  <Route path="banner/edit/:id" element={<BannerForm />} />
                        <Route path="content" element={<Content />} />
                        <Route path="settings" element={<Settings />} />
                      </Routes>
                    </AdminLayout>
                  </AuthCheck>
                } />
                <Route path="/categoria/:categorySlug" element={<CategoryPage />} />
                <Route path="/producto/:productSlug" element={<ProductDetail />} />
                <Route path="/carrito" element={<Cart />} />
                <Route path="/payment-result" element={<PaymentResult />} />
                <Route path="/mis-pedidos" element={<Orders />} />
                <Route path="/pedido/:orderId" element={<OrderDetail />} />
                <Route path="/mis-direcciones" element={<UserAddresses />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </WishlistProvider>
        </CartProvider>
      </SiteSettingsProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
