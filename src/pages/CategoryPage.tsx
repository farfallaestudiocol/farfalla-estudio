import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Grid,
  List,
  Filter,
  SortAsc,
  SortDesc,
  Package,
  FolderOpen,
  Layers
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price?: number;
  images: string[];
  rating: number;
  review_count: number;
  is_featured: boolean;
  subcategory_id?: string;
  subcategories?: {
    name: string;
    slug: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

const CategoryPage = () => {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filters from URL params - Support both old and new formats
  const selectedSubcategoriesParam = searchParams.get('subcategories') || '';
  const oldSubcategoryParam = searchParams.get('subcategory');
  
  // Combine both old single selection and new multiple selection
  let selectedSubcategories: string[] = [];
  if (selectedSubcategoriesParam) {
    selectedSubcategories = selectedSubcategoriesParam.split(',');
  } else if (oldSubcategoryParam && oldSubcategoryParam !== 'all') {
    selectedSubcategories = [oldSubcategoryParam];
  }
  
  const sortBy = searchParams.get('sort') || 'name';
  const sortOrder = searchParams.get('order') || 'asc';

  useEffect(() => {
    if (categorySlug) {
      fetchCategoryData();
    }
  }, [categorySlug]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [products, selectedSubcategories, sortBy, sortOrder]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);

      // Fetch category
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', categorySlug)
        .eq('is_active', true)
        .single();

      if (categoryError) throw categoryError;
      setCategory(categoryData);

      // Fetch subcategories for this category
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryData.id)
        .eq('is_active', true)
        .order('display_order');

      if (subcategoriesError) throw subcategoriesError;
      setSubcategories(subcategoriesData || []);

      // Fetch products for this category
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          subcategories (
            name,
            slug
          )
        `)
        .eq('category_id', categoryData.id)
        .eq('is_active', true)
        .order('name');

      if (productsError) throw productsError;
      setProducts(productsData || []);

    } catch (error) {
      console.error('Error fetching category data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...products];

    // Filter by subcategories - Modified for multiple selection
    if (selectedSubcategories.length > 0) {
      filtered = filtered.filter(product => 
        product.subcategories?.slug && selectedSubcategories.includes(product.subcategories.slug)
      );
    }

    // Sort products
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Product];
      let bValue: any = b[sortBy as keyof Product];

      // Handle special cases
      if (sortBy === 'price') {
        aValue = a.price;
        bValue = b.price;
      } else if (sortBy === 'rating') {
        aValue = a.rating || 0;
        bValue = b.rating || 0;
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    setFilteredProducts(filtered);
  };

  const updateSubcategoriesParam = (subcategorySlugs: string[]) => {
    const params = new URLSearchParams(searchParams);
    if (subcategorySlugs.length === 0) {
      params.delete('subcategories');
    } else {
      params.set('subcategories', subcategorySlugs.join(','));
    }
    setSearchParams(params);
  };

  const handleSubcategoryChange = (subcategorySlug: string, checked: boolean) => {
    let newSelected = [...selectedSubcategories];
    
    if (checked) {
      if (!newSelected.includes(subcategorySlug)) {
        newSelected.push(subcategorySlug);
      }
    } else {
      newSelected = newSelected.filter(slug => slug !== subcategorySlug);
    }
    
    updateSubcategoriesParam(newSelected);
  };

  const updateSearchParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all' || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    setSearchParams(params);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen farfalla-section-gradient flex items-center justify-center">
          <div className="text-center">
            <FolderOpen className="h-12 w-12 animate-spin text-farfalla-teal mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando categoría...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!category) {
    return (
      <>
        <Header />
        <div className="min-h-screen farfalla-section-gradient flex items-center justify-center">
          <div className="text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-farfalla-ink mb-2">Categoría no encontrada</h2>
            <p className="text-muted-foreground">La categoría que buscas no existe o no está disponible.</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen farfalla-section-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Category Header */}
          <div className="mb-8">
            {category.image_url && (
              <div className="mb-6">
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="w-full h-64 object-cover rounded-xl"
                />
              </div>
            )}
            
            <div className="text-center">
              <h1 className="text-4xl font-poppins font-bold text-farfalla-ink mb-4">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-6">
                  {category.description}
                </p>
              )}
              <Badge variant="outline" className="mb-6">
                {filteredProducts.length} productos encontrados
              </Badge>
            </div>
          </div>

          {/* Filters and Controls */}
          <Card className="farfalla-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros y Ordenamiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                {/* Subcategory Filter - Multiple Selection with Checkboxes */}
                {subcategories.length > 0 && (
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Subcategorías</label>
                      {selectedSubcategories.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => updateSubcategoriesParam([])}
                          className="h-auto p-1 text-xs"
                        >
                          Limpiar todo
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-md p-3 bg-card">
                      {subcategories.map((sub) => (
                        <div key={sub.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`subcategory-${sub.id}`}
                            checked={selectedSubcategories.includes(sub.slug)}
                            onCheckedChange={(checked) => 
                              handleSubcategoryChange(sub.slug, checked === true)
                            }
                          />
                          <label
                            htmlFor={`subcategory-${sub.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {sub.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedSubcategories.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {selectedSubcategories.length} subcategoría{selectedSubcategories.length !== 1 ? 's' : ''} seleccionada{selectedSubcategories.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                )}

                {/* Sort By */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ordenar por</label>
                  <Select 
                    value={sortBy} 
                    onValueChange={(value) => updateSearchParam('sort', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nombre</SelectItem>
                      <SelectItem value="price">Precio</SelectItem>
                      <SelectItem value="rating">Valoración</SelectItem>
                      <SelectItem value="created_at">Fecha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Order */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Orden</label>
                  <Select 
                    value={sortOrder} 
                    onValueChange={(value) => updateSearchParam('order', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">
                        <div className="flex items-center gap-2">
                          <SortAsc className="h-4 w-4" />
                          Ascendente
                        </div>
                      </SelectItem>
                      <SelectItem value="desc">
                        <div className="flex items-center gap-2">
                          <SortDesc className="h-4 w-4" />
                          Descendente
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* View Mode */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vista</label>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid/List */}
          {filteredProducts.length > 0 ? (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }>
              {filteredProducts.map((product, index) => (
                <div 
                  key={product.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ProductCard 
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    price={product.price}
                    comparePrice={product.compare_price}
                    image={product.images?.[0] || '/placeholder.svg'}
                    rating={product.rating}
                    reviewCount={product.review_count}
                    badge={product.is_featured ? { text: 'Destacado', type: 'nuevo' } : undefined}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Layers className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-farfalla-ink mb-2">
                No hay productos en esta categoría
              </h3>
              <p className="text-muted-foreground mb-6">
                {selectedSubcategories.length > 0 
                  ? 'Intenta cambiar la selección de subcategorías o ver todos los productos'
                  : 'Pronto agregaremos productos a esta categoría'
                }
              </p>
              {selectedSubcategories.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => updateSubcategoriesParam([])}
                >
                  Ver todos los productos
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default CategoryPage;