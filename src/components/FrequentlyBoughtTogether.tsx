import React from "react";
import { Link } from "react-router-dom";
import { Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFrequentlyBoughtTogether } from "@/hooks/useProductRecommendations";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";

interface FrequentlyBoughtTogetherProps {
  productId: string;
  currentProduct: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
}

export const FrequentlyBoughtTogether: React.FC<FrequentlyBoughtTogetherProps> = ({ 
  productId, 
  currentProduct 
}) => {
  const { products, isLoading } = useFrequentlyBoughtTogether(productId);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const addAllToCart = () => {
    // Add current product
    addToCart(currentProduct.id, undefined, 1);
    
    // Add all recommended products
    products.forEach(product => {
      addToCart(product.product_id, undefined, 1);
    });

    toast({
      title: "Productos agregados",
      description: `Se agregaron ${products.length + 1} productos al carrito`,
    });
  };

  const getTotalPrice = () => {
    const recommendedTotal = products.reduce((sum, product) => sum + product.product_price, 0);
    return currentProduct.price + recommendedTotal;
  };

  if (isLoading || products.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          Frecuentemente Comprado Junto
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Los clientes que compraron este producto también eligieron:
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Current Product */}
          <div className="flex flex-col items-center">
            <img
              src={currentProduct.image}
              alt={currentProduct.name}
              className="w-16 h-16 object-cover rounded border-2 border-primary"
            />
            <p className="text-xs text-center mt-1 max-w-16 line-clamp-2">
              {currentProduct.name}
            </p>
            <p className="text-sm font-bold text-primary">
              {formatPrice(currentProduct.price)}
            </p>
          </div>

          {/* Plus Icon */}
          <Plus className="h-5 w-5 text-gray-400" />

          {/* Recommended Products */}
          {products.slice(0, 3).map((product, index) => (
            <React.Fragment key={product.product_id}>
              <Link 
                to={`/producto/${product.product_slug}`}
                className="flex flex-col items-center hover:opacity-80 transition-opacity"
              >
                <img
                  src={product.product_image || '/placeholder.svg'}
                  alt={product.product_name}
                  className="w-16 h-16 object-cover rounded border"
                />
                <p className="text-xs text-center mt-1 max-w-16 line-clamp-2">
                  {product.product_name}
                </p>
                <p className="text-sm font-bold text-primary">
                  {formatPrice(product.product_price)}
                </p>
              </Link>
              {index < products.slice(0, 3).length - 1 && (
                <Plus className="h-4 w-4 text-gray-400" />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Total del conjunto:</span>
            <span className="text-lg font-bold text-primary">
              {formatPrice(getTotalPrice())}
            </span>
          </div>
          <Button onClick={addAllToCart} className="w-full" size="lg">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Agregar Todo al Carrito
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};