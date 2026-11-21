// Solo para administradores: correo de prueba y envío/reenvío de correos de pedido.
import { corsHeaders, json, getAuthUserId, isAdminUser, resolveSiteUrl } from '../_shared/http.ts'
import { getServiceClient, sendEmail } from '../_shared/email.ts'
import { sendOrderEmail, statusToEmailType, OrderEmailType } from '../_shared/orderEmails.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const userId = await getAuthUserId(req)
    if (!userId || !(await isAdminUser(userId))) {
      return json({ success: false, error: 'No autorizado' }, 403)
    }

    const body = await req.json()
    const db = getServiceClient()

    if (body.type === 'test') {
      const to = String(body.to || '').trim()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return json({ success: false, error: 'Correo de destino inválido' }, 400)
      }
      const result = await sendEmail(
        db,
        {
          to,
          subject: 'Prueba de correo - Farfalla Estudio',
          html: '<p>Si recibes este mensaje, la integración con el proveedor de correo funciona.</p>',
          text: 'Si recibes este mensaje, la integración con el proveedor de correo funciona.',
          metadata: { email_type: 'test' },
        },
        { emailType: 'test' },
      )
      return json(result, result.success ? 200 : 502)
    }

    // Envío por cambio de estado (o reenvío de la confirmación)
    if (body.order_id) {
      let emailType: OrderEmailType | null = null
      if (body.type === 'order_confirmation') emailType = 'order_confirmation'
      else if (body.status) emailType = statusToEmailType(String(body.status))
      if (!emailType) return json({ success: true, skipped: true })

      const result = await sendOrderEmail(db, String(body.order_id), emailType, resolveSiteUrl(req))
      return json(result, result.success ? 200 : 502)
    }

    return json({ success: false, error: 'Solicitud inválida' }, 400)
  } catch (error) {
    console.error('send-order-email error:', error)
    return json({ success: false, error: 'Error interno' }, 500)
  }
})
