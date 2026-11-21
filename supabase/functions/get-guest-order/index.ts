// Consulta pública de un pedido mediante su token secreto (para clientes sin cuenta).
// No se abre RLS a usuarios anónimos: el token es la credencial.
import { corsHeaders, json } from '../_shared/http.ts'
import { getServiceClient } from '../_shared/email.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { token } = await req.json()
    if (typeof token !== 'string' || !UUID.test(token)) return json({ success: false, error: 'Enlace inválido' }, 400)

    const db = getServiceClient()
    const { data: order } = await db
      .from('orders')
      .select('id, order_number, status, payment_status, total_amount, shipping_amount, tax_amount, currency, customer_name, shipping_address, notes, created_at')
      .eq('access_token', token)
      .maybeSingle()

    if (!order) return json({ success: false, error: 'Pedido no encontrado' }, 404)

    const { data: items } = await db
      .from('order_items')
      .select('product_name, variant_name, theme_name, quantity, unit_price, total_price, personalization_notes')
      .eq('order_id', order.id)

    // No se expone el id interno, el correo, el teléfono ni el documento.
    const { id: _id, ...publicOrder } = order
    return json({ success: true, order: publicOrder, items: items || [] })
  } catch (error) {
    console.error('get-guest-order error:', error)
    return json({ success: false, error: 'Error interno' }, 500)
  }
})
