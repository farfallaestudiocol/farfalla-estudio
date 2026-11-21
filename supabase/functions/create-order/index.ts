import { corsHeaders, json, getAuthUserId, resolveSiteUrl } from '../_shared/http.ts'
import { getServiceClient } from '../_shared/email.ts'
import { sendOrderEmail } from '../_shared/orderEmails.ts'

// Lo que envía el navegador. Los PRECIOS, el envío y los impuestos NO se
// aceptan del cliente: se recalculan aquí. El pago se verifica con Wompi.
interface RequestItem {
  product_id: string
  variant_id?: string | null
  theme_id?: string | null
  quantity: number
  personalization_notes?: string | null
}

interface CreateOrderRequest {
  customer: {
    name: string
    email: string
    phone: string
    document_type?: string
    document_number?: string
  }
  shipping_address: {
    name?: string
    full_address?: string
    street_address: string
    city: string
    state: string
    postal_code?: string
    country?: string
    phone?: string
    latitude?: number | null
    longitude?: number | null
  }
  items: RequestItem[]
  notes?: string
  accepted_terms: boolean
  // Autorización de tratamiento de datos (Ley 1581 de 2012), separada de los términos de compra,
  // y versión del texto que se mostró (prueba de la autorización).
  accepted_privacy: boolean
  policy_version: string
  // id de la transacción de Wompi (result.transaction.id)
  payment_reference: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isBogota = (a: { city?: string; state?: string }) =>
  /bogot[aá]/i.test(a.city || '') || /bogot[aá]/i.test(a.state || '')

class HttpError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

function validate(body: CreateOrderRequest) {
  const c = body?.customer
  if (!c || !c.name?.trim() || c.name.length > 120) throw new HttpError('Nombre inválido')
  if (!c.email || !EMAIL_RE.test(c.email) || c.email.length > 160) throw new HttpError('Correo inválido')
  if (!c.phone || c.phone.replace(/\D/g, '').length < 7) throw new HttpError('Teléfono inválido')
  const a = body.shipping_address
  if (!a || !a.street_address?.trim() || !a.city?.trim() || !a.state?.trim()) {
    throw new HttpError('La dirección de entrega está incompleta')
  }
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 100) {
    throw new HttpError('El carrito está vacío')
  }
  for (const it of body.items) {
    if (!it.product_id || !Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 999) {
      throw new HttpError('Cantidad inválida')
    }
  }
  if (body.accepted_terms !== true) throw new HttpError('Debes aceptar los términos y condiciones')
  if (body.accepted_privacy !== true) throw new HttpError('Debes autorizar el tratamiento de tus datos personales')
  if (typeof body.policy_version !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.policy_version)) {
    throw new HttpError('Versión de la política inválida')
  }
  if (!body.payment_reference || typeof body.payment_reference !== 'string') throw new HttpError('Falta la referencia de pago')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const db = getServiceClient()
    const body: CreateOrderRequest = await req.json()
    validate(body)

    const customerEmail = body.customer.email.trim().toLowerCase()

    // --- Idempotencia: si este pago ya generó un pedido, se devuelve ese ---
    const { data: existing } = await db
      .from('orders')
      .select('id, order_number, total_amount, status, payment_status, customer_email, access_token')
      .eq('payment_method', 'wompi')
      .eq('payment_reference', body.payment_reference)
      .maybeSingle()

    if (existing) {
      const sameCustomer = existing.customer_email?.toLowerCase() === customerEmail
      return json({
        success: true,
        already_exists: true,
        order: {
          id: existing.id,
          order_number: existing.order_number,
          total_amount: existing.total_amount,
          status: existing.status,
          payment_status: existing.payment_status,
          // El token solo se entrega a quien coincide con el correo del pedido.
          access_token: sameCustomer ? existing.access_token : undefined,
        },
      })
    }

    // --- Configuración de la tienda ---
    const { data: settingsRows } = await db
      .from('site_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        'shipping_enabled', 'free_shipping_enabled', 'free_shipping_minimum', 'shipping_cost',
        'shipping_cost_bogota', 'shipping_cost_outside_bogota', 'tax_enabled', 'tax_rate',
        'currency', 'wompi_environment',
      ])
    const cfg: Record<string, string> = {}
    for (const r of settingsRows || []) cfg[r.setting_key] = r.setting_value ?? ''
    const num = (k: string, d = 0) => (cfg[k] !== undefined && cfg[k] !== '' ? parseFloat(cfg[k]) || 0 : d)
    const bool = (k: string, d: boolean) => (cfg[k] === undefined ? d : cfg[k] === 'true')
    const currency = cfg.currency || 'COP'

    // --- Precios reales desde la base de datos ---
    const productIds = [...new Set(body.items.map((i) => i.product_id))]
    const variantIds = [...new Set(body.items.map((i) => i.variant_id).filter(Boolean))] as string[]
    const themeIds = [...new Set(body.items.map((i) => i.theme_id).filter(Boolean))] as string[]

    const [{ data: products }, { data: variants }, { data: themes }] = await Promise.all([
      db.from('products').select('id, name, price, sku, is_active').in('id', productIds),
      variantIds.length
        ? db.from('product_variants').select('id, product_id, name, price, sku, is_active').in('id', variantIds)
        : Promise.resolve({ data: [] as any[] }),
      themeIds.length
        ? db.from('themes').select('id, name').in('id', themeIds)
        : Promise.resolve({ data: [] as any[] }),
    ])
    const pMap = new Map((products || []).map((p: any) => [p.id, p]))
    const vMap = new Map((variants || []).map((v: any) => [v.id, v]))
    const tMap = new Map((themes || []).map((t: any) => [t.id, t]))

    const orderItems = body.items.map((it) => {
      const p: any = pMap.get(it.product_id)
      if (!p || p.is_active === false) throw new HttpError('Un producto del carrito ya no está disponible', 409)
      const v: any = it.variant_id ? vMap.get(it.variant_id) : null
      if (it.variant_id && (!v || v.product_id !== p.id || v.is_active === false)) {
        throw new HttpError('Una variante del carrito ya no está disponible', 409)
      }
      const unitPrice = Math.round(Number(v?.price || p.price))
      const theme: any = it.theme_id ? tMap.get(it.theme_id) : null
      return {
        product_id: p.id,
        variant_id: v?.id ?? null,
        quantity: it.quantity,
        unit_price: unitPrice,
        total_price: unitPrice * it.quantity,
        product_name: p.name,
        variant_name: v?.name ?? null,
        product_sku: v?.sku || p.sku || null,
        theme_id: theme?.id ?? null,
        theme_name: theme?.name ?? null,
        personalization_notes: it.personalization_notes?.toString().slice(0, 2000) || null,
      }
    })

    // --- Envío e impuestos (misma lógica que usa el carrito) ---
    const subtotal = orderItems.reduce((s, i) => s + i.total_price, 0)
    let shipping = 0
    if (bool('shipping_enabled', true)) {
      const freeMin = num('free_shipping_minimum')
      if (bool('free_shipping_enabled', true) && subtotal >= freeMin) {
        shipping = 0
      } else {
        shipping = isBogota(body.shipping_address)
          ? num('shipping_cost_bogota') || num('shipping_cost')
          : num('shipping_cost_outside_bogota') || num('shipping_cost')
      }
    }
    const tax = bool('tax_enabled', true) ? Math.round(subtotal * num('tax_rate', 0.19)) : 0
    const totalAmount = Math.round(subtotal + shipping + tax)

    // --- Verificación del pago con Wompi (no se confía en el navegador) ---
    const isProduction = cfg.wompi_environment === 'production'
    const wompiBase = isProduction ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1'
    const txRes = await fetch(`${wompiBase}/transactions/${encodeURIComponent(body.payment_reference)}`)
    if (!txRes.ok) throw new HttpError('No se pudo verificar el pago con Wompi', 402)
    const tx = (await txRes.json())?.data
    if (!tx || tx.status !== 'APPROVED') throw new HttpError('El pago no está aprobado', 402)
    if (tx.currency !== currency || tx.amount_in_cents !== totalAmount * 100) {
      console.error('Monto no coincide', { esperado: totalAmount * 100, wompi: tx.amount_in_cents, moneda: tx.currency })
      throw new HttpError('El monto pagado no coincide con el total del pedido', 409)
    }

    // --- Crear el pedido ---
    const userId = await getAuthUserId(req)

    const sa = body.shipping_address
    const addressJson = {
      name: sa.name || body.customer.name,
      full_address: sa.full_address || sa.street_address,
      street_address: sa.street_address,
      city: sa.city,
      state: sa.state,
      postal_code: sa.postal_code || null,
      country: sa.country || 'Colombia',
      phone: sa.phone || body.customer.phone,
      latitude: sa.latitude ?? null,
      longitude: sa.longitude ?? null,
    }

    const orderColumns = 'id, order_number, total_amount, status, payment_status, access_token'

    // El número de pedido se calcula como "último + 1": si dos clientes pagan a la
    // vez pueden recibir el mismo número y la restricción única rechaza al segundo.
    // Como el pago ya está aprobado, se reintenta con un número nuevo en vez de fallar.
    let order: any = null
    for (let attempt = 1; attempt <= 5 && !order; attempt++) {
      const { data: orderNumber, error: numErr } = await db.rpc('generate_order_number')
      if (numErr) throw new Error('No se pudo generar el número de pedido')

      const { data, error: orderError } = await db
        .from('orders')
        .insert({
          user_id: userId,
          is_guest: !userId,
          order_number: orderNumber,
          status: 'pending',
          payment_status: 'completed',
          payment_method: 'wompi',
          payment_reference: body.payment_reference,
          total_amount: totalAmount,
          shipping_amount: Math.round(shipping),
          tax_amount: tax,
          discount_amount: 0,
          currency,
          customer_email: customerEmail,
          customer_name: body.customer.name.trim(),
          customer_phone: body.customer.phone.trim(),
          customer_document_type: body.customer.document_type || null,
          customer_document_number: body.customer.document_number?.trim() || null,
          accepted_terms_at: new Date().toISOString(),
          accepted_privacy_at: new Date().toISOString(),
          policy_version: body.policy_version,
          shipping_address: addressJson,
          billing_address: addressJson,
          notes: body.notes?.toString().slice(0, 2000) || null,
        })
        .select(orderColumns)
        .single()

      if (!orderError) {
        order = data
        break
      }

      const isUniqueViolation = (orderError as any).code === '23505'
      const detail = `${orderError.message ?? ''} ${(orderError as any).details ?? ''}`
      if (isUniqueViolation && detail.includes('payment_reference')) {
        // Carrera con otra solicitud del mismo pago: se devuelve el pedido ya creado.
        const { data: dup } = await db
          .from('orders')
          .select(orderColumns)
          .eq('payment_method', 'wompi')
          .eq('payment_reference', body.payment_reference)
          .maybeSingle()
        if (dup) return json({ success: true, already_exists: true, order: dup })
      }
      if (isUniqueViolation && detail.includes('order_number') && attempt < 5) continue

      console.error('Error creating order:', orderError)
      throw new Error('No se pudo crear el pedido')
    }
    if (!order) throw new Error('No se pudo crear el pedido')

    const { error: itemsError } = await db
      .from('order_items')
      .insert(orderItems.map((i) => ({ ...i, order_id: order.id })))

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      await db.from('orders').delete().eq('id', order.id)
      throw new Error('No se pudieron crear los productos del pedido')
    }

    if (userId) {
      const { error: clearErr } = await db.from('cart_items').delete().eq('user_id', userId)
      if (clearErr) console.error('Error clearing cart:', clearErr)
    }

    // Correo de confirmación: un fallo aquí no debe afectar el pedido (queda en email_events)
    // ni retrasar la respuesta al cliente, así que se envía en segundo plano.
    const emailTask = sendOrderEmail(db, order.id, 'order_confirmation', resolveSiteUrl(req))
    const runtime = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime
    if (runtime?.waitUntil) runtime.waitUntil(emailTask)
    else await emailTask

    return json({ success: true, order })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    const message = error instanceof Error ? error.message : 'No se pudo crear el pedido'
    if (status >= 500) console.error('Error in create-order function:', error)
    return json({ success: false, error: message }, status)
  }
})
