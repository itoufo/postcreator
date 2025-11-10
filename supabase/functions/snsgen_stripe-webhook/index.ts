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
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        // サブスクリプション情報を取得
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0].price.id

        // プランタイプを価格IDから判定
        let planType = 'free'
        let planName = 'Free'
        if (priceId === Deno.env.get('SNSGEN_STRIPE_BASIC_PRICE_ID')) {
          planType = 'basic'
          planName = 'Basic'
        } else if (priceId === Deno.env.get('SNSGEN_STRIPE_PRO_PRICE_ID')) {
          planType = 'pro'
          planName = 'Pro'
        } else if (priceId === Deno.env.get('SNSGEN_STRIPE_ENTERPRISE_PRICE_ID')) {
          planType = 'enterprise'
          planName = 'Enterprise'
        }

        // stripe_customer_idでユーザーのサブスクリプション情報を検索
        const { data: existingSubData } = await supabase
          .from('snsgen_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()

        let subData = existingSubData

        if (existingSubData) {
          // 既存のサブスクリプション情報を更新
          const { data: updatedData, error } = await supabase
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
            .select('user_id')
            .single()

          if (error) {
            console.error('Error updating subscription:', error)
            throw error
          }
          subData = updatedData
        } else {
          console.log(`No subscription found for customer ${customerId}, skipping update`)
        }

        // ウェルカムメール送信
        if (subData) {
          const { data: userData } = await supabase.auth.admin.getUserById(subData.user_id)

          if (userData?.user?.email) {
            const periodEnd = new Date(subscription.current_period_end * 1000).toLocaleDateString('ja-JP')

            const emailSubject = `【PostCreator】${planName}プランへのご登録ありがとうございます`
            const emailBody = `
PostCreatorをご利用いただきありがとうございます。

${planName}プランへのご登録が完了しました。

■ サブスクリプション情報
- プラン: ${planName}
- ステータス: アクティブ
- 次回更新日: ${periodEnd}

サブスクリプションの詳細は、以下のページからご確認いただけます：
${Deno.env.get('SITE_URL')}/subscription

ご不明な点がございましたら、お気軽にお問い合わせください。

---
PostCreator運営チーム
株式会社ウォーカー 新人類育成計画/BizITCo
            `.trim()

            console.log(`Checkout completed - Welcome email for: ${userData.user.email}`)
            console.log(`Subject: ${emailSubject}`)
            console.log(`Body: ${emailBody}`)
          }
        }

        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const priceId = subscription.items.data[0].price.id

        // プランタイプを価格IDから判定
        let planType = 'free'
        let planName = 'Free'
        if (priceId === Deno.env.get('SNSGEN_STRIPE_BASIC_PRICE_ID')) {
          planType = 'basic'
          planName = 'Basic'
        } else if (priceId === Deno.env.get('SNSGEN_STRIPE_PRO_PRICE_ID')) {
          planType = 'pro'
          planName = 'Pro'
        } else if (priceId === Deno.env.get('SNSGEN_STRIPE_ENTERPRISE_PRICE_ID')) {
          planType = 'enterprise'
          planName = 'Enterprise'
        }

        // サブスクリプション情報を更新
        const { data: subData, error } = await supabase
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
          .select('user_id')
          .maybeSingle()

        if (error) throw error

        // サブスクリプション作成時のみメール送信
        if (event.type === 'customer.subscription.created' && subData) {
          // ユーザー情報を取得
          const { data: userData } = await supabase.auth.admin.getUserById(subData.user_id)

          if (userData?.user?.email) {
            const periodEnd = new Date(subscription.current_period_end * 1000).toLocaleDateString('ja-JP')

            // Supabaseのメール送信機能を使用
            await supabase.auth.admin.generateLink({
              type: 'email',
              email: userData.user.email,
              options: {
                redirectTo: `${Deno.env.get('SITE_URL')}/subscription`
              }
            })

            // カスタムメール送信（Resendなどを使用する場合）
            const emailSubject = `【PostCreator】${planName}プランへのご登録ありがとうございます`
            const emailBody = `
PostCreatorをご利用いただきありがとうございます。

${planName}プランへのご登録が完了しました。

■ サブスクリプション情報
- プラン: ${planName}
- ステータス: アクティブ
- 次回更新日: ${periodEnd}

サブスクリプションの詳細は、以下のページからご確認いただけます：
${Deno.env.get('SITE_URL')}/subscription

ご不明な点がございましたら、お気軽にお問い合わせください。

---
PostCreator運営チーム
株式会社ウォーカー 新人類育成計画/BizITCo
            `.trim()

            console.log(`Subscription created email would be sent to: ${userData.user.email}`)
            console.log(`Subject: ${emailSubject}`)
            console.log(`Body: ${emailBody}`)

            // 実際のメール送信は環境変数でResend APIキーなどが設定されている場合のみ
            // TODO: Resend等のメールサービスと統合
          }
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // フリープランに戻す
        const { data: subData, error } = await supabase
          .from('snsgen_subscriptions')
          .update({
            plan_type: 'free',
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)
          .select('user_id')
          .maybeSingle()

        if (error) throw error

        // キャンセル通知メール
        if (subData) {
          const { data: userData } = await supabase.auth.admin.getUserById(subData.user_id)

          if (userData?.user?.email) {
            const emailSubject = '【PostCreator】サブスクリプションがキャンセルされました'
            const emailBody = `
PostCreatorをご利用いただきありがとうございます。

サブスクリプションがキャンセルされ、Freeプランに変更されました。

引き続きFreeプランの機能はご利用いただけます。
再度有料プランにアップグレードされる場合は、以下のページからお手続きください：
${Deno.env.get('SITE_URL')}/subscription

今後ともPostCreatorをよろしくお願いいたします。

---
PostCreator運営チーム
株式会社ウォーカー 新人類育成計画/BizITCo
            `.trim()

            console.log(`Subscription canceled email would be sent to: ${userData.user.email}`)
            console.log(`Subject: ${emailSubject}`)
            console.log(`Body: ${emailBody}`)
          }
        }

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
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: subData, error } = await supabase
          .from('snsgen_subscriptions')
          .update({
            status: 'past_due',
          })
          .eq('stripe_customer_id', customerId)
          .select('user_id')
          .maybeSingle()

        if (error) throw error

        // 支払い失敗通知メール
        if (subData) {
          const { data: userData } = await supabase.auth.admin.getUserById(subData.user_id)

          if (userData?.user?.email) {
            const emailSubject = '【PostCreator】お支払いが失敗しました'
            const emailBody = `
PostCreatorをご利用いただきありがとうございます。

サブスクリプションの支払い処理が失敗しました。

お支払い方法をご確認いただき、更新をお願いいたします。
以下のページから支払い方法を更新できます：
${Deno.env.get('SITE_URL')}/subscription

お支払いが確認できない場合、サービスのご利用が制限される可能性がございます。

---
PostCreator運営チーム
株式会社ウォーカー 新人類育成計画/BizITCo
            `.trim()

            console.log(`Payment failed email would be sent to: ${userData.user.email}`)
            console.log(`Subject: ${emailSubject}`)
            console.log(`Body: ${emailBody}`)
          }
        }

        break
      }

      case 'invoice.payment_action_required': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // 追加認証が必要な場合
        await supabase
          .from('snsgen_subscriptions')
          .update({
            status: 'past_due',
          })
          .eq('stripe_customer_id', customerId)
        break
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // トライアル終了通知メール
        const { data: subData } = await supabase
          .from('snsgen_subscriptions')
          .select('user_id, plan_type')
          .eq('stripe_customer_id', customerId)
          .single()

        if (subData) {
          const { data: userData } = await supabase.auth.admin.getUserById(subData.user_id)
          const trialEndDate = new Date(subscription.trial_end! * 1000).toLocaleDateString('ja-JP')

          if (userData?.user?.email) {
            const emailSubject = '【PostCreator】トライアル期間終了のお知らせ'
            const emailBody = `
PostCreatorをご利用いただきありがとうございます。

トライアル期間が間もなく終了します。

■ トライアル終了日: ${trialEndDate}

トライアル期間終了後は、自動的に有料プランへ移行します。
継続をご希望されない場合は、以下のページからキャンセルできます：
${Deno.env.get('SITE_URL')}/subscription

引き続きPostCreatorをご利用いただけますと幸いです。

---
PostCreator運営チーム
株式会社ウォーカー 新人類育成計画/BizITCo
            `.trim()

            console.log(`Trial ending email would be sent to: ${userData.user.email}`)
            console.log(`Subject: ${emailSubject}`)
            console.log(`Body: ${emailBody}`)
          }
        }

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
