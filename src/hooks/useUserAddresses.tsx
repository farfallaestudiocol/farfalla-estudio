import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UserAddress {
  id: string;
  user_id: string;
  name: string;
  full_address: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  is_primary: boolean;
  place_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateAddressData {
  name: string;
  full_address: string;
  street_address: string;
  city: string;
  state: string;
  postal_code?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  is_primary?: boolean;
  place_id?: string;
}

export function useUserAddresses() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user addresses
  const fetchAddresses = async () => {
    if (!user) {
      setAddresses([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las direcciones",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create new address
  const createAddress = async (addressData: CreateAddressData): Promise<UserAddress | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para guardar direcciones",
        variant: "destructive"
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .insert({
          user_id: user.id,
          ...addressData
        })
        .select()
        .single();

      if (error) throw error;

      setAddresses(prev => [data, ...prev]);
      
      toast({
        title: "Éxito",
        description: "Dirección guardada correctamente"
      });

      return data;
    } catch (error) {
      console.error('Error creating address:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la dirección",
        variant: "destructive"
      });
      return null;
    }
  };

  // Update address
  const updateAddress = async (id: string, addressData: Partial<CreateAddressData>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .update(addressData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setAddresses(prev => 
        prev.map(addr => addr.id === id ? data : addr)
      );

      toast({
        title: "Éxito",
        description: "Dirección actualizada correctamente"
      });

      return true;
    } catch (error) {
      console.error('Error updating address:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la dirección",
        variant: "destructive"
      });
      return false;
    }
  };

  // Delete address
  const deleteAddress = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setAddresses(prev => prev.filter(addr => addr.id !== id));

      toast({
        title: "Éxito",
        description: "Dirección eliminada correctamente"
      });

      return true;
    } catch (error) {
      console.error('Error deleting address:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la dirección",
        variant: "destructive"
      });
      return false;
    }
  };

  // Set primary address
  const setPrimaryAddress = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .update({ is_primary: true })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state to reflect the change
      setAddresses(prev => 
        prev.map(addr => ({
          ...addr,
          is_primary: addr.id === id
        }))
      );

      toast({
        title: "Éxito",
        description: "Dirección principal actualizada"
      });

      return true;
    } catch (error) {
      console.error('Error setting primary address:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la dirección principal",
        variant: "destructive"
      });
      return false;
    }
  };

  // Get primary address
  const getPrimaryAddress = (): UserAddress | null => {
    return addresses.find(addr => addr.is_primary) || addresses[0] || null;
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  return {
    addresses,
    isLoading,
    createAddress,
    updateAddress,
    deleteAddress,
    setPrimaryAddress,
    getPrimaryAddress,
    refreshAddresses: fetchAddresses
  };
}