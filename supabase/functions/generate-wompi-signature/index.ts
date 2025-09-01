import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SignatureRequest {
  amount: number
  currency: string
  reference: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get request data
    const { amount, currency, reference }: SignatureRequest = await req.json()

    // Get Wompi environment setting
    const { data: envSetting } = await supabaseClient
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'wompi_environment')
      .single()

    const isProduction = envSetting?.setting_value === 'production'
    
    // Get the appropriate integrity secret
    const integritySecret = isProduction 
      ? Deno.env.get('WOMPI_PROD_INTEGRITY_SECRET')
      : Deno.env.get('WOMPI_TEST_INTEGRITY_SECRET')

    if (!integritySecret) {
      throw new Error('Wompi integrity secret not configured')
    }

    // Convert amount to cents (Wompi expects cents)
    const amountInCents = Math.round(amount * 100)

    // Create the string to sign: reference+amount_in_cents+currency+integrity_secret (concatenated without separators)
    const stringToSign = `${reference}${amountInCents}${currency}${integritySecret}`

    console.log('Generating signature for:', { reference, amountInCents, currency })

    // Generate SHA256 hash
    const encoder = new TextEncoder()
    const data = encoder.encode(stringToSign)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Get public key based on environment
    const publicKey = isProduction 
      ? Deno.env.get('WOMPI_PROD_PUBLIC_KEY')
      : Deno.env.get('WOMPI_TEST_PUBLIC_KEY')

    return new Response(
      JSON.stringify({
        signature,
        amountInCents,
        publicKey,
        environment: isProduction ? 'production' : 'test'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error generating Wompi signature:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate signature' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})