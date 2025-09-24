import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Theme {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useThemes = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchThemes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('name');

      if (error) throw error;
      setThemes(data || []);
    } catch (error) {
      console.error('Error fetching themes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los temas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createTheme = async (themeData: Omit<Theme, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .insert([themeData])
        .select()
        .single();

      if (error) throw error;

      setThemes(prev => [data, ...prev]);
      toast({
        title: 'Éxito',
        description: 'Tema creado correctamente',
      });
      return data;
    } catch (error) {
      console.error('Error creating theme:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el tema',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateTheme = async (id: string, themeData: Partial<Theme>) => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .update(themeData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setThemes(prev => prev.map(theme => theme.id === id ? data : theme));
      toast({
        title: 'Éxito',
        description: 'Tema actualizado correctamente',
      });
      return data;
    } catch (error) {
      console.error('Error updating theme:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el tema',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteTheme = async (id: string) => {
    try {
      const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setThemes(prev => prev.filter(theme => theme.id !== id));
      toast({
        title: 'Éxito',
        description: 'Tema eliminado correctamente',
      });
    } catch (error) {
      console.error('Error deleting theme:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el tema',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const bulkCreateThemes = async (themesData: Omit<Theme, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .insert(themesData)
        .select();

      if (error) throw error;

      setThemes(prev => [...data, ...prev]);
      toast({
        title: 'Éxito',
        description: `${data.length} temas creados correctamente`,
      });
      return data;
    } catch (error) {
      console.error('Error bulk creating themes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron crear los temas masivamente',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  return {
    themes,
    loading,
    fetchThemes,
    createTheme,
    updateTheme,
    deleteTheme,
    bulkCreateThemes,
  };
};