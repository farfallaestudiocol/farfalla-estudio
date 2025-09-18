import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { convertGoogleDriveUrlToBase64 } from '@/lib/googleDrive';

interface ProductVariant {
  id: string;
  name: string;
  price: number | null;
  sku: string | null;
  stock_quantity: number;
  is_active: boolean;
  display_order: number;
  image_url: string | null;
}

interface ProductVariantsManagerProps {
  productId: string | undefined;
}

const ProductVariantsManager = ({ productId }: ProductVariantsManagerProps) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    sku: '',
    stock_quantity: 0,
    is_active: true,
    display_order: 0,
    image_url: '',
  });

  useEffect(() => {
    if (productId) {
      fetchVariants();
    }
  }, [productId]);

  const fetchVariants = async () => {
    if (!productId) return;
    
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      if (error) throw error;
      setVariants(data || []);
    } catch (error) {
      console.error('Error fetching variants:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las variantes',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;

    setLoading(true);
    try {
      const variantData = {
        name: formData.name.trim(),
        product_id: productId,
        price: formData.price > 0 ? formData.price : null,
        sku: formData.sku.trim() || null,
        stock_quantity: formData.stock_quantity,
        is_active: formData.is_active,
        display_order: formData.display_order,
        image_url: formData.image_url.trim() || null,
      };

      let error;

      if (editingVariant) {
        const result = await supabase
          .from('product_variants')
          .update(variantData)
          .eq('id', editingVariant.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('product_variants')
          .insert([variantData]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: `Variante ${editingVariant ? 'actualizada' : 'creada'} correctamente`,
      });

      resetForm();
      fetchVariants();
    } catch (error) {
      console.error('Error saving variant:', error);
      toast({
        title: 'Error',
        description: `No se pudo ${editingVariant ? 'actualizar' : 'crear'} la variante`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormData({
      name: variant.name,
      price: variant.price || 0,
      sku: variant.sku || '',
      stock_quantity: variant.stock_quantity,
      is_active: variant.is_active,
      display_order: variant.display_order,
      image_url: variant.image_url || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta variante?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Variante eliminada',
        description: 'La variante se eliminó correctamente',
      });
      
      fetchVariants();
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la variante',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: 0,
      sku: '',
      stock_quantity: 0,
      is_active: true,
      display_order: variants.length,
      image_url: '',
    });
    setEditingVariant(null);
    setShowForm(false);
  };

  const formatPriceForDisplay = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2);
  };

  const handlePriceChange = (value: string) => {
    const euros = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, price: Math.round(euros * 100) }));
  };

  if (!productId) {
    return (
      <Card className="farfalla-card">
        <CardHeader>
          <CardTitle className="text-xl font-poppins text-farfalla-ink">
            Variantes del Producto
          </CardTitle>
          <CardDescription>
            Guarda el producto primero para administrar sus variantes
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="farfalla-card">
      <CardHeader>
        <CardTitle className="text-xl font-poppins text-farfalla-ink flex items-center justify-between">
          Variantes del Producto
          <Button 
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            variant={showForm ? "outline" : "default"}
            size="sm"
          >
            {showForm ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Variante
              </>
            )}
          </Button>
        </CardTitle>
        <CardDescription>
          Administra las diferentes variantes de este producto
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h4 className="font-semibold text-farfalla-ink">
              {editingVariant ? 'Editar Variante' : 'Nueva Variante'}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="variant_name">Nombre de la Variante *</Label>
                <Input
                  id="variant_name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Talla M, Color Rojo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variant_price">Precio (€)</Label>
                <Input
                  id="variant_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formatPriceForDisplay(formData.price)}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Deja en 0 para usar el precio del producto principal
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="variant_sku">SKU</Label>
                <Input
                  id="variant_sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="Código único"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variant_stock">Stock</Label>
                <Input
                  id="variant_stock"
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variant_order">Orden de Visualización</Label>
                <Input
                  id="variant_order"
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2 flex items-end">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="variant_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="variant_active" className="text-sm">
                    {formData.is_active ? 'Activa' : 'Inactiva'}
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variant_image">Imagen de la Variante</Label>
              <Input
                id="variant_image"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="URL de la imagen de Google Drive"
              />
              <p className="text-xs text-muted-foreground">
                URL de Google Drive para la imagen de esta variante
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                className="farfalla-btn-primary"
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingVariant ? 'Actualizar' : 'Crear'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {variants.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-semibold text-farfalla-ink">Variantes Existentes</h4>
            <div className="space-y-2">
              {variants.map((variant) => (
                <div key={variant.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {variant.image_url && (
                      <img 
                        src={convertGoogleDriveUrlToBase64(variant.image_url)} 
                        alt={variant.name} 
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium">{variant.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {variant.price ? `€${(variant.price / 100).toFixed(2)}` : 'Sin precio específico'}
                        {variant.sku && ` • SKU: ${variant.sku}`}
                        • Stock: {variant.stock_quantity}
                        • {variant.is_active ? 'Activa' : 'Inactiva'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(variant)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(variant.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            No hay variantes creadas para este producto
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductVariantsManager;