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
  Layers,
  ArrowLeft
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  display_order: number;
  category_id: string;
  created_at: string;
  updated_at: string;
  categories?: {
    name: string;
  };
}

const Subcategories = () => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);

  useEffect(() => {
    fetchSubcategories();
  }, []);

  useEffect(() => {
    const filtered = subcategories.filter(subcategory =>
      subcategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subcategory.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subcategory.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subcategory.categories?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSubcategories(filtered);
  }, [subcategories, searchTerm]);

  const fetchSubcategories = async () => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select(`
          *,
          categories (
            name
          )
        `)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSubcategories(data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las subcategorías',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSubcategoryStatus = async (subcategoryId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subcategories')
        .update({ is_active: !currentStatus })
        .eq('id', subcategoryId);

      if (error) throw error;

      setSubcategories(subcategories.map(subcategory =>
        subcategory.id === subcategoryId
          ? { ...subcategory, is_active: !currentStatus }
          : subcategory
      ));

      toast({
        title: 'Éxito',
        description: `Subcategoría ${!currentStatus ? 'activada' : 'desactivada'} correctamente`,
      });
    } catch (error) {
      console.error('Error updating subcategory status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado de la subcategoría',
        variant: 'destructive',
      });
    }
  };

  const deleteSubcategory = async (subcategoryId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta subcategoría?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', subcategoryId);

      if (error) throw error;

      setSubcategories(subcategories.filter(subcategory => subcategory.id !== subcategoryId));
      toast({
        title: 'Éxito',
        description: 'Subcategoría eliminada correctamente',
      });
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la subcategoría',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen farfalla-section-gradient flex items-center justify-center">
        <div className="text-center">
          <Layers className="h-12 w-12 animate-spin text-farfalla-teal mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando subcategorías...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen farfalla-section-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
                Gestión de Subcategorías
              </h1>
              <p className="text-muted-foreground mt-2">
                {filteredSubcategories.length} subcategorías encontradas
              </p>
            </div>
            <Button asChild className="farfalla-btn-primary">
              <Link to="/admin/subcategories/new" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                <span>Nueva Subcategoría</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar subcategorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Subcategories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubcategories.map((subcategory) => (
            <Card key={subcategory.id} className="farfalla-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-poppins text-farfalla-ink">
                      {subcategory.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      /{subcategory.slug}
                    </CardDescription>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {subcategory.categories?.name}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge 
                      variant={subcategory.is_active ? "default" : "secondary"}
                      className={subcategory.is_active ? "farfalla-badge-nuevo" : ""}
                    >
                      {subcategory.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {subcategory.image_url && (
                  <div className="mb-4">
                    <img
                      src={subcategory.image_url}
                      alt={subcategory.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {subcategory.description || 'Sin descripción'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>Orden: {subcategory.display_order}</span>
                  <span>
                    {new Date(subcategory.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSubcategoryStatus(subcategory.id, subcategory.is_active)}
                    className="flex-1"
                  >
                    {subcategory.is_active ? (
                      <EyeOff className="h-4 w-4 mr-1" />
                    ) : (
                      <Eye className="h-4 w-4 mr-1" />
                    )}
                    {subcategory.is_active ? 'Ocultar' : 'Mostrar'}
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/admin/subcategories/edit/${subcategory.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteSubcategory(subcategory.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSubcategories.length === 0 && !loading && (
          <div className="text-center py-12">
            <Layers className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-farfalla-ink mb-2">
              No se encontraron subcategorías
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primera subcategoría'}
            </p>
            <Button asChild className="farfalla-btn-primary">
              <Link to="/admin/subcategories/new" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                <span>Crear Subcategoría</span>
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subcategories;