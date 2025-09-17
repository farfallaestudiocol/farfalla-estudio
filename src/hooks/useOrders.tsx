import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface OrderItem {
  id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  variant_name?: string;
  product_sku?: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  payment_reference?: string;
  total_amount: number;
  shipping_amount: number;
  tax_amount: number;
  discount_amount: number;
  currency: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  shipping_address?: any;
  billing_address?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchOrders = async () => {
    if (!user) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOrder = useCallback(async (orderId: string): Promise<Order | null> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('id', orderId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }, []);

  const createOrder = async (orderData: any) => {
    try {
      const authToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: orderData,
        headers: authToken ? {
          Authorization: `Bearer ${authToken}`
        } : undefined
      });

      if (error) throw error;
      
      // Refresh orders after creating
      if (data.success) {
        await fetchOrders();
      }
      
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  // Set up real-time subscription for orders
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Order updated:', payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    orders,
    isLoading,
    fetchOrders,
    getOrder,
    createOrder
  };
};