import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface WishlistItem {
  id: string;
  product_id: string;
  product: {
    name: string;
    price: number;
    compare_price?: number;
    images: string[];
    slug: string;
    rating: number;
    review_count: number;
  };
}

interface WishlistContextType {
  items: WishlistItem[];
  isLoading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  getWishlistCount: () => number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch wishlist items from database
  const fetchWishlistItems = async () => {
    if (!user) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select(`
          *,
          products:product_id (
            name,
            price,
            compare_price,
            images,
            slug,
            rating,
            review_count
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const wishlistItems: WishlistItem[] = (data || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        product: {
          name: item.products?.name || '',
          price: item.products?.price || 0,
          compare_price: item.products?.compare_price,
          images: item.products?.images || [],
          slug: item.products?.slug || '',
          rating: item.products?.rating || 0,
          review_count: item.products?.review_count || 0,
        },
      }));

      setItems(wishlistItems);
    } catch (error) {
      console.error('Error fetching wishlist items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add item to wishlist
  const addToWishlist = async (productId: string) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para agregar productos a la lista de deseos",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('wishlist_items')
        .insert({
          user_id: user.id,
          product_id: productId,
        });

      if (error) throw error;

      await fetchWishlistItems();
      toast({
        title: "Agregado a favoritos",
        description: "El producto se agregó a tu lista de deseos",
      });
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el producto a la lista de deseos",
        variant: "destructive",
      });
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('user_id', user?.id)
        .eq('product_id', productId);

      if (error) throw error;

      setItems(items.filter(item => item.product_id !== productId));
      toast({
        title: "Eliminado de favoritos",
        description: "El producto se eliminó de tu lista de deseos",
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto de la lista de deseos",
        variant: "destructive",
      });
    }
  };

  // Toggle item in wishlist
  const toggleWishlist = async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  // Check if item is in wishlist
  const isInWishlist = (productId: string) => {
    return items.some(item => item.product_id === productId);
  };

  // Get wishlist count
  const getWishlistCount = () => {
    return items.length;
  };

  // Fetch wishlist items when user changes
  useEffect(() => {
    fetchWishlistItems();
  }, [user]);

  const value = {
    items,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    getWishlistCount,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}