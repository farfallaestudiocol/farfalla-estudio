import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { convertGoogleDriveUrlToBase64 } from '@/lib/googleDrive';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProductRecommendations } from "@/components/ProductRecommendations";
import { FrequentlyBoughtTogether } from "@/components/FrequentlyBoughtTogether";
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  ArrowLeft, 
  Truck, 
  Shield,
  Package,
  Minus,
  Plus
} from "lucide-react";

interface ProductVariant {
  id: string;
  name: string;
  price?: number;
  sku?: string;
  stock_quantity: number;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price: number;
  compare_price?: number;
  images: string[];
  rating: number;
  review_count: number;
  stock_quantity: number;
  is_active: boolean;
  category_id?: string;
  subcategory_id?: string;
  categories?: {
    name: string;
    slug: string;
  };
  subcategories?: {
    name: string;
    slug: string;
  };
}

const ProductDetail = () => {
  const { productSlug } = useParams();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productSlug) {
      fetchProduct();
    }
  }, [productSlug]);

  const fetchProduct = async () => {
    try {
      const { data: productData, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name,
            slug
          ),
          subcategories (
            name,
            slug
          )
        `)
        .eq('slug', productSlug)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        return;
      }

      setProduct(productData);

      // Fetch variants for this product
      const { data: variantsData } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productData.id)
        .eq('is_active', true)
        .order('display_order');

      setVariants(variantsData || []);
      
      // Set first variant as default if available
      if (variantsData && variantsData.length > 0) {
        setSelectedVariant(variantsData[0]);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el producto',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getCurrentPrice = () => {
    if (selectedVariant && selectedVariant.price) {
      return selectedVariant.price;
    }
    return product?.price || 0;
  };

  const getCurrentStock = () => {
    if (selectedVariant) {
      return selectedVariant.stock_quantity;
    }
    return product?.stock_quantity || 0;
  };

  const discountPercentage = product?.compare_price 
    ? Math.round(((product.compare_price - getCurrentPrice()) / product.compare_price) * 100)
    : 0;

  const handleAddToCart = async () => {
    if (!product) return;

    await addToCart(product.id, selectedVariant?.id, quantity);
    
    // Reset quantity after adding
    setQuantity(1);
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    const maxStock = getCurrentStock();
    
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="min-h-screen farfalla-section-gradient flex items-center justify-center">
          <div className="text-center">
            <Package className="h-12 w-12 animate-spin text-farfalla-teal mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando producto...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="min-h-screen farfalla-section-gradient flex items-center justify-center">
          <div className="text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-poppins font-bold text-farfalla-ink mb-2">
              Producto no encontrado
            </h2>
            <p className="text-muted-foreground mb-6">
              El producto que buscas no está disponible o no existe.
            </p>
            <Link to="/" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              Volver al inicio
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-farfalla-teal transition-colors">
              Inicio
            </Link>
            <span>/</span>
            {product.categories && (
              <>
                <Link 
                  to={`/categoria/${product.categories.slug}`}
                  className="hover:text-farfalla-teal transition-colors"
                >
                  {product.categories.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-farfalla-ink font-medium">{product.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden">
              <img
                src={convertGoogleDriveUrlToBase64(product.images[selectedImageIndex]) || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </div>
            
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index 
                        ? 'border-farfalla-teal' 
                        : 'border-transparent'
                    }`}
                  >
                    <img
                      src={convertGoogleDriveUrlToBase64(image)}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and Rating */}
            <div>
              <h1 className="text-3xl font-poppins font-bold text-farfalla-ink mb-2">
                {product.name}
              </h1>
              
              {product.review_count > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.rating) 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({product.review_count} reseñas)
                  </span>
                </div>
              )}

              <p className="text-muted-foreground">
                {product.short_description}
              </p>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-poppins font-bold text-farfalla-ink">
                  {formatPrice(getCurrentPrice())}
                </span>
                {product.compare_price && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(product.compare_price)}
                    </span>
                    <Badge className="farfalla-badge-promo">
                      -{discountPercentage}%
                    </Badge>
                  </>
                )}
              </div>
              <p className="text-sm text-farfalla-teal font-medium">
                Envío gratis desde $150.000
              </p>
            </div>

            {/* Variants */}
            {variants.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-farfalla-ink">Variantes:</h3>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <Button
                      key={variant.id}
                      variant={selectedVariant?.id === variant.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedVariant(variant);
                        setQuantity(1); // Reset quantity when variant changes
                      }}
                      className={selectedVariant?.id === variant.id ? "farfalla-btn-primary" : ""}
                    >
                      {variant.name}
                      {variant.price && (
                        <span className="ml-1 text-xs">
                          ({formatPrice(variant.price)})
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-3">
              <h3 className="font-semibold text-farfalla-ink">Cantidad:</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="h-10 w-10 rounded-r-none"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-16 text-center font-medium">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= getCurrentStock()}
                    className="h-10 w-10 rounded-l-none"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  {getCurrentStock()} disponibles
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                className="farfalla-btn-primary w-full"
                onClick={handleAddToCart}
                disabled={getCurrentStock() === 0}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {getCurrentStock() === 0 ? 'Sin stock' : 'Agregar al carrito'}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => product && toggleWishlist(product.id)}
              >
                <Heart 
                  className={`h-5 w-5 mr-2 ${
                    product && isInWishlist(product.id) ? 'fill-farfalla-pink text-farfalla-pink' : ''
                  }`} 
                />
                {product && isInWishlist(product.id) ? 'En lista de deseos' : 'Agregar a lista de deseos'}
              </Button>
            </div>

            {/* Product Features */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-farfalla-teal" />
                  <span className="text-sm">Envío gratis desde $150.000</span>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-farfalla-teal" />
                  <span className="text-sm">Garantía de calidad artesanal</span>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-farfalla-teal" />
                  <span className="text-sm">Hecho a mano con amor</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Description */}
        {product.description && (
          <Card className="mb-16">
            <CardContent className="p-8">
              <h2 className="text-2xl font-poppins font-bold text-farfalla-ink mb-6">
                Descripción del Producto
              </h2>
              <div className="prose max-w-none text-muted-foreground">
                {product.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cross-selling sections */}
      {product && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <FrequentlyBoughtTogether 
            productId={product.id}
            currentProduct={{
              id: product.id,
              name: product.name,
              price: getCurrentPrice(),
              image: product.images?.[0] || '/placeholder.svg'
            }}
          />
          <ProductRecommendations productId={product.id} />
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ProductDetail;