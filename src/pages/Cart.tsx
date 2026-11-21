import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartItemCard } from '@/components/cart/CartItemCard';
import { CheckoutSection } from '@/components/cart/CheckoutSection';
import { OrderTotals } from '@/components/cart/OrderTotals';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { useCheckout } from '@/hooks/useCheckout';

const Cart = () => {
  const { items, isLoading, removeFromCart, updateQuantity, updatePersonalization, clearCart, getCartCount } = useCart();
  const checkout = useCheckout();
  const { settings, totals, address } = checkout;

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
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-muted-foreground hover:text-farfalla-teal transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continuar comprando
          </Link>
          <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">Carrito de Compras</h1>
          <p className="text-muted-foreground mt-2">
            {getCartCount()} {getCartCount() === 1 ? 'producto' : 'productos'} en tu carrito
          </p>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-poppins font-bold text-farfalla-ink mb-4">Tu carrito está vacío</h2>
              <p className="text-muted-foreground mb-6">Agrega algunos productos para empezar a comprar</p>
              <Link to="/">
                <Button className="farfalla-btn-primary">Explorar Productos</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4 min-w-0">
              {items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  currency={settings?.currency || 'COP'}
                  onQuantityChange={updateQuantity}
                  onRemove={removeFromCart}
                  onPersonalizationChange={updatePersonalization}
                />
              ))}

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

            <div className="lg:col-span-1 min-w-0">
              <Card className="sticky top-8 overflow-hidden">
                <CardContent className="p-6 space-y-6 w-full overflow-hidden">
                  <h2 className="text-xl font-poppins font-bold text-farfalla-ink">Resumen del Pedido</h2>
                  {settings && totals && (
                    <OrderTotals totals={totals} settings={settings} itemCount={getCartCount()} hasAddress={!!address} />
                  )}
                  <CheckoutSection checkout={checkout} />
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
