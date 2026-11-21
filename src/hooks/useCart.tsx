import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  theme_id?: string;
  personalization_notes?: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    slug: string;
    sku?: string;
  };
  variant?: {
    id: string;
    name: string;
    price?: number;
    sku?: string;
  };
  theme?: {
    id: string;
    name: string;
  };
}

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  addToCart: (productId: string, variantId?: string, quantity?: number, themeId?: string, personalizationNotes?: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  updatePersonalization: (itemId: string, personalizationNotes: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// ---- Carrito de invitado (sin sesión): vive en localStorage ----
const GUEST_CART_KEY = 'farfalla_guest_cart_v1';

interface GuestCartEntry {
  id: string;
  product_id: string;
  variant_id?: string | null;
  theme_id?: string | null;
  quantity: number;
  personalization_notes?: string | null;
}

const readGuestCart = (): GuestCartEntry[] => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeGuestCart = (entries: GuestCartEntry[]) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(entries));
  } catch {
    // almacenamiento bloqueado (modo privado, etc.): el carrito de invitado no persistirá
  }
};

const newLocalId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Carga los datos de producto de las entradas del carrito de invitado
  const fetchGuestItems = async () => {
    const entries = readGuestCart();
    if (entries.length === 0) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const productIds = [...new Set(entries.map(e => e.product_id))];
      const variantIds = [...new Set(entries.map(e => e.variant_id).filter(Boolean))] as string[];
      const themeIds = [...new Set(entries.map(e => e.theme_id).filter(Boolean))] as string[];

      const [productsRes, variantsRes, themesRes] = await Promise.all([
        supabase.from('products').select('id, name, price, images, slug, sku').in('id', productIds),
        variantIds.length
          ? supabase.from('product_variants').select('id, name, price, sku').in('id', variantIds)
          : Promise.resolve({ data: [], error: null }),
        themeIds.length
          ? supabase.from('themes').select('id, name').in('id', themeIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (productsRes.error) throw productsRes.error;

      const products = new Map((productsRes.data || []).map(p => [p.id, p]));
      const variants = new Map((variantsRes.data || []).map((v: any) => [v.id, v]));
      const themes = new Map((themesRes.data || []).map((t: any) => [t.id, t]));

      // Se descartan productos que ya no existen o no están activos
      const valid = entries.filter(e => products.has(e.product_id));
      if (valid.length !== entries.length) writeGuestCart(valid);

      setItems(valid.map(e => {
        const p: any = products.get(e.product_id);
        const v: any = e.variant_id ? variants.get(e.variant_id) : undefined;
        const t: any = e.theme_id ? themes.get(e.theme_id) : undefined;
        return {
          id: e.id,
          product_id: e.product_id,
          variant_id: e.variant_id || undefined,
          quantity: e.quantity,
          theme_id: e.theme_id || undefined,
          personalization_notes: e.personalization_notes || undefined,
          product: { id: p.id, name: p.name, price: p.price, images: p.images || [], slug: p.slug, sku: p.sku },
          variant: v ? { id: v.id, name: v.name, price: v.price, sku: v.sku } : undefined,
          theme: t ? { id: t.id, name: t.name } : undefined,
        };
      }));
    } catch (error) {
      console.error('Error fetching guest cart:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el carrito",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch cart items from database
  const fetchCartItems = async () => {
    if (!user) {
      await fetchGuestItems();
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products:product_id (
            id,
            name,
            price,
            images,
            slug,
            sku
          ),
          product_variants:variant_id (
            id,
            name,
            price,
            sku
          ),
          themes:theme_id (
            id,
            name
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const cartItems: CartItem[] = (data || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        theme_id: item.theme_id,
        personalization_notes: item.personalization_notes,
        product: {
          id: item.products?.id || item.product_id,
          name: item.products?.name || '',
          price: item.products?.price || 0,
          images: item.products?.images || [],
          slug: item.products?.slug || '',
          sku: item.products?.sku,
        },
        variant: item.product_variants ? {
          id: item.product_variants.id || item.variant_id || '',
          name: item.product_variants.name || '',
          price: item.product_variants.price,
          sku: item.product_variants.sku,
        } : undefined,
        theme: item.themes ? {
          id: item.themes.id || item.theme_id || '',
          name: item.themes.name || '',
        } : undefined,
      }));

      setItems(cartItems);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el carrito",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (productId: string, variantId?: string, quantity = 1, themeId?: string, personalizationNotes?: string) => {
    if (!user) {
      writeGuestCart([
        ...readGuestCart(),
        {
          id: newLocalId(),
          product_id: productId,
          variant_id: variantId ?? null,
          theme_id: themeId ?? null,
          quantity,
          personalization_notes: personalizationNotes ?? null,
        },
      ]);
      await fetchGuestItems();
      toast({
        title: "Agregado al carrito",
        description: "El producto se agregó correctamente",
        variant: "success",
      });
      return;
    }

    try {
      // Add new item - each item with different personalization is separate
      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: productId,
          variant_id: variantId,
          quantity: quantity,
          theme_id: themeId,
          personalization_notes: personalizationNotes,
        });

      if (error) throw error;

      await fetchCartItems();
      toast({
        title: "Agregado al carrito",
        description: "El producto se agregó correctamente",
        variant: "success",
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el producto al carrito",
        variant: "destructive",
      });
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId: string) => {
    if (!user) {
      writeGuestCart(readGuestCart().filter(e => e.id !== itemId));
      setItems(items.filter(item => item.id !== itemId));
      toast({
        title: "Producto eliminado",
        description: "El producto se eliminó del carrito",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.filter(item => item.id !== itemId));
      toast({
        title: "Producto eliminado",
        description: "El producto se eliminó del carrito",
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto del carrito",
        variant: "destructive",
      });
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    if (!user) {
      writeGuestCart(readGuestCart().map(e => e.id === itemId ? { ...e, quantity } : e));
      setItems(items.map(item => item.id === itemId ? { ...item, quantity } : item));
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      ));
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la cantidad",
        variant: "destructive",
      });
    }
  };

  // Update item personalization
  const updatePersonalization = async (itemId: string, personalizationNotes: string) => {
    if (!user) {
      writeGuestCart(readGuestCart().map(e => e.id === itemId ? { ...e, personalization_notes: personalizationNotes } : e));
      setItems(items.map(item => item.id === itemId ? { ...item, personalization_notes: personalizationNotes } : item));
      toast({
        title: "Personalización actualizada",
        description: "Los datos de personalización han sido guardados",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ personalization_notes: personalizationNotes })
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.map(item => 
        item.id === itemId ? { ...item, personalization_notes: personalizationNotes } : item
      ));
      
      toast({
        title: "Personalización actualizada",
        description: "Los datos de personalización han sido guardados",
      });
    } catch (error) {
      console.error('Error updating personalization:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la personalización",
        variant: "destructive",
      });
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!user) {
      writeGuestCart([]);
      setItems([]);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: "Error",
        description: "No se pudo vaciar el carrito",
        variant: "destructive",
      });
    }
  };

  // Get cart total
  const getCartTotal = () => {
    return items.reduce((total, item) => {
      const price = item.variant?.price || item.product.price;
      return total + (price * item.quantity);
    }, 0);
  };

  // Get cart count
  const getCartCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  // Fetch cart items when user changes
  useEffect(() => {
    const load = async () => {
      // Al iniciar sesión, el carrito de invitado se pasa a la cuenta
      if (user) {
        const guestEntries = readGuestCart();
        if (guestEntries.length > 0) {
          writeGuestCart([]); // se vacía primero para no fusionar dos veces
          const { error } = await supabase.from('cart_items').insert(
            guestEntries.map(e => ({
              user_id: user.id,
              product_id: e.product_id,
              variant_id: e.variant_id ?? null,
              theme_id: e.theme_id ?? null,
              quantity: e.quantity,
              personalization_notes: e.personalization_notes ?? null,
            }))
          );
          if (error) {
            console.error('Error merging guest cart:', error);
            writeGuestCart(guestEntries); // se conserva para reintentar
          }
        }
      }
      await fetchCartItems();
    };
    load();
  }, [user]);

  const value = {
    items,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    updatePersonalization,
    clearCart,
    getCartTotal,
    getCartCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}