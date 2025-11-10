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
      .eq('sns_type', 'Threads')
      .eq('is_active', true)
      .single()

    if (connectionError || !connection) {
      throw new Error('SNS接続情報が見つかりません')
    }

    const credentials = connection.credentials as any
    const metadata = connection.metadata as any

    // Threads API v1を使用して投稿
    // https://developers.facebook.com/docs/threads/posts
    const threadText = hashtags && hashtags.length > 0
      ? `${content}\n\n${hashtags.join(' ')}`
      : content

    const response = await postToThreads({
      text: threadText,
      accessToken: credentials.access_token,
      userId: metadata.user_id || credentials.user_id,
    })

    return new Response(
      JSON.stringify({
        success: true,
        thread_id: response.id,
        thread_url: `https://www.threads.net/t/${response.id}`,
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
        error: error.message || 'Threadsへの投稿に失敗しました',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function postToThreads(params: {
  text: string
  accessToken: string
  userId: string
}) {
  const { text, accessToken, userId } = params

  // Step 1: Create a Threads Media Container
  const createContainerUrl = `https://graph.threads.net/v1.0/${userId}/threads`

  const containerResponse = await fetch(createContainerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      media_type: 'TEXT',
      text: text,
      access_token: accessToken,
    }),
  })

  if (!containerResponse.ok) {
    const errorData = await containerResponse.json()
    throw new Error(errorData.error?.message || 'Threads container作成エラー')
  }

  const containerData = await containerResponse.json()
  const containerId = containerData.id

  // Step 2: Publish the Threads Media Container
  const publishUrl = `https://graph.threads.net/v1.0/${userId}/threads_publish`

  const publishResponse = await fetch(publishUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: accessToken,
    }),
  })

  if (!publishResponse.ok) {
    const errorData = await publishResponse.json()
    throw new Error(errorData.error?.message || 'Threads公開エラー')
  }

  return await publishResponse.json()
}
