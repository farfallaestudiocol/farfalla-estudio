import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { convertGoogleDriveUrlToBase64 } from '@/lib/googleDrive';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Palette, Eye } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
}

interface ProductTheme {
  theme_id: string;
  themes: Theme;
}

interface ProductThemesProps {
  productId: string;
  variantId?: string;
  className?: string;
}

export const ProductThemes = ({ productId, variantId, className }: ProductThemesProps) => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductThemes();
  }, [productId, variantId]);

  const fetchProductThemes = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('product_themes')
        .select(`
          theme_id,
          themes (
            id,
            name,
            description,
            image_url
          )
        `)
        .eq('product_id', productId);

      // If variant is specified, filter by variant, otherwise get themes without specific variants
      if (variantId) {
        query = query.eq('variant_id', variantId);
      } else {
        query = query.is('variant_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      const fetchedThemes = data?.map((pt: ProductTheme) => pt.themes).filter(Boolean) || [];
      setThemes(fetchedThemes);
      
      if (fetchedThemes.length > 0) {
        setSelectedTheme(fetchedThemes[0]);
      }
    } catch (error) {
      console.error('Error fetching product themes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Palette className="h-6 w-6 animate-spin text-farfalla-teal" />
      </div>
    );
  }

  if (themes.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-farfalla-teal" />
        <h3 className="text-lg font-semibold text-farfalla-ink">Temas Disponibles</h3>
        <Badge variant="secondary" className="text-xs">
          {themes.length} tema{themes.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Theme Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {themes.map((theme) => (
          <Card 
            key={theme.id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedTheme?.id === theme.id 
                ? 'ring-2 ring-farfalla-teal shadow-md' 
                : 'hover:ring-1 hover:ring-farfalla-teal/50'
            }`}
            onClick={() => setSelectedTheme(theme)}
          >
            <CardContent className="p-3">
              {theme.image_url ? (
                <div className="aspect-square mb-2 overflow-hidden rounded-lg">
                  <img
                    src={convertGoogleDriveUrlToBase64(theme.image_url)}
                    alt={theme.name}
                    className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                  />
                </div>
              ) : (
                <div className="aspect-square mb-2 bg-farfalla-teal/10 rounded-lg flex items-center justify-center">
                  <Palette className="h-6 w-6 text-farfalla-teal" />
                </div>
              )}
              <h4 className="text-sm font-medium text-farfalla-ink text-center line-clamp-2">
                {theme.name}
              </h4>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Theme Details */}
      {selectedTheme && (
        <Card className="farfalla-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {selectedTheme.image_url ? (
                <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={convertGoogleDriveUrlToBase64(selectedTheme.image_url)}
                    alt={selectedTheme.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 flex-shrink-0 bg-farfalla-teal/10 rounded-lg flex items-center justify-center">
                  <Palette className="h-8 w-8 text-farfalla-teal" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-lg font-semibold text-farfalla-ink">
                    {selectedTheme.name}
                  </h4>
                  <Badge className="farfalla-badge-nuevo">Tema Activo</Badge>
                </div>
                
                {selectedTheme.description && (
                  <p className="text-muted-foreground text-sm mb-3">
                    {selectedTheme.description}
                  </p>
                )}
                
                <Button size="sm" variant="outline" className="farfalla-btn-secondary">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver con este tema
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};