-- Arreglo manual aplicado por SoFactory (referencia ambigua y ORDER BY en UNION).
-- Ya está aplicado en la base de Farfalla; se conserva aquí para que el historial quede completo.

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_frequently_bought_together(uuid, integer);
DROP FUNCTION IF EXISTS get_product_recommendations(uuid, integer);

-- 1. Fix for get_frequently_bought_together function
-- Corrects an ambiguous column reference for 'product_id'.

CREATE OR REPLACE FUNCTION get_frequently_bought_together(target_product_id uuid, limit_count integer)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  price integer,
  image text,
  co_purchase_count bigint,
  confidence_score decimal
) AS $$
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
        WHERE order_items.product_id = target_product_id -- Corrected ambiguous reference
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
    END as image,
    cpp.co_purchase_count,
    cpp.confidence_score
  FROM co_purchased_products cpp
  JOIN products p ON cpp.product_id = p.id
  WHERE p.is_active = true
  ORDER BY cpp.confidence_score DESC, cpp.co_purchase_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 2. Fix for get_product_recommendations function
-- Corrects the 'invalid UNION/INTERSECT/EXCEPT ORDER BY clause' error by aliasing columns.

CREATE OR REPLACE FUNCTION get_product_recommendations(target_product_id uuid, limit_count integer)
RETURNS TABLE(
  product_id uuid,
  product_name text,
  product_slug text,
  product_price integer,
  product_image text,
  relationship_type text,
  strength integer,
  reason text
) AS $$
BEGIN
  RETURN QUERY
  -- Manual relationships first
  SELECT 
    p.id as product_id,
    p.name as product_name,
    p.slug as product_slug,
    p.price as product_price,
    CASE 
      WHEN array_length(p.images, 1) > 0 THEN p.images[1]
      ELSE NULL
    END as product_image,
    pr.relationship_type,
    pr.strength,
    CASE pr.relationship_type
      WHEN 'complementary' THEN 'Perfecto complemento'
      WHEN 'upsell' THEN 'Versión premium'
      ELSE 'Producto relacionado'
    END as reason
  FROM product_relationships pr
  JOIN products p ON pr.related_product_id = p.id
  WHERE pr.product_id = target_product_id 
    AND p.is_active = true
  
  UNION ALL
  
  -- Frequently bought together (auto-analysis)
  SELECT 
    fbt.id as product_id,
    fbt.name as product_name,
    fbt.slug as product_slug,
    fbt.price as product_price,
    fbt.image as product_image,
    'frequently_bought_together'::TEXT as relationship_type,
    CASE 
      WHEN fbt.confidence_score >= 0.5 THEN 10
      WHEN fbt.confidence_score >= 0.3 THEN 8
      WHEN fbt.confidence_score >= 0.2 THEN 6
      ELSE 4
    END as strength,
    'Frecuentemente comprado junto' as reason
  FROM get_frequently_bought_together(target_product_id, 4) fbt
  
  ORDER BY strength DESC, relationship_type
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
