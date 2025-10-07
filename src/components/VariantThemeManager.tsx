import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { convertGoogleDriveUrlToBase64 } from '@/lib/googleDrive';
import { Palette, Save, Loader2 } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
}

interface VariantThemeManagerProps {
  productId: string;
  variantId: string;
  variantName?: string;
}

export const VariantThemeManager = ({ productId, variantId, variantName }: VariantThemeManagerProps) => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchThemes();
    fetchVariantThemes();
  }, [variantId]);

  const fetchThemes = async () => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('is_active', true)
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
    }
  };

  const fetchVariantThemes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_themes')
        .select('theme_id')
        .eq('product_id', productId)
        .eq('variant_id', variantId);

      if (error) throw error;

      const themeIds = new Set<string>(data?.map(pt => pt.theme_id) || []);
      setSelectedThemes(themeIds);
    } catch (error) {
      console.error('Error fetching variant themes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (themeId: string, checked: boolean) => {
    const newSelected = new Set(selectedThemes);
    if (checked) {
      newSelected.add(themeId);
    } else {
      newSelected.delete(themeId);
    }
    setSelectedThemes(newSelected);
  };

  const saveThemeAssignments = async () => {
    try {
      setSaving(true);

      // Delete existing assignments for this variant
      const { error: deleteError } = await supabase
        .from('product_themes')
        .delete()
        .eq('product_id', productId)
        .eq('variant_id', variantId);

      if (deleteError) throw deleteError;

      // Insert new assignments
      if (selectedThemes.size > 0) {
        const assignments = Array.from(selectedThemes).map(themeId => ({
          product_id: productId,
          theme_id: themeId,
          variant_id: variantId,
        }));

        const { error: insertError } = await supabase
          .from('product_themes')
          .insert(assignments);

        if (insertError) throw insertError;
      }

      toast({
        title: 'Éxito',
        description: 'Temas asignados correctamente',
      });
    } catch (error) {
      console.error('Error saving theme assignments:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los temas',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-farfalla-teal" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="farfalla-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-farfalla-teal" />
          <CardTitle>Asignar Temas a la Variante</CardTitle>
        </div>
        <CardDescription>
          {variantName ? `Selecciona los temas disponibles para la variante "${variantName}"` : 'Selecciona los temas disponibles para esta variante'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {themes.map((theme) => (
            <div key={theme.id} className="flex items-start space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={`theme-${theme.id}`}
                checked={selectedThemes.has(theme.id)}
                onCheckedChange={(checked) => 
                  handleThemeChange(theme.id, checked as boolean)
                }
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <label 
                    htmlFor={`theme-${theme.id}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {theme.name}
                  </label>
                </div>
                {theme.description && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {theme.description}
                  </p>
                )}
                {theme.image_url && (
                  <img
                    src={convertGoogleDriveUrlToBase64(theme.image_url)}
                    alt={theme.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={saveThemeAssignments}
            disabled={saving}
            className="farfalla-btn-primary"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Temas
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
