import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { convertGoogleDriveUrlToBase64 } from '@/lib/googleDrive';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BannerCarousel from "@/components/BannerCarousel";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Heart, Leaf, Truck, Shield, Gift, Scissors } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  images: string[];
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_active: boolean;
  short_description?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
}

const Index = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { toggleWishlist } = useWishlist();
  const { settings } = useSiteSettings();

  const formatPrice = (price: number) => {
    const currency = settings?.currency || 'COP';
    const locale = currency === 'COP' ? 'es-CO' : 'es-ES';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch featured products
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .limit(6);

      // Fetch featured categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('display_order');

      setFeaturedProducts(products || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: <Truck className="h-8 w-8" />,
      title: "Envío Seguro",
      description: "Empaque especial para proteger tus creaciones"
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Hecho a Mano", 
      description: "Cada pieza es única y personalizada"
    },
    {
      icon: <Scissors className="h-8 w-8" />,
      title: "Diseño Personalizado",
      description: "Adaptamos cada creación a tus gustos"
    },
    {
      icon: <Gift className="h-8 w-8" />,
      title: "Para Ocasiones Especiales",
      description: "Perfectas para momentos únicos"
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <BannerCarousel />

      {/* Benefits Section */}
      <section className="py-16 farfalla-section-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="text-farfalla-teal mb-4 flex justify-center">
                  {benefit.icon}
                </div>
                <h3 className="font-poppins font-semibold text-farfalla-ink mb-2">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground font-inter text-sm">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 farfalla-section-overlay">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-poppins font-bold text-farfalla-ink mb-4">
              Especialidades Destacadas
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explora nuestras creaciones artesanales en papel, perfectas para cada ocasión especial
            </p>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="farfalla-card p-8 animate-pulse">
                  <div className="w-16 h-16 bg-muted rounded-2xl mx-auto mb-6"></div>
                  <div className="h-6 bg-muted rounded w-3/4 mx-auto mb-3"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {categories.map((category, index) => {
                const getIcon = (name: string) => {
                  if (name.toLowerCase().includes('invitacion')) return <Sparkles className="h-8 w-8 text-farfalla-teal" />;
                  if (name.toLowerCase().includes('decoracion')) return <Heart className="h-8 w-8 text-farfalla-pink" />;
                  if (name.toLowerCase().includes('recuerdo')) return <Leaf className="h-8 w-8 text-farfalla-teal" />;
                  if (name.toLowerCase().includes('papeleria')) return <Scissors className="h-8 w-8 text-farfalla-pink" />;
                  return <Gift className="h-8 w-8 text-farfalla-teal" />;
                };
                
                const getColorClass = (index: number) => {
                  const colors = ['bg-farfalla-teal/10', 'bg-farfalla-pink/10'];
                  return colors[index % colors.length];
                };
                
                const getHoverColorClass = (index: number) => {
                  const colors = ['group-hover:bg-farfalla-teal/20', 'group-hover:bg-farfalla-pink/20'];
                  return colors[index % colors.length];
                };

                return (
                  <div 
                    key={category.id} 
                    className="farfalla-card p-8 text-center group hover:scale-105 transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/categoria/${category.slug}`)}
                  >
                    <div className={`w-16 h-16 ${getColorClass(index)} rounded-2xl flex items-center justify-center mx-auto mb-6 ${getHoverColorClass(index)} transition-colors`}>
                      {getIcon(category.name)}
                    </div>
                    <h3 className="text-xl font-poppins font-semibold text-farfalla-ink mb-3">{category.name}</h3>
                    <p className="text-muted-foreground">{category.description || `Productos de ${category.name.toLowerCase()} personalizados`}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="farfalla-card p-8 text-center">
                <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Gift className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-poppins font-semibold text-farfalla-ink mb-3">Próximamente</h3>
                <p className="text-muted-foreground">Nuevas categorías de productos estarán disponibles pronto</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 farfalla-section-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-poppins font-bold text-farfalla-ink mb-4">
              Creaciones Destacadas
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nuestras piezas más populares, cada una hecha con amor y dedicación
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="farfalla-card animate-pulse">
                  <div className="h-48 sm:h-56 bg-muted rounded-xl mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product, index) => (
                <div key={product.slug} className="animate-fade-in" style={{animationDelay: `${index * 200}ms`}}>
                  <ProductCard
                    id={product.id}
                    slug={product.slug}
                    name={product.name}
                    price={product.price}
                    comparePrice={product.compare_price}
                    image={product.images[0] ? convertGoogleDriveUrlToBase64(product.images[0]) : '/placeholder.svg'}
                    rating={product.rating}
                    reviewCount={product.review_count}
                    badge={
                      product.compare_price 
                        ? { text: `${Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}% OFF`, type: "promo" as const }
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-6">
                No hay productos destacados disponibles en este momento.
              </p>
            </div>
          )}

          <div className="text-center mt-12">
            <Button className="farfalla-btn-primary">
              Ver Todas las Creaciones
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

            {/* CTA Section */}
            <section className="py-16 farfalla-section-overlay">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="farfalla-glass p-8 md:p-12 text-center farfalla-glow">
                  <Truck className="h-16 w-16 text-farfalla-teal mx-auto mb-6" />
                  <h2 className="text-2xl md:text-3xl font-poppins font-bold text-farfalla-ink mb-4">
                    {settings?.free_shipping_enabled && settings?.free_shipping_minimum 
                      ? `Envío Gratis en Compras Superiores a ${formatPrice(settings.free_shipping_minimum)}`
                      : 'Recibe tus creaciones con el mejor cuidado'
                    }
                  </h2>
                  <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                    {settings?.free_shipping_enabled && settings?.free_shipping_minimum
                      ? 'Recibe tus creaciones artesanales sin costo adicional. Entregas cuidadosas para preservar cada detalle.'
                      : 'Entregas cuidadosas para preservar cada detalle de tus creaciones artesanales.'
                    }
                  </p>
                  <Button className="farfalla-btn-primary">
                    Ver Creaciones
                  </Button>
                </div>
              </div>
            </section>

      <Footer />
    </div>
  );
};

export default Index;