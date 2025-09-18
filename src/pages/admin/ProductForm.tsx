import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, Plus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { convertGoogleDriveUrlToBase64 } from '@/lib/googleDrive';
import ProductVariantsManager from '@/components/ProductVariantsManager';
import ProductRelationshipsManager from '@/components/ProductRelationshipsManager';

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

interface ProductFormData {
  name: string;
  slug: string;
  price: number;
  compare_price: number;
  description: string;
  short_description: string;
  images: string[];
  tags: string[];
  sku: string;
  category_id: string;
  subcategory_id: string;
  is_featured: boolean;
  is_active: boolean;
  stock_quantity: number;
}

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [newImage, setNewImage] = useState('');
  const [newTag, setNewTag] = useState('');
  const [processingImage, setProcessingImage] = useState(false);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    price: 0,
    compare_price: 0,
    description: '',
    short_description: '',
    images: [],
    tags: [],
    sku: '',
    category_id: '',
    subcategory_id: '',
    is_featured: false,
    is_active: true,
    stock_quantity: 0,
  });

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchProduct();
    }
  }, [id, isEditing]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('display_order');

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

  const fetchSubcategories = async (categoryId: string) => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('id, name, category_id')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setSubcategories(data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las subcategorías',
        variant: 'destructive',
      });
    }
  };

  const fetchProduct = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData({
          name: data.name || '',
          slug: data.slug || '',
          price: data.price || 0,
          compare_price: data.compare_price || 0,
          description: data.description || '',
          short_description: data.short_description || '',
          images: data.images || [],
          tags: data.tags || [],
          sku: data.sku || '',
          category_id: data.category_id || '',
          subcategory_id: data.subcategory_id || '',
          is_featured: data.is_featured ?? false,
          is_active: data.is_active ?? true,
          stock_quantity: data.stock_quantity || 0,
        });
        
        // Fetch subcategories if category is selected
        if (data.category_id) {
          fetchSubcategories(data.category_id);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el producto',
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
      const productData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.name),
        category_id: formData.category_id || null,
        subcategory_id: formData.subcategory_id || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: 'Éxito',
          description: 'Producto actualizado correctamente',
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;

        toast({
          title: 'Éxito',
          description: 'Producto creado correctamente',
        });
      }

      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'Error',
        description: `No se pudo ${isEditing ? 'actualizar' : 'crear'} el producto`,
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

  const addImage = () => {
    if (newImage.trim()) {
      setProcessingImage(true);
      try {
        const convertedUrl = convertGoogleDriveUrlToBase64(newImage.trim());
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, convertedUrl]
        }));
        setNewImage('');
        
        // Show success message if it was a Google Drive URL
        const isDriveUrl = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/.test(newImage.trim());
        if (isDriveUrl) {
          toast({
            title: 'Imagen procesada',
            description: 'La imagen de Google Drive se procesará a través del proxy',
          });
        }
      } catch (error) {
        console.error('Error processing image:', error);
        toast({
          title: 'Error',
          description: 'No se pudo procesar la imagen. Verifica que el enlace sea válido.',
          variant: 'destructive',
        });
      } finally {
        setProcessingImage(false);
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen farfalla-section-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-farfalla-teal mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando producto...</p>
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
              <Link to="/admin/products" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span>Volver a Productos</span>
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isEditing ? 'Actualiza la información del producto' : 'Completa los datos para crear un nuevo producto'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="farfalla-card">
            <CardHeader>
              <CardTitle className="text-xl font-poppins text-farfalla-ink">
                Información Básica
              </CardTitle>
              <CardDescription>
                Detalles principales del producto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Producto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Nombre del producto"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="SKU-001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="slug-del-producto"
                />
                <p className="text-xs text-muted-foreground">
                  Se genera automáticamente si se deja vacío
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Descripción Corta</Label>
                <Textarea
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                  placeholder="Descripción breve para listados..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción Completa</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción completa del producto..."
                  className="min-h-[120px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Inventory */}
          <Card className="farfalla-card">
            <CardHeader>
              <CardTitle className="text-xl font-poppins text-farfalla-ink">
                Precios e Inventario
              </CardTitle>
              <CardDescription>
                Configuración de precios y stock
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    placeholder="50000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compare_price">Precio de Comparación</Label>
                  <Input
                    id="compare_price"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.compare_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, compare_price: parseInt(e.target.value) || 0 }))}
                    placeholder="70000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Cantidad en Stock</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, category_id: value, subcategory_id: '' }));
                      fetchSubcategories(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
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
                  <Label htmlFor="subcategory">Subcategoría</Label>
                  <Select
                    value={formData.subcategory_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory_id: value }))}
                    disabled={!formData.category_id || subcategories.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !formData.category_id 
                          ? "Primero selecciona una categoría" 
                          : subcategories.length === 0
                          ? "No hay subcategorías disponibles"
                          : "Seleccionar subcategoría"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="farfalla-card">
            <CardHeader>
              <CardTitle className="text-xl font-poppins text-farfalla-ink">
                Imágenes
              </CardTitle>
              <CardDescription>
                URLs de las imágenes del producto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                  />
                  <Button type="button" onClick={addImage} variant="outline" disabled={processingImage}>
                    {processingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Para Google Drive: Copia el enlace para compartir y se convertirá automáticamente al formato correcto
                </p>
              </div>

              {formData.images.length > 0 && (
                <div className="space-y-2">
                  {formData.images.map((image, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <img src={convertGoogleDriveUrlToBase64(image)} alt={`Imagen ${index + 1}`} className="w-12 h-12 object-cover rounded" />
                      <span className="flex-1 text-sm truncate">{image}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="farfalla-card">
            <CardHeader>
              <CardTitle className="text-xl font-poppins text-farfalla-ink">
                Etiquetas
              </CardTitle>
              <CardDescription>
                Etiquetas para facilitar la búsqueda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Etiqueta"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <div key={index} className="flex items-center gap-1 px-3 py-1 bg-farfalla-teal/10 text-farfalla-teal rounded-full text-sm">
                      <span>{tag}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTag(index)}
                        className="h-4 w-4 p-0 hover:bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="farfalla-card">
            <CardHeader>
              <CardTitle className="text-xl font-poppins text-farfalla-ink">
                Configuración
              </CardTitle>
              <CardDescription>
                Estado y configuraciones del producto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Producto activo</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                />
                <Label htmlFor="is_featured">Producto destacado</Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
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
                  {isEditing ? 'Actualizar' : 'Crear'} Producto
                </>
              )}
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/products">
                Cancelar
              </Link>
            </Button>
          </div>
        </form>

        {/* Variants Management - Only show when editing */}
        {isEditing && (
          <ProductVariantsManager productId={id} />
        )}

        {/* Relationships Management - Only show when editing */}
        {isEditing && (
          <ProductRelationshipsManager productId={id} />
        )}
      </div>
    </div>
  );
};

export default ProductForm;