import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
}

interface VariantFormData {
  name: string;
  product_id: string;
  price: number;
  sku: string;
  stock_quantity: number;
  is_active: boolean;
  display_order: number;
  image_url: string;
}

const VariantForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<VariantFormData>({
    name: '',
    product_id: '',
    price: 0,
    sku: '',
    stock_quantity: 0,
    is_active: true,
    display_order: 0,
    image_url: '',
  });

  useEffect(() => {
    fetchProducts();
    if (isEditing) {
      fetchVariant();
    }
  }, [id, isEditing]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos',
        variant: 'destructive',
      });
    }
  };

  const fetchVariant = async () => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || '',
        product_id: data.product_id || '',
        price: data.price || 0,
        sku: data.sku || '',
        stock_quantity: data.stock_quantity || 0,
        is_active: data.is_active ?? true,
        display_order: data.display_order || 0,
        image_url: data.image_url || '',
      });
    } catch (error) {
      console.error('Error fetching variant:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la variante',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.product_id) {
      toast({
        title: 'Error',
        description: 'El nombre y el producto son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const variantData = {
        name: formData.name.trim(),
        product_id: formData.product_id,
        price: formData.price > 0 ? formData.price : null,
        sku: formData.sku.trim() || null,
        stock_quantity: formData.stock_quantity,
        is_active: formData.is_active,
        display_order: formData.display_order,
        image_url: formData.image_url.trim() || null,
      };

      let error;

      if (isEditing) {
        const result = await supabase
          .from('product_variants')
          .update(variantData)
          .eq('id', id);
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
        description: `Variante ${isEditing ? 'actualizada' : 'creada'} correctamente`,
      });

      navigate('/admin/variants');
    } catch (error) {
      console.error('Error saving variant:', error);
      toast({
        title: 'Error',
        description: `No se pudo ${isEditing ? 'actualizar' : 'crear'} la variante`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPriceForDisplay = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2);
  };

  const handlePriceChange = (value: string) => {
    const euros = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, price: Math.round(euros * 100) }));
  };

  return (
    <div className="min-h-screen farfalla-section-gradient">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/variants" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span>Volver a Variantes</span>
              </Link>
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
              {isEditing ? 'Editar Variante' : 'Nueva Variante'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isEditing ? 'Actualiza la información de la variante' : 'Completa el formulario para crear una nueva variante'}
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="farfalla-card">
          <CardHeader>
            <CardTitle>Información de la Variante</CardTitle>
            <CardDescription>
              Configura los detalles de la variante del producto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Variante *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Niño, Niña, Talla M"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product_id">Producto *</Label>
                  <Select 
                    value={formData.product_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio (€)</Label>
                  <Input
                    id="price"
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
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="Código único"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Stock</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                  />
                </div>
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

              <div className="space-y-2">
                <Label htmlFor="image_url">Imagen de la Variante</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="URL de la imagen de Google Drive"
                />
                <p className="text-xs text-muted-foreground">
                  URL de Google Drive para la imagen de esta variante
                </p>
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
                  {isEditing ? 'Actualizar' : 'Crear'} Variante
                </Button>
                <Button asChild variant="outline">
                  <Link to="/admin/variants">
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

export default VariantForm;