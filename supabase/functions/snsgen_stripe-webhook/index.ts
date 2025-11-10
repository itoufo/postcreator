import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('SNSGEN_STRIPE_WEBHOOK_SECRET')

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    )

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const priceId = subscription.items.data[0].price.id

        // プランタイプを価格IDから判定
        let planType = 'free'
        if (priceId === Deno.env.get('SNSGEN_STRIPE_BASIC_PRICE_ID')) {
          planType = 'basic'
        } else if (priceId === Deno.env.get('SNSGEN_STRIPE_PRO_PRICE_ID')) {
          planType = 'pro'
        } else if (priceId === Deno.env.get('SNSGEN_STRIPE_ENTERPRISE_PRICE_ID')) {
          planType = 'enterprise'
        }

        // サブスクリプション情報を更新
        const { error } = await supabase
          .from('snsgen_subscriptions')
          .update({
            plan_type: planType,
            status: subscription.status,
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
          })
          .eq('stripe_customer_id', customerId)

        if (error) throw error
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // フリープランに戻す
        const { error } = await supabase
          .from('snsgen_subscriptions')
          .update({
            plan_type: 'free',
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        if (error) throw error
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // 支払い成功時はステータスをactiveに更新
        const { error } = await supabase
          .from('snsgen_subscriptions')
          .update({
            status: 'active',
          })
          .eq('stripe_customer_id', customerId)

        if (error) throw error
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { error } = await supabase
          .from('snsgen_subscriptions')
          .update({
            status: 'past_due',
          })
          .eq('stripe_customer_id', customerId)

        if (error) throw error
        break
      }

      case 'invoice.payment_action_required': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // 追加認証が必要な場合
        const { error } = await supabase
          .from('snsgen_subscriptions')
          .update({
            status: 'past_due',
          })
          .eq('stripe_customer_id', customerId)

        if (error) throw error
        break
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // トライアル終了3日前の通知（ログのみ、必要に応じてメール送信など）
        console.log(`Trial ending soon for customer: ${customerId}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('Error processing webhook:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400 }
    )
  }
})
