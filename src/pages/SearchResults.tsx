import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, SearchX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  images: string[] | null;
  rating: number | null;
  review_count: number | null;
  is_featured: boolean | null;
}

const SearchResults = () => {
  const [params] = useSearchParams();
  const query = (params.get('q') || '').trim();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>([]);

  useEffect(() => {
    if (!query) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    // search_products aún no está en types.ts (se genera con `supabase gen types`)
    (supabase as unknown as { rpc: (fn: string, args: object) => Promise<{ data: ProductRow[] | null; error: unknown }> })
      .rpc('search_products', { search_query: query })
      .then(({ data, error: rpcError }) => {
        if (cancelled) return;
        if (rpcError) {
          console.error('Error searching products:', rpcError);
          setError(true);
          setProducts([]);
        } else {
          setProducts(data || []);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-poppins font-bold text-farfalla-ink mb-1">
          {query ? <>Resultados para “{query}”</> : 'Buscar productos'}
        </h1>
        {!loading && query && !error && (
          <p className="text-muted-foreground mb-6">
            {products.length} {products.length === 1 ? 'producto encontrado' : 'productos encontrados'}
          </p>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-farfalla-teal" />
          </div>
        )}

        {!loading && error && (
          <p className="text-center text-muted-foreground py-16">No pudimos realizar la búsqueda. Intenta de nuevo en un momento.</p>
        )}

        {!loading && !error && query && products.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <SearchX className="h-12 w-12 mx-auto mb-3" />
            <p>No encontramos productos para “{query}”.</p>
            <p className="text-sm">Prueba con otras palabras o con menos palabras.</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((p) => (
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
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SearchResults;
