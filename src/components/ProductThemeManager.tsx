import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { convertGoogleDriveUrlToBase64 } from '@/lib/googleDrive';
import { Palette, Save, Loader2 } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
}

interface ProductVariant {
  id: string;
  name: string;
}

interface ProductThemeManagerProps {
  productId: string;
  variants?: ProductVariant[];
}

interface ProductThemeAssignment {
  product_id: string;
  theme_id: string;
  variant_id?: string;
}

export const ProductThemeManager = ({ productId, variants = [] }: ProductThemeManagerProps) => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set());
  const [variantThemes, setVariantThemes] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchThemes();
    fetchProductThemes();
  }, [productId]);

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

  const fetchProductThemes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_themes')
        .select('theme_id, variant_id')
        .eq('product_id', productId);

      if (error) throw error;

      const productThemeIds = new Set<string>();
      const variantThemeMap: Record<string, Set<string>> = {};

      data?.forEach((pt) => {
        if (!pt.variant_id) {
          productThemeIds.add(pt.theme_id);
        } else {
          if (!variantThemeMap[pt.variant_id]) {
            variantThemeMap[pt.variant_id] = new Set();
          }
          variantThemeMap[pt.variant_id].add(pt.theme_id);
        }
      });

      setSelectedThemes(productThemeIds);
      setVariantThemes(variantThemeMap);
    } catch (error) {
      console.error('Error fetching product themes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductThemeChange = (themeId: string, checked: boolean) => {
    const newSelected = new Set(selectedThemes);
    if (checked) {
      newSelected.add(themeId);
    } else {
      newSelected.delete(themeId);
    }
    setSelectedThemes(newSelected);
  };

  const handleVariantThemeChange = (variantId: string, themeId: string, checked: boolean) => {
    const newVariantThemes = { ...variantThemes };
    if (!newVariantThemes[variantId]) {
      newVariantThemes[variantId] = new Set();
    }
    
    if (checked) {
      newVariantThemes[variantId].add(themeId);
    } else {
      newVariantThemes[variantId].delete(themeId);
    }
    
    setVariantThemes(newVariantThemes);
  };

  const saveThemeAssignments = async () => {
    try {
      setSaving(true);

      // First, delete all existing assignments for this product
      const { error: deleteError } = await supabase
        .from('product_themes')
        .delete()
        .eq('product_id', productId);

      if (deleteError) throw deleteError;

      // Prepare new assignments
      const assignments: ProductThemeAssignment[] = [];

      // Add product-level themes (no variant)
      selectedThemes.forEach(themeId => {
        assignments.push({
          product_id: productId,
          theme_id: themeId,
        });
      });

      // Add variant-specific themes
      Object.entries(variantThemes).forEach(([variantId, themeIds]) => {
        themeIds.forEach(themeId => {
          assignments.push({
            product_id: productId,
            theme_id: themeId,
            variant_id: variantId,
          });
        });
      });

      // Insert new assignments
      if (assignments.length > 0) {
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
          <CardTitle>Asignar Temas</CardTitle>
        </div>
        <CardDescription>
          Selecciona los temas disponibles para este producto y sus variantes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Product-level themes */}
        <div>
          <h4 className="font-medium text-farfalla-ink mb-3">Temas del Producto</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Estos temas estarán disponibles para todas las variantes del producto
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {themes.map((theme) => (
              <div key={`product-${theme.id}`} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={`product-theme-${theme.id}`}
                  checked={selectedThemes.has(theme.id)}
                  onCheckedChange={(checked) => 
                    handleProductThemeChange(theme.id, checked as boolean)
                  }
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <label 
                      htmlFor={`product-theme-${theme.id}`}
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
        </div>

        {/* Variant-specific themes */}
        {variants.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium text-farfalla-ink mb-3">Temas por Variante</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Asigna temas específicos a cada variante del producto
              </p>
              {variants.map((variant) => (
                <div key={variant.id} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">{variant.name}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                    {themes.map((theme) => (
                      <div key={`variant-${variant.id}-${theme.id}`} className="flex items-start space-x-3 p-2 border rounded">
                        <Checkbox
                          id={`variant-${variant.id}-theme-${theme.id}`}
                          checked={variantThemes[variant.id]?.has(theme.id) || false}
                          onCheckedChange={(checked) => 
                            handleVariantThemeChange(variant.id, theme.id, checked as boolean)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <label 
                            htmlFor={`variant-${variant.id}-theme-${theme.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {theme.name}
                          </label>
                          {theme.image_url && (
                            <img
                              src={convertGoogleDriveUrlToBase64(theme.image_url)}
                              alt={theme.name}
                              className="w-12 h-12 object-cover rounded mt-1"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

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