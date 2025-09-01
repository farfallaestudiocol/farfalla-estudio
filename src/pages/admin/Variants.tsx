import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Shuffle,
  ArrowLeft,
  Package
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Variant {
  id: string;
  name: string;
  product_id: string;
  price?: number;
  sku?: string;
  stock_quantity: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  products?: {
    name: string;
  };
}

const Variants = () => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVariants, setFilteredVariants] = useState<Variant[]>([]);

  useEffect(() => {
    fetchVariants();
  }, []);

  useEffect(() => {
    const filtered = variants.filter(variant =>
      variant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.products?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVariants(filtered);
  }, [variants, searchTerm]);

  const fetchVariants = async () => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          *,
          products (
            name
          )
        `)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setVariants(data || []);
    } catch (error) {
      console.error('Error fetching variants:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las variantes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVariantStatus = async (variantId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ is_active: !currentStatus })
        .eq('id', variantId);

      if (error) throw error;

      setVariants(variants.map(variant =>
        variant.id === variantId
          ? { ...variant, is_active: !currentStatus }
          : variant
      ));

      toast({
        title: 'Éxito',
        description: `Variante ${!currentStatus ? 'activada' : 'desactivada'} correctamente`,
      });
    } catch (error) {
      console.error('Error updating variant status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado de la variante',
        variant: 'destructive',
      });
    }
  };

  const deleteVariant = async (variantId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta variante?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId);

      if (error) throw error;

      setVariants(variants.filter(variant => variant.id !== variantId));
      toast({
        title: 'Éxito',
        description: 'Variante eliminada correctamente',
      });
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la variante',
        variant: 'destructive',
      });
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Sin precio';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen farfalla-section-gradient flex items-center justify-center">
        <div className="text-center">
          <Shuffle className="h-12 w-12 animate-spin text-farfalla-teal mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando variantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen farfalla-section-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Link>
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
                Gestión de Variantes
              </h1>
              <p className="text-muted-foreground mt-2">
                {filteredVariants.length} variantes encontradas
              </p>
            </div>
            <Button asChild className="farfalla-btn-primary">
              <Link to="/admin/variants/new">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Variante
              </Link>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar variantes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Variants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVariants.map((variant) => (
            <Card key={variant.id} className="farfalla-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-poppins text-farfalla-ink">
                      {variant.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {variant.products?.name}
                    </CardDescription>
                    {variant.sku && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        SKU: {variant.sku}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge 
                      variant={variant.is_active ? "default" : "secondary"}
                      className={variant.is_active ? "farfalla-badge-nuevo" : ""}
                    >
                      {variant.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Precio:</span>
                    <span className="font-semibold text-farfalla-ink">
                      {formatPrice(variant.price)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Stock:</span>
                    <Badge variant={variant.stock_quantity > 0 ? "default" : "destructive"}>
                      {variant.stock_quantity} unidades
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Orden: {variant.display_order}</span>
                    <span>
                      {new Date(variant.created_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleVariantStatus(variant.id, variant.is_active)}
                      className="flex-1"
                    >
                      {variant.is_active ? (
                        <EyeOff className="h-4 w-4 mr-1" />
                      ) : (
                        <Eye className="h-4 w-4 mr-1" />
                      )}
                      {variant.is_active ? 'Ocultar' : 'Mostrar'}
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/admin/variants/edit/${variant.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteVariant(variant.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVariants.length === 0 && !loading && (
          <div className="text-center py-12">
            <Shuffle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-farfalla-ink mb-2">
              No se encontraron variantes
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primera variante de producto'}
            </p>
            <Button asChild className="farfalla-btn-primary">
              <Link to="/admin/variants/new">
                <Plus className="h-4 w-4 mr-2" />
                Crear Variante
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Variants;