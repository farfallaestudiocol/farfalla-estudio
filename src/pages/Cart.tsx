import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  Trash2, 
  ArrowLeft,
  Package,
  Truck
} from 'lucide-react';

const Cart = () => {
  const { 
    items, 
    isLoading, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal,
    getCartCount 
  } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const shipping = getCartTotal() >= 150000 ? 0 : 15000;
  const tax = Math.round(getCartTotal() * 0.19); // 19% IVA
  const finalTotal = getCartTotal() + shipping + tax;

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="min-h-screen farfalla-section-gradient flex items-center justify-center">
          <div className="text-center">
            <ShoppingCart className="h-12 w-12 animate-pulse text-farfalla-teal mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando carrito...</p>
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
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-muted-foreground hover:text-farfalla-teal transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continuar comprando
          </Link>
          <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
            Carrito de Compras
          </h1>
          <p className="text-muted-foreground mt-2">
            {getCartCount()} {getCartCount() === 1 ? 'producto' : 'productos'} en tu carrito
          </p>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-poppins font-bold text-farfalla-ink mb-4">
                Tu carrito está vacío
              </h2>
              <p className="text-muted-foreground mb-6">
                Agrega algunos productos para empezar a comprar
              </p>
              <Link to="/">
                <Button className="farfalla-btn-primary">
                  Explorar Productos
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const itemPrice = item.variant?.price || item.product.price;
                const totalPrice = itemPrice * item.quantity;
                
                return (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <Link to={`/producto/${item.product.slug}`}>
                            <img
                              src={item.product.images[0] || '/placeholder.svg'}
                              alt={item.product.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          </Link>
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={`/producto/${item.product.slug}`}
                            className="hover:text-farfalla-teal transition-colors"
                          >
                            <h3 className="font-poppins font-semibold text-farfalla-ink truncate">
                              {item.product.name}
                            </h3>
                          </Link>
                          {item.variant && (
                            <p className="text-sm text-muted-foreground">
                              Variante: {item.variant.name}
                            </p>
                          )}
                          <p className="text-lg font-poppins font-semibold text-farfalla-ink">
                            {formatPrice(itemPrice)}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-border rounded-lg">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="h-8 w-8 rounded-r-none"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="px-3 py-1 text-sm font-medium min-w-12 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-8 w-8 rounded-l-none"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Total Price */}
                        <div className="text-right">
                          <p className="font-poppins font-semibold text-farfalla-ink">
                            {formatPrice(totalPrice)}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Clear Cart */}
              <div className="text-right">
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Vaciar Carrito
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardContent className="p-6">
                  <h2 className="text-xl font-poppins font-bold text-farfalla-ink mb-4">
                    Resumen del Pedido
                  </h2>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal ({getCartCount()} productos)</span>
                      <span>{formatPrice(getCartTotal())}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Envío</span>
                      <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
                        {shipping === 0 ? 'Gratis' : formatPrice(shipping)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>IVA (19%)</span>
                      <span>{formatPrice(tax)}</span>
                    </div>

                    {shipping === 0 && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Truck className="h-4 w-4" />
                        <span>¡Envío gratis aplicado!</span>
                      </div>
                    )}

                    {shipping > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Agrega {formatPrice(150000 - getCartTotal())} más para envío gratis
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between text-lg font-poppins font-bold">
                      <span>Total</span>
                      <span className="text-farfalla-ink">{formatPrice(finalTotal)}</span>
                    </div>
                  </div>

                  <Button className="farfalla-btn-primary w-full mt-6">
                    <Package className="h-5 w-5 mr-2" />
                    Proceder al Pago
                  </Button>

                  <div className="mt-4 text-xs text-muted-foreground text-center">
                    Pago seguro con Wompi
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Cart;