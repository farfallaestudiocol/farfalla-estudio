import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProductRecommendation {
  product_id: string;
  product_name: string;
  product_slug: string;
  product_price: number;
  product_image: string | null;
  recommendation_type: string;
  strength: number;
  reason: string;
}

export const useProductRecommendations = (productId: string | null) => {
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    if (!productId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('get_product_recommendations', {
        target_product_id: productId,
        limit_count: 8
      });

      if (rpcError) {
        throw rpcError;
      }

      setRecommendations(data || []);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar recomendaciones');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [productId]);

  return {
    recommendations,
    isLoading,
    error,
    refetch: fetchRecommendations
  };
};

export const useFrequentlyBoughtTogether = (productId: string | null) => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchFrequentlyBought = async () => {
      if (!productId) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_frequently_bought_together', {
          target_product_id: productId,
          limit_count: 4
        });

        if (!error && data) {
          setProducts(data);
        }
      } catch (err) {
        console.error('Error fetching frequently bought together:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFrequentlyBought();
  }, [productId]);

  return { products, isLoading };
};