-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION get_frequently_bought_together(target_product_id UUID, limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_slug TEXT,
  product_price INTEGER,
  product_image TEXT,
  co_purchase_count BIGINT,
  confidence_score DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH product_orders AS (
    -- Get all orders that contain the target product
    SELECT DISTINCT oi1.order_id
    FROM order_items oi1
    WHERE oi1.product_id = target_product_id
  ),
  co_purchased_products AS (
    -- Get all other products in those same orders
    SELECT 
      oi2.product_id,
      COUNT(*) as co_purchase_count,
      COUNT(*)::DECIMAL / (
        SELECT COUNT(DISTINCT order_id) 
        FROM order_items 
        WHERE product_id = target_product_id
      ) as confidence_score
    FROM product_orders po
    JOIN order_items oi2 ON po.order_id = oi2.order_id
    WHERE oi2.product_id != target_product_id
    GROUP BY oi2.product_id
    HAVING COUNT(*) >= 2 -- At least 2 co-purchases
  )
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.price,
    CASE 
      WHEN array_length(p.images, 1) > 0 THEN p.images[1]
      ELSE NULL
    END,
    cpp.co_purchase_count,
    cpp.confidence_score
  FROM co_purchased_products cpp
  JOIN products p ON cpp.product_id = p.id
  WHERE p.is_active = true
  ORDER BY cpp.confidence_score DESC, cpp.co_purchase_count DESC
  LIMIT limit_count;
END;
$$;

-- Create function to get recommended products (combines manual relationships and auto-analysis)
CREATE OR REPLACE FUNCTION get_product_recommendations(target_product_id UUID, limit_count INTEGER DEFAULT 8)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_slug TEXT,
  product_price INTEGER,
  product_image TEXT,
  recommendation_type TEXT,
  strength INTEGER,
  reason TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Manual relationships first
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.price,
    CASE 
      WHEN array_length(p.images, 1) > 0 THEN p.images[1]
      ELSE NULL
    END,
    pr.relationship_type,
    pr.strength,
    CASE pr.relationship_type
      WHEN 'complementary' THEN 'Perfecto complemento'
      WHEN 'upsell' THEN 'Versión premium'
      ELSE 'Producto relacionado'
    END
  FROM product_relationships pr
  JOIN products p ON pr.related_product_id = p.id
  WHERE pr.product_id = target_product_id 
    AND p.is_active = true
  
  UNION ALL
  
  -- Frequently bought together (auto-analysis)
  SELECT 
    fbt.product_id,
    fbt.product_name,
    fbt.product_slug,
    fbt.product_price,
    fbt.product_image,
    'frequently_bought_together'::TEXT,
    CASE 
      WHEN fbt.confidence_score >= 0.5 THEN 10
      WHEN fbt.confidence_score >= 0.3 THEN 8
      WHEN fbt.confidence_score >= 0.2 THEN 6
      ELSE 4
    END,
    'Frecuentemente comprado junto'
  FROM get_frequently_bought_together(target_product_id, 4) fbt
  
  ORDER BY strength DESC, recommendation_type
  LIMIT limit_count;
END;
$$;