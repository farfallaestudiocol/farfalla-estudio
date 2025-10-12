import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { convertGoogleDriveUrlToBase64 } from '@/lib/googleDrive';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProductRecommendations } from "@/components/ProductRecommendations";
import { FrequentlyBoughtTogether } from "@/components/FrequentlyBoughtTogether";
import { ProductThemes } from "@/components/ProductThemes";
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  ArrowLeft, 
  Truck, 
  Shield,
  Package,
  Minus,
  Plus,
  Edit3
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ProductVariant {
  id: string;
  name: string;
  price?: number;
  sku?: string;
  stock_quantity: number;
  is_active: boolean;
  image_url?: string;
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
  const { settings } = useSiteSettings();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [displayImages, setDisplayImages] = useState<Array<{type: 'image' | 'youtube', src: string, alt: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [hasThemes, setHasThemes] = useState(false);
  const [personalizationNotes, setPersonalizationNotes] = useState('');

  // Helper function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

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
      
      // Set initial images - combine product images, variant images, and YouTube video at the end
      const allImages: Array<{type: 'image' | 'youtube', src: string, alt: string}> = [];
      
      // Add product images first
      productData.images.forEach(img => {
        allImages.push({
          type: 'image',
          src: convertGoogleDriveUrlToBase64(img),
          alt: productData.name
        });
      });
      
      // Add variant images
      if (variantsData && variantsData.length > 0) {
        variantsData.forEach(variant => {
          if (variant.image_url) {
            const convertedUrl = convertGoogleDriveUrlToBase64(variant.image_url);
            // Only add if not already in the list
            if (!allImages.some(img => img.src === convertedUrl)) {
              allImages.push({
                type: 'image',
                src: convertedUrl,
                alt: `${productData.name} - ${variant.name}`
              });
            }
          }
        });
        setSelectedVariant(variantsData[0]);
      }
      
      // Add YouTube video at the end if it exists
      if ((productData as any).youtube_url) {
        allImages.push({
          type: 'youtube',
          src: (productData as any).youtube_url,
          alt: `Video de ${productData.name}`
        });
      }
      
      setDisplayImages(allImages);

      // Check if product has themes
      const { data: themesData } = await supabase
        .from('product_themes')
        .select('id')
        .eq('product_id', productData.id)
        .limit(1);
      
      setHasThemes((themesData?.length || 0) > 0);
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


  const discountPercentage = product?.compare_price 
    ? Math.round(((product.compare_price - getCurrentPrice()) / product.compare_price) * 100)
    : 0;

  const handleAddToCart = async () => {
    if (!product) return;

    // Validate personalization notes
    if (!personalizationNotes.trim()) {
      toast({
        title: 'Personalización requerida',
        description: 'Debes agregar los datos de personalización antes de agregar al carrito',
        variant: 'destructive',
      });
      return;
    }

    // Validate theme selection if product has themes
    if (hasThemes && !selectedTheme) {
      toast({
        title: 'Selecciona un tema',
        description: 'Debes seleccionar un tema antes de agregar al carrito',
        variant: 'destructive',
      });
      return;
    }

    await addToCart(product.id, selectedVariant?.id, quantity, selectedTheme || undefined, personalizationNotes);
    
    // Reset after adding
    setQuantity(1);
    setPersonalizationNotes('');
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    
    if (newQuantity >= 1) {
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
              {displayImages.length > 0 && displayImages[selectedImageIndex] ? (
                displayImages[selectedImageIndex].type === 'youtube' ? (
                  <div className="w-full h-full">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${getYouTubeVideoId(displayImages[selectedImageIndex].src)}`}
                      title={displayImages[selectedImageIndex].alt}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </div>
                ) : (
                  <img
                    src={displayImages[selectedImageIndex].src || '/placeholder.svg'}
                    alt={displayImages[selectedImageIndex].alt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                )
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {displayImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {displayImages.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index 
                        ? 'border-farfalla-teal' 
                        : 'border-transparent'
                    }`}
                  >
                    {media.type === 'youtube' ? (
                      <div className="w-full h-full bg-black flex items-center justify-center relative">
                        <img
                          src={`https://img.youtube.com/vi/${getYouTubeVideoId(media.src)}/mqdefault.jpg`}
                          alt={media.alt}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={media.src}
                        alt={media.alt}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    )}
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
                {product.compare_price && product.compare_price > getCurrentPrice() && (
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
              {settings?.free_shipping_enabled && (
                <p className="text-sm text-farfalla-teal font-medium">
                  Envío gratis desde {formatPrice(settings.free_shipping_minimum)}
                </p>
              )}
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
                        
                        // Find the variant's image in displayImages and focus on it
                        if (variant.image_url) {
                          const convertedVariantUrl = convertGoogleDriveUrlToBase64(variant.image_url);
                          const variantImageIndex = displayImages.findIndex(img => img.src === convertedVariantUrl);
                          if (variantImageIndex !== -1) {
                            setSelectedImageIndex(variantImageIndex);
                          }
                        }
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
                    className="h-10 w-10 rounded-l-none"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-sm text-farfalla-teal font-medium">
                  Hecho bajo pedido
                </span>
              </div>
            </div>
            
            {/* Product Themes - Must be before Add to Cart */}
            {hasThemes && (
              <ProductThemes 
                productId={product.id} 
                variantId={selectedVariant?.id}
                onThemeSelect={setSelectedTheme}
                selectedThemeId={selectedTheme}
                required={true}
              />
            )}

            {/* Personalization Notes - Required */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-farfalla-teal" />
                <Label htmlFor="personalization" className="font-semibold text-farfalla-ink">
                  Personalización *
                </Label>
              </div>
              <Textarea
                id="personalization"
                placeholder="Ej: Nombre del niño/a, fecha especial, datos de contacto..."
                value={personalizationNotes}
                onChange={(e) => setPersonalizationNotes(e.target.value)}
                rows={3}
                className="resize-none"
                required
              />
              <p className="text-xs text-muted-foreground">
                * Campo obligatorio. Proporciona los detalles de la personalización que deseas para este producto.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                className="farfalla-btn-primary w-full"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Agregar al carrito
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
                {settings?.free_shipping_enabled && (
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-farfalla-teal" />
                    <span className="text-sm">Envío gratis desde {formatPrice(settings.free_shipping_minimum)}</span>
                  </div>
                )}
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