import { supabase } from '@/integrations/supabase/client';

export interface SearchProductRow {
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

type RpcClient = {
  rpc: (fn: string, args: object) => Promise<{ data: SearchProductRow[] | null; error: unknown }>;
};

/**
 * Busca productos con la función search_products de la base: cualquier palabra, en cualquier
 * orden y posición, sin distinguir tildes ni mayúsculas. Los que tienen todas las palabras
 * salen primero. (La función aún no está en types.ts, que se genera con `supabase gen types`.)
 */
export async function searchProducts(query: string, limit = 60): Promise<SearchProductRow[]> {
  const { data, error } = await (supabase as unknown as RpcClient).rpc('search_products', {
    search_query: query,
    max_results: limit,
  });
  if (error) throw error;
  return data || [];
}
