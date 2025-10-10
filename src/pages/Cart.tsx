import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useAuth } from '@/hooks/useAuth';
import { useUserAddresses } from '@/hooks/useUserAddresses';
import { supabase } from '@/integrations/supabase/client';
import { convertGoogleDriveUrlToBase64 } from '@/lib/googleDrive';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WompiWidget from '@/components/WompiWidget';
import { AddressSelector } from '@/components/AddressSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  Trash2, 
  ArrowLeft,
  Package,
  Truck,
  MessageSquare
} from 'lucide-react';

const Cart = () => {
  const { 
    items, 
    isLoading, 
    removeFromCart, 
    updateQuantity, 
    updatePersonalization,
    clearCart, 
    getCartTotal,
    getCartCount 
  } = useCart();
  
  const { settings } = useSiteSettings();
  const { user, profile } = useAuth();
  const { addresses } = useUserAddresses();
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [editingPersonalization, setEditingPersonalization] = useState<{[key: string]: string}>({});

  const formatPrice = (price: number) => {
    const currency = settings?.currency || 'COP';
    const locale = currency === 'COP' ? 'es-CO' : 'es-ES';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Calculate shipping based on settings and selected address
  const calculateShipping = () => {
    if (!settings?.shipping_enabled) return 0;
    
    const cartTotal = getCartTotal();
    const freeShippingMin = settings?.free_shipping_minimum || 0;
    
    // Check if free shipping applies
    if (settings?.free_shipping_enabled && cartTotal >= freeShippingMin) {
      return 0;
    }
    
    // Get selected address to determine shipping rate
    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    
    if (!selectedAddress) {
      // Default to outside Bogotá rate if no address selected
      return settings?.shipping_cost_outside_bogota || settings?.shipping_cost || 0;
    }
    
    // Check if address is in Bogotá
    const isBogota = selectedAddress.city?.toLowerCase().includes('bogotá') || 
                     selectedAddress.city?.toLowerCase().includes('bogota') ||
                     selectedAddress.state?.toLowerCase().includes('bogotá') ||
                     selectedAddress.state?.toLowerCase().includes('bogota');
    
    return isBogota 
      ? (settings?.shipping_cost_bogota || settings?.shipping_cost || 0)
      : (settings?.shipping_cost_outside_bogota || settings?.shipping_cost || 0);
  };

  // Calculate tax based on settings
  const calculateTax = () => {
    if (!settings?.tax_enabled) return 0;
    return Math.round(getCartTotal() * (settings?.tax_rate || 0));
  };

  const shipping = calculateShipping();
  const tax = calculateTax();
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
            <div className="lg:col-span-2 space-y-4 min-w-0">
              {items.map((item) => {
                const itemPrice = item.variant?.price || item.product.price;
                const totalPrice = itemPrice * item.quantity;
                
                return (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <Link to={`/producto/${item.product.slug}`}>
                            <img
                              src={item.product.images[0] ? convertGoogleDriveUrlToBase64(item.product.images[0]) : '/placeholder.svg'}
                              alt={item.product.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          </Link>
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0 space-y-3">
                          <div>
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
                            {item.theme && (
                              <p className="text-sm text-muted-foreground">
                                Tema: {item.theme.name}
                              </p>
                            )}
                            <p className="text-lg font-poppins font-semibold text-farfalla-ink">
                              {formatPrice(itemPrice)}
                            </p>
                          </div>

                          {/* Personalization */}
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">
                              Personalización:
                            </Label>
                            <Textarea
                              value={editingPersonalization[item.id] ?? item.personalization_notes ?? ''}
                              onChange={(e) => setEditingPersonalization({
                                ...editingPersonalization,
                                [item.id]: e.target.value
                              })}
                              onBlur={() => {
                                if (editingPersonalization[item.id] !== undefined && 
                                    editingPersonalization[item.id] !== item.personalization_notes) {
                                  updatePersonalization(item.id, editingPersonalization[item.id]);
                                }
                              }}
                              placeholder="Detalles de personalización..."
                              rows={2}
                              className="resize-none text-sm"
                            />
                          </div>
                        </div>

                        {/* Right side - Quantity and Price */}
                        <div className="flex flex-col items-end gap-3">
                          {/* Quantity Controls */}
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
            <div className="lg:col-span-1 min-w-0">
              <Card className="sticky top-8 overflow-hidden">
                <CardContent className="p-6 space-y-6 w-full overflow-hidden">
                  <h2 className="text-xl font-poppins font-bold text-farfalla-ink">
                    Resumen del Pedido
                  </h2>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Subtotal ({getCartCount()} productos)</span>
                        <span>{formatPrice(getCartTotal())}</span>
                      </div>

                      {settings?.shipping_enabled && (
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <span>Envío</span>
                            {selectedAddressId && (
                              <span className="text-xs text-muted-foreground">
                                {(() => {
                                  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
                                  const isBogota = selectedAddress?.city?.toLowerCase().includes('bogotá') || 
                                                   selectedAddress?.city?.toLowerCase().includes('bogota') ||
                                                   selectedAddress?.state?.toLowerCase().includes('bogotá') ||
                                                   selectedAddress?.state?.toLowerCase().includes('bogota');
                                  return isBogota ? 
                                    `Tarifa Bogotá` : 
                                    `Tarifa Nacional`;
                                })()}
                              </span>
                            )}
                          </div>
                          <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
                            {shipping === 0 ? 'Gratis' : formatPrice(shipping)}
                          </span>
                        </div>
                      )}

                      {settings?.tax_enabled && tax > 0 && (
                        <div className="flex justify-between">
                          <span>IVA ({Math.round((settings?.tax_rate || 0) * 100)}%)</span>
                          <span>{formatPrice(tax)}</span>
                        </div>
                      )}

                      {settings?.free_shipping_enabled && shipping === 0 && getCartTotal() >= (settings?.free_shipping_minimum || 0) && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Truck className="h-4 w-4" />
                          <span>¡Envío gratis aplicado!</span>
                        </div>
                      )}

                      {settings?.free_shipping_enabled && shipping > 0 && (
                        <div className="text-sm text-muted-foreground">
                          Agrega {formatPrice((settings?.free_shipping_minimum || 0) - getCartTotal())} más para envío gratis
                        </div>
                      )}

                      <Separator />

                      <div className="flex justify-between text-lg font-poppins font-bold">
                        <span>Total</span>
                        <span className="text-farfalla-ink">{formatPrice(finalTotal)}</span>
                      </div>
                    </div>

                    {/* Address Selection */}
                    <div className="w-full min-w-0">
                      <AddressSelector
                        selectedAddressId={selectedAddressId}
                        onAddressSelect={setSelectedAddressId}
                        required={true}
                      />
                    </div>

                    {/* Order Notes */}
                    <div className="w-full space-y-2">
                      <Label htmlFor="order-notes" className="flex items-center gap-2 text-sm font-medium">
                        <MessageSquare className="h-4 w-4" />
                        Notas o instrucciones especiales
                      </Label>
                      <Textarea
                        id="order-notes"
                        placeholder="Indícanos que personalización deseas para tus productos"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        rows={3}
                        className="resize-none w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Opcional: Agrega cualquier instrucción especial para tu pedido
                      </p>
                    </div>

                  {/* Wompi Payment Widget */}
                  <div className="w-full">
                    {!user && (
                      <div className="mb-4 p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          Debes iniciar sesión para continuar
                        </p>
                        <Link to="/auth">
                          <Button variant="outline" size="sm">
                            Iniciar Sesión
                          </Button>
                        </Link>
                      </div>
                    )}
                    
                    {user && !selectedAddressId && (
                      <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
                        
                          Selecciona una dirección de entrega para continuar
                       
                      </div>
                    )}

                    {user && selectedAddressId ? (
                      <WompiWidget 
                        amount={finalTotal}
                        currency={settings?.currency || 'COP'}
                        customerEmail={user?.email || ''}
                        customerName={profile?.full_name}
                        onSuccess={async (result) => {
                        console.log('Payment successful:', result);
                        
                        try {
                           // Create order with cart items
                          const orderItems = items.map(item => ({
                            product_id: item.product.id,
                            variant_id: item.variant?.id,
                            quantity: item.quantity,
                            unit_price: item.variant?.price || item.product.price,
                            product_name: item.product.name,
                            variant_name: item.variant?.name,
                            product_sku: item.variant?.sku || item.product.sku,
                            theme_id: item.theme_id,
                            theme_name: item.theme?.name,
                            personalization_notes: item.personalization_notes
                          }));

                          // Get selected address
                          const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);

                          // Create order data
                          const orderData = {
                            customer_email: user?.email || '',
                            customer_name: profile?.full_name || user?.email || '',
                            customer_phone: selectedAddress?.phone || '',
                            shipping_address: selectedAddress ? {
                              name: selectedAddress.name,
                              full_address: selectedAddress.full_address,
                              street_address: selectedAddress.street_address,
                              city: selectedAddress.city,
                              state: selectedAddress.state,
                              postal_code: selectedAddress.postal_code,
                              country: selectedAddress.country,
                              phone: selectedAddress.phone,
                              latitude: selectedAddress.latitude,
                              longitude: selectedAddress.longitude
                            } : null,
                            billing_address: selectedAddress ? {
                              name: selectedAddress.name,
                              full_address: selectedAddress.full_address,
                              street_address: selectedAddress.street_address,
                              city: selectedAddress.city,
                              state: selectedAddress.state,
                              postal_code: selectedAddress.postal_code,
                              country: selectedAddress.country,
                              phone: selectedAddress.phone,
                              latitude: selectedAddress.latitude,
                              longitude: selectedAddress.longitude
                            } : null,
                            items: orderItems,
                            shipping_amount: shipping,
                            tax_amount: tax,
                            discount_amount: 0,
                            currency: settings?.currency || 'COP',
                            payment_method: 'wompi',
                            payment_reference: result.transaction?.id || '',
                            notes: orderNotes.trim()
                          };

                          // Call create order function
                          const { data: createOrderData } = await supabase.functions.invoke('create-order', {
                            body: orderData
                          });

                          if (createOrderData?.success) {
                            toast.success('¡Pedido creado exitosamente!');
                            // Clear cart (will be done by the edge function if user is authenticated)
                            clearCart();
                            // Redirect to order success page or orders list
                            window.location.href = '/mis-pedidos';
                          } else {
                            toast.error('Error al crear el pedido');
                          }
                        } catch (error) {
                          console.error('Error creating order:', error);
                          toast.error('Error al procesar el pedido');
                        }
                        }}
                        onError={(error) => {
                          console.log('Payment error:', error);
                        }}
                      />
                    ) : (
                      <Card>
                        <CardContent className="p-6 text-center">
                          <div className="text-muted-foreground">
                            <p className="mb-2">Complete los pasos anteriores para continuar con el pago</p>
                            <div className="text-sm space-y-1">
                              {!user && <p>• Inicia sesión</p>}
                              {user && !selectedAddressId && <p>• Selecciona una dirección de entrega</p>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                  </div>

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