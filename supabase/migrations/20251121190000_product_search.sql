-- =====================================================================
-- Buscador de productos: cualquier palabra, en cualquier orden y posición,
-- sin distinguir tildes ni mayúsculas.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- unaccent() no es IMMUTABLE; este envoltorio permite usarlo en índices/triggers.
CREATE OR REPLACE FUNCTION public.f_unaccent(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public, extensions
AS $$
  SELECT extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(input, ''));
$$;

-- "Tabla de búsqueda": texto normalizado de cada producto, mantenido por trigger.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS search_text TEXT NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION public.build_product_search_text(p public.products)
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT public.f_unaccent(lower(concat_ws(' ',
    p.name,
    p.short_description,
    p.description,
    p.sku,
    array_to_string(p.tags, ' '),
    (SELECT c.name FROM public.categories c WHERE c.id = p.category_id),
    (SELECT s.name FROM public.subcategories s WHERE s.id = p.subcategory_id),
    (SELECT string_agg(v.name || ' ' || coalesce(v.sku, ''), ' ')
       FROM public.product_variants v WHERE v.product_id = p.id)
  )));
$$;

CREATE OR REPLACE FUNCTION public.products_set_search_text()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  NEW.search_text := public.build_product_search_text(NEW);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_search_text_trg ON public.products;
CREATE TRIGGER products_search_text_trg
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.products_set_search_text();

-- Si cambia una categoría, subcategoría o variante, se recalcula el producto afectado.
CREATE OR REPLACE FUNCTION public.touch_products_for_search()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  rec RECORD := CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
BEGIN
  IF TG_TABLE_NAME = 'categories' THEN
    UPDATE public.products SET name = name WHERE category_id = rec.id;
  ELSIF TG_TABLE_NAME = 'subcategories' THEN
    UPDATE public.products SET name = name WHERE subcategory_id = rec.id;
  ELSIF TG_TABLE_NAME = 'product_variants' THEN
    UPDATE public.products SET name = name WHERE id = rec.product_id;
  END IF;
  RETURN rec;
END;
$$;

-- Función de trigger: no debe ser invocable desde la API pública.
REVOKE EXECUTE ON FUNCTION public.touch_products_for_search() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS categories_search_touch ON public.categories;
CREATE TRIGGER categories_search_touch
AFTER UPDATE OF name ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.touch_products_for_search();

DROP TRIGGER IF EXISTS subcategories_search_touch ON public.subcategories;
CREATE TRIGGER subcategories_search_touch
AFTER UPDATE OF name ON public.subcategories
FOR EACH ROW EXECUTE FUNCTION public.touch_products_for_search();

DROP TRIGGER IF EXISTS variants_search_touch ON public.product_variants;
CREATE TRIGGER variants_search_touch
AFTER INSERT OR UPDATE OF name, sku OR DELETE ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION public.touch_products_for_search();

-- Relleno inicial de los productos existentes
UPDATE public.products SET name = name;

CREATE INDEX IF NOT EXISTS products_search_text_trgm_idx
  ON public.products USING gin (search_text extensions.gin_trgm_ops);

-- Búsqueda: cada palabra puede estar en cualquier parte y en cualquier orden.
-- Primero salen los productos que contienen TODAS las palabras; después los que
-- contienen algunas. Dentro de cada grupo, pesan más las coincidencias en el nombre.
CREATE OR REPLACE FUNCTION public.search_products(search_query TEXT, max_results INTEGER DEFAULT 60)
RETURNS SETOF public.products
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  all_tokens TEXT[];
  tokens TEXT[];
  n INTEGER;
BEGIN
  SELECT array_agg(DISTINCT t) INTO all_tokens
  FROM unnest(regexp_split_to_array(public.f_unaccent(lower(coalesce(search_query, ''))), '[^a-z0-9]+')) AS t
  WHERE length(t) >= 2;

  IF all_tokens IS NULL THEN
    RETURN;
  END IF;

  -- Se ignoran conectores ("de", "para"...) salvo que sean lo único escrito
  SELECT array_agg(t) INTO tokens
  FROM unnest(all_tokens) AS t
  WHERE t NOT IN ('de','la','el','los','las','con','para','por','una','uno','del','que','y','en','un');
  IF tokens IS NULL THEN
    tokens := all_tokens;
  END IF;
  n := array_length(tokens, 1);

  RETURN QUERY
  SELECT p.*
  FROM public.products p
  CROSS JOIN LATERAL (
    SELECT
      count(*) FILTER (WHERE p.search_text LIKE '%' || t || '%') AS hits,
      count(*) FILTER (WHERE public.f_unaccent(lower(p.name)) LIKE '%' || t || '%') AS name_hits
    FROM unnest(tokens) AS t
  ) s
  WHERE p.is_active = true
    AND s.hits >= 1
  ORDER BY (s.hits = n) DESC, s.hits DESC, s.name_hits DESC, p.name
  LIMIT greatest(1, least(coalesce(max_results, 60), 200));
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_products(TEXT, INTEGER) TO anon, authenticated;
