import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
}

interface SubcategoryFormData {
  name: string;
  slug: string;
  description: string;
  category_id: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
}

const SubcategoryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<SubcategoryFormData>({
    name: '',
    slug: '',
    description: '',
    category_id: '',
    image_url: '',
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchSubcategory();
    }
  }, [id, isEditing]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las categorías',
        variant: 'destructive',
      });
    }
  };

  const fetchSubcategory = async () => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || '',
        slug: data.slug || '',
        description: data.description || '',
        category_id: data.category_id || '',
        image_url: data.image_url || '',
        is_active: data.is_active ?? true,
        display_order: data.display_order || 0,
      });
    } catch (error) {
      console.error('Error fetching subcategory:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la subcategoría',
        variant: 'destructive',
      });
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const convertGoogleDriveUrl = (url: string) => {
    // Convert Google Drive sharing URL to direct image URL
    const driveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(driveRegex);
    
    if (match) {
      const fileId = match[1];
      return `https://drive.google.com/uc?id=${fileId}`;
    }
    
    return url;
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: generateSlug(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.category_id) {
      toast({
        title: 'Error',
        description: 'El nombre y la categoría son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const subcategoryData = {
        name: formData.name.trim(),
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description.trim() || null,
        category_id: formData.category_id,
        image_url: formData.image_url.trim() ? convertGoogleDriveUrl(formData.image_url.trim()) : null,
        is_active: formData.is_active,
        display_order: formData.display_order,
      };

      let error;

      if (isEditing) {
        const result = await supabase
          .from('subcategories')
          .update(subcategoryData)
          .eq('id', id);
        error = result.error;
      } else {
        const result = await supabase
          .from('subcategories')
          .insert([subcategoryData]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: `Subcategoría ${isEditing ? 'actualizada' : 'creada'} correctamente`,
      });

      navigate('/admin/subcategories');
    } catch (error) {
      console.error('Error saving subcategory:', error);
      toast({
        title: 'Error',
        description: `No se pudo ${isEditing ? 'actualizar' : 'crear'} la subcategoría`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen farfalla-section-gradient">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/subcategories" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span>Volver a Subcategorías</span>
              </Link>
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
              {isEditing ? 'Editar Subcategoría' : 'Nueva Subcategoría'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isEditing ? 'Actualiza la información de la subcategoría' : 'Completa el formulario para crear una nueva subcategoría'}
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="farfalla-card">
          <CardHeader>
            <CardTitle>Información de la Subcategoría</CardTitle>
            <CardDescription>
              Configura los detalles básicos de la subcategoría
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
                    placeholder="Ej: Ropa"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="Se genera automáticamente"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL amigable: /categoria/[categoria]//{formData.slug || 'slug'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_id">Categoría Principal *</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción opcional de la subcategoría"
                  rows={3}
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
                <p className="text-xs text-muted-foreground">
                  💡 Para Google Drive: Copia el enlace para compartir y se convertirá automáticamente al formato correcto
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="display_order">Orden de Visualización</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min="0"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Número menor = aparece primero
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="is_active">Estado</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active" className="text-sm">
                      {formData.is_active ? 'Activa' : 'Inactiva'}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  className="farfalla-btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isEditing ? 'Actualizar' : 'Crear'} Subcategoría
                </Button>
                <Button asChild variant="outline">
                  <Link to="/admin/subcategories">
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

export default SubcategoryForm;