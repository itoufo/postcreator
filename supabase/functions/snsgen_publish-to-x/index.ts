import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // リクエストボディを取得
    const { connection_id, content, hashtags } = await req.json()

    if (!connection_id || !content) {
      throw new Error('connection_idとcontentは必須です')
    }

    // 接続情報を取得
    const { data: connection, error: connectionError } = await supabaseClient
      .from('snsgen_connections')
      .select('*')
      .eq('id', connection_id)
      .eq('sns_type', 'X')
      .eq('is_active', true)
      .single()

    if (connectionError || !connection) {
      throw new Error('SNS接続情報が見つかりません')
    }

    const credentials = connection.credentials as any

    // Twitter API v2を使用して投稿
    // OAuth 1.0a User Contextを使用
    const tweetText = hashtags && hashtags.length > 0
      ? `${content}\n\n${hashtags.join(' ')}`
      : content

    const response = await postToTwitter({
      text: tweetText,
      apiKey: credentials.api_key || Deno.env.get('TWITTER_API_KEY'),
      apiSecret: credentials.api_secret || Deno.env.get('TWITTER_API_SECRET'),
      accessToken: credentials.access_token,
      accessSecret: credentials.token_secret,
    })

    return new Response(
      JSON.stringify({
        success: true,
        tweet_id: response.data.id,
        tweet_url: `https://twitter.com/i/web/status/${response.data.id}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'X (Twitter)への投稿に失敗しました',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function postToTwitter(params: {
  text: string
  apiKey: string
  apiSecret: string
  accessToken: string
  accessSecret: string
}) {
  const { text, apiKey, apiSecret, accessToken, accessSecret } = params

  // OAuth 1.0a署名を生成
  const oauth = {
    oauth_consumer_key: apiKey,
    oauth_token: accessToken,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
    oauth_version: '1.0',
  }

  const url = 'https://api.twitter.com/2/tweets'
  const method = 'POST'
  const body = JSON.stringify({ text })

  // 署名ベース文字列を作成
  const paramString = Object.entries(oauth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')

  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`

  // 署名キーを作成
  const signingKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(accessSecret)}`

  // HMAC-SHA1署名を計算
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(signingKey),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signatureBaseString))
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))

  // Authorizationヘッダーを作成
  const authHeader =
    'OAuth ' +
    Object.entries({ ...oauth, oauth_signature: signatureBase64 })
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${encodeURIComponent(key)}="${encodeURIComponent(value)}"`)
      .join(', ')

  // Twitter APIにリクエスト
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body,
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || errorData.title || 'Twitter APIエラー')
  }

  return await response.json()
}
