-- Catálogo para el chatbot con IA: una fila por producto activo con sus imágenes, variantes
-- (con su imagen) y productos relacionados (la relación se lee en ambos sentidos:
-- product_id → related_product_id y al revés, sin repetir y solo con productos activos).
--
-- security_invoker: la vista respeta las políticas RLS de quien consulta, así que solo se ve
-- lo que ya es público (productos activos y relaciones). No expone costos ni datos de clientes.
create or replace view public.chatbot_product_catalog
with (security_invoker = true) as
select
  p.id,
  p.name,
  p.slug,
  '/producto/' || p.slug                         as url_path,
  p.short_description,
  p.description,
  p.price,
  p.compare_price,
  c.name                                         as category,
  coalesce(p.images, '{}')                       as images,
  coalesce(p.tags, '{}')                         as tags,
  coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', v.id, 'name', v.name, 'sku', v.sku, 'price', v.price, 'image_url', v.image_url
           ) order by v.display_order, v.name)
    from public.product_variants v
    where v.product_id = p.id and v.is_active
  ), '[]'::jsonb)                                as variants,
  coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', q.id, 'name', q.name, 'slug', q.slug, 'url_path', '/producto/' || q.slug,
             'price', q.price, 'image_url', q.images[1], 'relationship_type', q.relationship_type
           ) order by q.strength desc nulls last, q.name)
    from (
      select distinct on (o.id) o.id, o.name, o.slug, o.price, o.images, r.relationship_type, r.strength
      from public.product_relationships r
      join public.products o
        on o.id = case when r.product_id = p.id then r.related_product_id else r.product_id end
      where (r.product_id = p.id or r.related_product_id = p.id)
        and o.is_active and o.id <> p.id
      order by o.id, r.strength desc nulls last
    ) q
  ), '[]'::jsonb)                                as related_products
from public.products p
left join public.categories c on c.id = p.category_id
where p.is_active;

comment on view public.chatbot_product_catalog is
  'Productos activos con variantes (y su imagen) y productos relacionados, para el chatbot con IA.';

grant select on public.chatbot_product_catalog to anon, authenticated;
