import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface ProductCardProps {
  id: string;
  name: string;
  slug?: string;
  price: number;
  comparePrice?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  badge?: {
    text: string;
    type: "promo" | "envio" | "nuevo";
  };
  isWishlisted?: boolean;
  onAddToCart?: () => void;
  onToggleWishlist?: () => void;
}

const ProductCard = ({
  id,
  name,
  slug,
  price,
  comparePrice,
  image,
  rating = 4.5,
  reviewCount = 0,
  badge,
  isWishlisted = false,
  onAddToCart,
  onToggleWishlist,
}: ProductCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const discountPercentage = comparePrice 
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  const productUrl = slug ? `/producto/${slug}` : `/producto/${id}`;

  return (
    <Link to={productUrl} className="farfalla-card group cursor-pointer block">
      {/* Product Image */}
      <div className="relative overflow-hidden rounded-xl mb-4">
        <img
          src={image}
          alt={name}
          className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {badge && (
            <Badge 
              className={
                badge.type === "promo" ? "farfalla-badge-promo" :
                badge.type === "envio" ? "farfalla-badge-envio" :
                "bg-farfalla-ink text-white"
              }
            >
              {badge.text}
            </Badge>
          )}
          {discountPercentage > 0 && (
            <Badge className="farfalla-badge-promo">
              -{discountPercentage}%
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm hover:bg-white"
          onClick={(e) => {
            e.preventDefault();
            onToggleWishlist?.();
          }}
        >
          <Heart 
            className={`h-4 w-4 ${isWishlisted ? 'fill-farfalla-pink text-farfalla-pink' : 'text-farfalla-ink'}`} 
          />
        </Button>

        {/* Quick Add to Cart - appears on hover */}
        <div className="absolute bottom-3 left-3 right-3 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <Button
            className="farfalla-btn-primary w-full"
            onClick={(e) => {
              e.preventDefault();
              onAddToCart?.();
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Agregar al carrito
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        {/* Rating */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(rating) 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({reviewCount})
            </span>
          </div>
        )}

        {/* Product Name */}
        <h3 className="font-poppins font-medium text-farfalla-ink line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-poppins font-semibold text-farfalla-ink">
            {formatPrice(price)}
          </span>
          {comparePrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(comparePrice)}
            </span>
          )}
        </div>

        {/* Free Shipping */}
        <div className="text-xs text-primary font-medium">
          Envío gratis desde $150.000
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;