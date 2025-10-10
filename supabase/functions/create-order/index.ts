import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderItem {
  product_id: string
  variant_id?: string
  quantity: number
  unit_price: number
  product_name: string
  variant_name?: string
  product_sku?: string
  theme_id?: string
  theme_name?: string
  personalization_notes?: string
}

interface CreateOrderRequest {
  customer_email: string
  customer_name: string
  customer_phone?: string
  shipping_address?: any
  billing_address?: any
  items: OrderItem[]
  shipping_amount?: number
  tax_amount?: number
  discount_amount?: number
  currency: string
  payment_method: string
  payment_reference: string
  notes?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const orderData: CreateOrderRequest = await req.json()

    console.log('Creating order with data:', orderData)

    // Calculate total amount
    const subtotal = orderData.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
    const totalAmount = subtotal + (orderData.shipping_amount || 0) + (orderData.tax_amount || 0) - (orderData.discount_amount || 0)

    // Generate order number using database function
    const { data: orderNumberData, error: orderNumberError } = await supabaseClient
      .rpc('generate_order_number')

    if (orderNumberError) {
      console.error('Error generating order number:', orderNumberError)
      throw new Error('Failed to generate order number')
    }

    const orderNumber = orderNumberData

    // Get user ID from auth if available
    const authHeader = req.headers.get('authorization')
    let userId = null
    
    if (authHeader) {
      const supabaseAuth = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      )
      
      const { data: { user } } = await supabaseAuth.auth.getUser(authHeader.replace('Bearer ', ''))
      userId = user?.id || null
    }

    // Create the order
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: userId,
        order_number: orderNumber,
        status: 'pending',
        payment_status: 'completed',
        payment_method: orderData.payment_method,
        payment_reference: orderData.payment_reference,
        total_amount: Math.round(totalAmount),
        shipping_amount: Math.round(orderData.shipping_amount || 0),
        tax_amount: Math.round(orderData.tax_amount || 0),
        discount_amount: Math.round(orderData.discount_amount || 0),
        currency: orderData.currency,
        customer_email: orderData.customer_email,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        shipping_address: orderData.shipping_address,
        billing_address: orderData.billing_address,
        notes: orderData.notes
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      throw new Error('Failed to create order')
    }

    console.log('Order created:', order)

    // Create order items
    const orderItemsData = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: Math.round(item.unit_price),
      total_price: Math.round(item.unit_price * item.quantity),
      product_name: item.product_name,
      variant_name: item.variant_name,
      product_sku: item.product_sku,
      theme_id: item.theme_id,
      theme_name: item.theme_name,
      personalization_notes: item.personalization_notes
    }))

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItemsData)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      // Try to clean up the order if items creation failed
      await supabaseClient.from('orders').delete().eq('id', order.id)
      throw new Error('Failed to create order items')
    }

    console.log('Order items created successfully')

    // If user is authenticated, clear their cart
    if (userId) {
      const { error: clearCartError } = await supabaseClient
        .from('cart_items')
        .delete()
        .eq('user_id', userId)

      if (clearCartError) {
        console.error('Error clearing cart:', clearCartError)
        // Don't throw error here as the order was created successfully
      } else {
        console.log('Cart cleared for user:', userId)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          order_number: order.order_number,
          total_amount: order.total_amount,
          status: order.status,
          payment_status: order.payment_status
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in create-order function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})