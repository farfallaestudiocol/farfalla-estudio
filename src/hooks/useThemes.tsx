import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Theme {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ThemeElement {
  id: string;
  theme_id: string;
  name: string;
  description?: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useThemes = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [themeElements, setThemeElements] = useState<ThemeElement[]>([]);
  const [loading, setLoading] = useState(true);

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
      toast.error('No se pudieron cargar los temas');
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
      toast.success('Tema creado correctamente');
      return data;
    } catch (error) {
      console.error('Error creating theme:', error);
      toast.error('No se pudo crear el tema');
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
      toast.success('Tema actualizado correctamente');
      return data;
    } catch (error) {
      console.error('Error updating theme:', error);
      toast.error('No se pudo actualizar el tema');
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
      toast.success('Tema eliminado correctamente');
    } catch (error) {
      console.error('Error deleting theme:', error);
      toast.error('No se pudo eliminar el tema');
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
      toast.success(`${data.length} temas creados correctamente`);
      return data;
    } catch (error) {
      console.error('Error bulk creating themes:', error);
      toast.error('No se pudieron crear los temas masivamente');
      throw error;
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemeElements = async (themeId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('theme_elements')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (themeId) {
        query = query.eq('theme_id', themeId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setThemeElements(data || []);
    } catch (error) {
      console.error('Error fetching theme elements:', error);
      toast.error('Error al cargar elementos del tema');
    } finally {
      setLoading(false);
    }
  };

  const createThemeElement = async (elementData: Omit<ThemeElement, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('theme_elements')
        .insert([elementData])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Elemento del tema creado exitosamente');
      fetchThemeElements();
      return data;
    } catch (error) {
      console.error('Error creating theme element:', error);
      toast.error('Error al crear elemento del tema');
      throw error;
    }
  };

  const updateThemeElement = async (id: string, elementData: Partial<ThemeElement>) => {
    try {
      const { data, error } = await supabase
        .from('theme_elements')
        .update(elementData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Elemento del tema actualizado exitosamente');
      fetchThemeElements();
      return data;
    } catch (error) {
      console.error('Error updating theme element:', error);
      toast.error('Error al actualizar elemento del tema');
      throw error;
    }
  };

  const deleteThemeElement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('theme_elements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Elemento del tema eliminado exitosamente');
      fetchThemeElements();
    } catch (error) {
      console.error('Error deleting theme element:', error);
      toast.error('Error al eliminar elemento del tema');
      throw error;
    }
  };

  const bulkCreateThemeElements = async (elementsData: Omit<ThemeElement, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      const { data, error } = await supabase
        .from('theme_elements')
        .insert(elementsData)
        .select();

      if (error) throw error;

      setThemeElements(prev => [...prev, ...data]);
      toast.success(`${data.length} elementos creados correctamente`);
      return data;
    } catch (error) {
      console.error('Error bulk creating theme elements:', error);
      toast.error('No se pudieron crear los elementos masivamente');
      throw error;
    }
  };

  return {
    themes,
    themeElements,
    loading,
    fetchThemes,
    createTheme,
    updateTheme,
    deleteTheme,
    bulkCreateThemes,
    fetchThemeElements,
    createThemeElement,
    updateThemeElement,
    deleteThemeElement,
    bulkCreateThemeElements,
  };
};