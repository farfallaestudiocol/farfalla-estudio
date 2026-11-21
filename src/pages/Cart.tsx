import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import CheckoutForm from '@/components/CheckoutForm';
import {
  CheckoutAddress,
  CheckoutCustomer,
  buildOrderPayload,
  clearPendingCheckout,
  emptyAddress,
  emptyCustomer,
  savePendingCheckout,
  submitOrder,
  validateCheckout,
} from '@/lib/checkout';
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
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CheckoutCustomer>(emptyCustomer);
  const [guestAddress, setGuestAddress] = useState<CheckoutAddress>(emptyAddress);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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

  // Dirección de entrega según el tipo de comprador
  const getEffectiveAddress = (): CheckoutAddress | null => {
    if (user) {
      const a = addresses.find(addr => addr.id === selectedAddressId);
      if (!a) return null;
      return {
        name: a.name,
        full_address: a.full_address,
        street_address: a.street_address,
        city: a.city,
        state: a.state,
        postal_code: a.postal_code || undefined,
        country: a.country,
        phone: a.phone || undefined,
        latitude: a.latitude,
        longitude: a.longitude,
      };
    }
    return guestAddress;
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
    
    // Dirección efectiva: la guardada (usuario con sesión) o la escrita en el formulario (invitado)
    const effectiveAddress = getEffectiveAddress();
    
    if (!effectiveAddress || (!effectiveAddress.city && !effectiveAddress.state)) {
      // Sin dirección aún: tarifa fuera de Bogotá por defecto
      return settings?.shipping_cost_outside_bogota || settings?.shipping_cost || 0;
    }
    
    // Check if address is in Bogotá
    const isBogota = /bogot[aá]/i.test(effectiveAddress.city || '') ||
                     /bogot[aá]/i.test(effectiveAddress.state || '');
    
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

  const effectiveAddress = getEffectiveAddress();
  const missingFields = validateCheckout(customer, effectiveAddress, acceptedTerms);
  const orderPayload = missingFields.length === 0 && effectiveAddress
    ? buildOrderPayload(items, customer, effectiveAddress, orderNotes)
    : null;

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

                    {/* Datos del comprador (con o sin cuenta) */}
                    <CheckoutForm
                      customer={customer}
                      onCustomerChange={setCustomer}
                      showAddress={!user}
                      address={guestAddress}
                      onAddressChange={setGuestAddress}
                      acceptedTerms={acceptedTerms}
                      onAcceptedTermsChange={setAcceptedTerms}
                    />

                    {/* Address Selection (usuarios con sesión: direcciones guardadas) */}
                    {user && (
                      <div className="w-full min-w-0">
                        <AddressSelector
                          selectedAddressId={selectedAddressId}
                          onAddressSelect={setSelectedAddressId}
                          required={true}
                        />
                      </div>
                    )}

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
                    {missingFields.length > 0 ? (
                      <Card>
                        <CardContent className="p-6 text-center">
                          <div className="text-muted-foreground">
                            <p className="mb-2">Completa estos datos para continuar con el pago</p>
                            <div className="text-sm space-y-1">
                              {missingFields.map(f => <p key={f}>• {f}</p>)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <WompiWidget
                        amount={finalTotal}
                        currency={settings?.currency || 'COP'}
                        customerEmail={customer.email.trim()}
                        customerName={customer.name.trim()}
                        onBeforeOpen={() => {
                          // Si el pago termina en otra página (PSE, etc.), /payment-result lo retoma
                          if (orderPayload) savePendingCheckout(orderPayload);
                        }}
                        onSuccess={async (result) => {
                          const reference = result.transaction?.id;
                          if (!orderPayload || !reference) {
                            toast.error('No se pudo registrar el pedido. Contacta a soporte con tu ID de transacción.');
                            return;
                          }
                          const { order, error } = await submitOrder(orderPayload, reference);
                          if (error || !order) {
                            toast.error(`${error || 'Error al crear el pedido'}. Tu pago fue aprobado; contacta a soporte con el ID de transacción ${reference}.`);
                            return;
                          }
                          clearPendingCheckout();
                          toast.success('¡Pedido creado exitosamente!');
                          await clearCart();
                          // Invitados: página de seguimiento con su enlace secreto
                          navigate(
                            user || !order.access_token
                              ? '/mis-pedidos'
                              : `/pedido/seguimiento?token=${order.access_token}`
                          );
                        }}
                        onError={(error) => {
                          console.log('Payment error:', error);
                        }}
                      />
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