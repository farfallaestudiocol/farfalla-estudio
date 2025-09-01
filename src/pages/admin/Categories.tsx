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
  FolderOpen,
  ArrowLeft
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const filtered = categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [categories, searchTerm]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las categorías',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCategoryStatus = async (categoryId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !currentStatus })
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(categories.map(category =>
        category.id === categoryId
          ? { ...category, is_active: !currentStatus }
          : category
      ));

      toast({
        title: 'Éxito',
        description: `Categoría ${!currentStatus ? 'activada' : 'desactivada'} correctamente`,
      });
    } catch (error) {
      console.error('Error updating category status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado de la categoría',
        variant: 'destructive',
      });
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(categories.filter(category => category.id !== categoryId));
      toast({
        title: 'Éxito',
        description: 'Categoría eliminada correctamente',
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la categoría',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen farfalla-section-gradient flex items-center justify-center">
        <div className="text-center">
          <FolderOpen className="h-12 w-12 animate-spin text-farfalla-teal mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando categorías...</p>
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
                Gestión de Categorías
              </h1>
              <p className="text-muted-foreground mt-2">
                {filteredCategories.length} categorías encontradas
              </p>
            </div>
            <Button asChild className="farfalla-btn-primary">
              <Link to="/admin/categories/new" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                <span>Nueva Categoría</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="farfalla-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-poppins text-farfalla-ink">
                      {category.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      /{category.slug}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge 
                      variant={category.is_active ? "default" : "secondary"}
                      className={category.is_active ? "farfalla-badge-nuevo" : ""}
                    >
                      {category.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {category.image_url && (
                  <div className="mb-4">
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {category.description || 'Sin descripción'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>Orden: {category.display_order}</span>
                  <span>
                    {new Date(category.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleCategoryStatus(category.id, category.is_active)}
                    className="flex-1"
                  >
                    {category.is_active ? (
                      <EyeOff className="h-4 w-4 mr-1" />
                    ) : (
                      <Eye className="h-4 w-4 mr-1" />
                    )}
                    {category.is_active ? 'Ocultar' : 'Mostrar'}
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/admin/categories/edit/${category.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteCategory(category.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCategories.length === 0 && !loading && (
          <div className="text-center py-12">
            <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-farfalla-ink mb-2">
              No se encontraron categorías
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primera categoría'}
            </p>
            <Button asChild className="farfalla-btn-primary">
              <Link to="/admin/categories/new" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                <span>Crear Categoría</span>
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;