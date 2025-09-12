import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProductRecommendations } from "@/hooks/useProductRecommendations";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useToast } from "@/hooks/use-toast";

interface ProductRecommendationsProps {
  productId: string;
}

export const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({ productId }) => {
  const { recommendations, isLoading } = useProductRecommendations(productId);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = (product: any) => {
    addToCart(product.product_id, undefined, 1);
    toast({
      title: "Producto agregado",
      description: `${product.product_name} se agregó al carrito`,
    });
  };

  const toggleWishlist = (product: any) => {
    if (isInWishlist(product.product_id)) {
      removeFromWishlist(product.product_id);
    } else {
      addToWishlist(product.product_id);
    }
  };

  const getRecommendationBadgeColor = (type: string) => {
    switch (type) {
      case 'complementary': return 'bg-green-500';
      case 'upsell': return 'bg-purple-500';
      case 'frequently_bought_together': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Productos Recomendados</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="bg-gray-200 h-32 rounded mb-3"></div>
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">Productos Recomendados</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recommendations.map((product) => (
          <Card key={product.product_id} className="group hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="relative mb-3">
                <Link to={`/producto/${product.product_slug}`}>
                  <img
                    src={product.product_image || '/placeholder.svg'}
                    alt={product.product_name}
                    className="w-full h-32 object-cover rounded group-hover:scale-105 transition-transform"
                  />
                </Link>
                <Badge 
                  className={`absolute top-2 left-2 text-xs ${getRecommendationBadgeColor(product.recommendation_type)} text-white`}
                >
                  {product.reason}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 p-1 h-8 w-8"
                  onClick={() => toggleWishlist(product)}
                >
                  <Heart 
                    className={`h-4 w-4 ${
                      isInWishlist(product.product_id) 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-gray-400'
                    }`} 
                  />
                </Button>
              </div>
              
              <Link to={`/producto/${product.product_slug}`}>
                <h4 className="font-medium text-sm mb-2 line-clamp-2 text-foreground hover:text-primary">
                  {product.product_name}
                </h4>
              </Link>
              
              <p className="text-lg font-bold text-primary mb-3">
                {formatPrice(product.product_price)}
              </p>
              
              <Button
                onClick={() => handleAddToCart(product)}
                size="sm"
                className="w-full"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};