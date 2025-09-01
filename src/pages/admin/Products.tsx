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
  Package,
  ArrowLeft
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  description?: string;
  short_description?: string;
  images: string[];
  is_featured: boolean;
  is_active: boolean;
  stock_quantity: number;
  rating: number;
  review_count: number;
  category_id?: string;
  sku?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.map(product =>
        product.id === productId
          ? { ...product, is_active: !currentStatus }
          : product
      ));

      toast({
        title: 'Éxito',
        description: `Producto ${!currentStatus ? 'activado' : 'desactivado'} correctamente`,
      });
    } catch (error) {
      console.error('Error updating product status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del producto',
        variant: 'destructive',
      });
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(product => product.id !== productId));
      toast({
        title: 'Éxito',
        description: 'Producto eliminado correctamente',
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el producto',
        variant: 'destructive',
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen farfalla-section-gradient flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 animate-spin text-farfalla-teal mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando productos...</p>
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
                Gestión de Productos
              </h1>
              <p className="text-muted-foreground mt-2">
                {filteredProducts.length} productos encontrados
              </p>
            </div>
            <Button asChild className="farfalla-btn-primary">
              <Link to="/admin/products/new" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                <span>Nuevo Producto</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="farfalla-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-poppins text-farfalla-ink line-clamp-2">
                      {product.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      SKU: {product.sku || 'N/A'}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge 
                      variant={product.is_active ? "default" : "secondary"}
                      className={product.is_active ? "farfalla-badge-nuevo" : ""}
                    >
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    {product.is_featured && (
                      <Badge className="farfalla-badge-promo text-xs">
                        Destacado
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {product.images.length > 0 && (
                  <div className="mb-4">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-farfalla-ink">
                      {formatPrice(product.price)}
                    </span>
                    {product.compare_price && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.compare_price)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.short_description || product.description || 'Sin descripción'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>Stock: {product.stock_quantity}</span>
                  <span>⭐ {product.rating} ({product.review_count})</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleProductStatus(product.id, product.is_active)}
                    className="flex-1"
                  >
                    {product.is_active ? (
                      <EyeOff className="h-4 w-4 mr-1" />
                    ) : (
                      <Eye className="h-4 w-4 mr-1" />
                    )}
                    {product.is_active ? 'Ocultar' : 'Mostrar'}
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/admin/products/edit/${product.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteProduct(product.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-farfalla-ink mb-2">
              No se encontraron productos
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer producto'}
            </p>
            <Button asChild className="farfalla-btn-primary">
              <Link to="/admin/products/new" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                <span>Crear Producto</span>
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;