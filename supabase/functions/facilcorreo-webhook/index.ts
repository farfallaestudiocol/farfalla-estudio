// Recibe los webhooks de Fácil Correo (entrega, rebote, queja, apertura, clic...) y
// actualiza email_events. Ver _shared/facilcorreoWebhook.ts.
//
// Se configura en Fácil Correo → Webhooks con la URL de esta función; el secreto de firma
// que muestra una sola vez se guarda en Configuración → Correo.
import { corsHeaders, json } from '../_shared/http.ts'
import { getServiceClient, loadEmailSettings } from '../_shared/email.ts'
import { applyEvent, ProviderEvent, verifySignature } from '../_shared/facilcorreoWebhook.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const db = getServiceClient()
  // Cuerpo crudo: la firma se calcula sobre él, sin re-serializar.
  const rawBody = await req.text()

  const settings = await loadEmailSettings(db)
  // El endpoint es público: sin secreto no se aceptan eventos.
  if (!settings?.webhook_secret) return json({ error: 'Webhook no configurado' }, 503)

  const signature = req.headers.get('FacilCorreo-Signature')
  if (!(await verifySignature(settings.webhook_secret, signature, rawBody))) {
    return json({ error: 'Firma inválida' }, 401)
  }

  let evt: ProviderEvent
  try {
    evt = JSON.parse(rawBody)
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }

  // Se responde 2xx de inmediato y se procesa aparte (el proveedor reintenta si tarda).
  const work = applyEvent(db, evt).catch((err) => console.error('Error aplicando evento:', err))
  const runtime = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime
  if (runtime?.waitUntil) runtime.waitUntil(work)
  else await work

  return json({ success: true })
})
