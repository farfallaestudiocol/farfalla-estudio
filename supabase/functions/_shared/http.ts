import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/** Devuelve el id del usuario autenticado, o null (p. ej. cuando solo viaja la anon key). */
export async function getAuthUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null
  const client = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  )
  const { data } = await client.auth.getUser(authHeader.replace(/^Bearer\s+/i, ''))
  return data?.user?.id ?? null
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const db = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
  const { data } = await db.from('profiles').select('role').eq('id', userId).maybeSingle()
  return data?.role === 'admin'
}

/** URL pública del sitio para armar enlaces en los correos. */
export function resolveSiteUrl(req: Request): string {
  const fromEnv = Deno.env.get('SITE_URL')
  if (fromEnv) return fromEnv
  const origin = req.headers.get('origin')
  return origin || 'https://farfallaestudio.com.co'
}
