import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
}

const CategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    if (isEditing) {
      fetchCategory();
    }
  }, [id, isEditing]);

  const fetchCategory = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData({
          name: data.name || '',
          slug: data.slug || '',
          description: data.description || '',
          image_url: data.image_url || '',
          is_active: data.is_active ?? true,
          display_order: data.display_order || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la categoría',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const categoryData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.name),
      };

      if (isEditing) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: 'Éxito',
          description: 'Categoría actualizada correctamente',
        });
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([categoryData]);

        if (error) throw error;

        toast({
          title: 'Éxito',
          description: 'Categoría creada correctamente',
        });
      }

      navigate('/admin/categories');
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: 'Error',
        description: `No se pudo ${isEditing ? 'actualizar' : 'crear'} la categoría`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: prev.slug || generateSlug(value),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen farfalla-section-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-farfalla-teal mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando categoría...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen farfalla-section-gradient">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/categories">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Categorías
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
            {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isEditing ? 'Actualiza la información de la categoría' : 'Completa los datos para crear una nueva categoría'}
          </p>
        </div>

        {/* Form */}
        <Card className="farfalla-card">
          <CardHeader>
            <CardTitle className="text-xl font-poppins text-farfalla-ink">
              Información de la Categoría
            </CardTitle>
            <CardDescription>
              Configura los detalles básicos de la categoría
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Nombre de la categoría"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="slug-de-la-categoria"
                  />
                  <p className="text-xs text-muted-foreground">
                    Se genera automáticamente si se deja vacío
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe la categoría..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL de Imagen</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="display_order">Orden de Visualización</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Número más bajo aparece primero
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Categoría activa</Label>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button 
                  type="submit" 
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
                      {isEditing ? 'Actualizar' : 'Crear'} Categoría
                    </>
                  )}
                </Button>
                <Button asChild variant="outline">
                  <Link to="/admin/categories">
                    Cancelar
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CategoryForm;