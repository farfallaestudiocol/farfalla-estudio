import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, PackageSearch } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSeo } from '@/hooks/useSeo';

interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  images: string[] | null;
  rating: number | null;
  review_count: number | null;
  is_featured: boolean | null;
  category_id: string | null;
  created_at: string;
}

interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
}

const PAGE_SIZE = 24;

const SORTS = {
  destacados: 'Destacados primero',
  recientes: 'Más recientes',
  'precio-asc': 'Precio: menor a mayor',
  'precio-desc': 'Precio: mayor a menor',
  nombre: 'Nombre (A–Z)',
} as const;
type SortKey = keyof typeof SORTS;
const isSortKey = (v: string | null): v is SortKey => !!v && v in SORTS;

/** Todos los productos de la tienda, con filtro por categoría y orden. Los filtros viajan en la URL. */
const Catalog = () => {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const categorySlug = params.get('categoria') || '';
  const sort: SortKey = isSortKey(params.get('orden')) ? (params.get('orden') as SortKey) : 'destacados';

  useSeo({
    title: 'Todos los productos | Farfalla Estudio',
    description: 'Explora todos los productos personalizados de Farfalla Estudio: marquillas, cajas, cuentos y detalles hechos a mano.',
    url: 'https://farfallaestudio.com.co/productos',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          supabase
            .from('products')
            .select('id, name, slug, price, compare_price, images, rating, review_count, is_featured, category_id, created_at')
            .eq('is_active', true)
            .order('name'),
          supabase.from('categories').select('id, name, slug').eq('is_active', true).order('display_order', { ascending: true }),
        ]);
        if (prodRes.error) throw prodRes.error;
        if (cancelled) return;
        setProducts((prodRes.data || []) as CatalogProduct[]);
        setCategories((catRes.data || []) as CatalogCategory[]);
      } catch (error) {
        console.error('Error loading catalog:', error);
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeCategory = categories.find((c) => c.slug === categorySlug);

  const shown = useMemo(() => {
    const list = activeCategory ? products.filter((p) => p.category_id === activeCategory.id) : [...products];
    switch (sort) {
      case 'recientes':
        return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
      case 'precio-asc':
        return list.sort((a, b) => a.price - b.price);
      case 'precio-desc':
        return list.sort((a, b) => b.price - a.price);
      case 'nombre':
        return list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
      default:
        return list.sort((a, b) => Number(!!b.is_featured) - Number(!!a.is_featured) || a.name.localeCompare(b.name, 'es'));
    }
  }, [products, activeCategory, sort]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setVisible(PAGE_SIZE);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
          {activeCategory ? activeCategory.name : 'Todas las creaciones'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {loading ? 'Cargando...' : `${shown.length} ${shown.length === 1 ? 'producto' : 'productos'}`}
        </p>

        {!loading && !failed && (
          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Categorías">
              <Button
                size="sm"
                variant={activeCategory ? 'outline' : 'default'}
                className={activeCategory ? '' : 'farfalla-btn-primary'}
                onClick={() => update('categoria', '')}
              >
                Todas
              </Button>
              {categories.map((c) => (
                <Button
                  key={c.id}
                  size="sm"
                  variant={c.slug === categorySlug ? 'default' : 'outline'}
                  className={c.slug === categorySlug ? 'farfalla-btn-primary' : ''}
                  onClick={() => update('categoria', c.slug)}
                >
                  {c.name}
                </Button>
              ))}
            </div>

            <Select value={sort} onValueChange={(v) => update('orden', v === 'destacados' ? '' : v)}>
              <SelectTrigger className="w-full md:w-60" aria-label="Ordenar productos">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORTS) as SortKey[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {SORTS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-farfalla-teal" />
          </div>
        )}

        {failed && <p className="text-center text-muted-foreground py-16">No pudimos cargar los productos. Intenta de nuevo en un momento.</p>}

        {!loading && !failed && shown.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <PackageSearch className="h-12 w-12 mx-auto mb-3" />
            <p>No hay productos en esta categoría todavía.</p>
            <Link to="/productos" className="text-farfalla-teal underline text-sm">Ver todos los productos</Link>
          </div>
        )}

        {!loading && shown.length > 0 && (
          <>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {shown.slice(0, visible).map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  slug={p.slug}
                  price={p.price}
                  comparePrice={p.compare_price ?? undefined}
                  image={p.images?.[0] || '/placeholder.svg'}
                  rating={p.rating ?? undefined}
                  reviewCount={p.review_count ?? undefined}
                  badge={p.is_featured ? { text: 'Destacado', type: 'nuevo' } : undefined}
                />
              ))}
            </div>
            {visible < shown.length && (
              <div className="text-center mt-10">
                <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  Mostrar más ({shown.length - visible} restantes)
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Catalog;
