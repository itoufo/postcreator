import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PersonaProposal {
  name: string;
  target_age: string;
  interests: string[];
  pain_points: string[];
  benefits: string[];
  rationale: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { messages, action } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages array is required');
    }

    const claudeApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!claudeApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Build system prompt based on action
    let systemPrompt = '';

    if (action === 'chat') {
      systemPrompt = `あなたはSNSマーケティングの専門家であり、ターゲットペルソナの作成を支援します。

ユーザーと対話しながら、以下の情報を自然に引き出してください：
1. ターゲット年齢層（例: 25-34歳）
2. 興味・関心（例: AI, スキルアップ, 副業）
3. 課題・悩み（例: 時間がない, 何から始めるか分からない）
4. 提供価値（例: 短時間で成果, 実践的な知識）

重要なガイドライン：
- 一度にすべてを聞かず、自然な会話の流れで段階的に情報を引き出す
- ユーザーの回答に基づいて、より具体的な質問をする
- 具体例を提示して、ユーザーが答えやすくする
- 3-5回のやり取りで十分な情報を集める
- 情報が十分に集まったら、「それでは、いくつかペルソナを提案しますね！」と伝え、最後のメッセージに「[READY_FOR_PROPOSALS]」というマーカーを含める

会話は日本語で、フレンドリーかつプロフェッショナルなトーンで行ってください。`;
    } else if (action === 'generate_proposals') {
      systemPrompt = `あなたはSNSマーケティングの専門家です。これまでの会話から、3つの異なるペルソナ案を提案してください。

各ペルソナは以下の形式のJSONで出力してください：

{
  "personas": [
    {
      "name": "ペルソナの名前（例: 忙しい若手ビジネスパーソン）",
      "target_age": "年齢層（例: 25-34）",
      "interests": ["興味1", "興味2", "興味3"],
      "pain_points": ["課題1", "課題2", "課題3"],
      "benefits": ["提供価値1", "提供価値2", "提供価値3"],
      "rationale": "なぜこのペルソナを提案するのか、1-2文で説明"
    }
  ]
}

重要：
- 3つの異なる角度からペルソナを提案する（例: 初心者向け、中級者向け、専門家向け）
- 各ペルソナは具体的で実用的であること
- 会話から得られた情報を活用すること
- JSONのみを出力し、他のテキストは含めない`;
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Claude API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const assistantMessage = data.content[0].text;

    // Check if ready for proposals
    const isReadyForProposals = assistantMessage.includes('[READY_FOR_PROPOSALS]');
    const cleanedMessage = assistantMessage.replace('[READY_FOR_PROPOSALS]', '').trim();

    return new Response(
      JSON.stringify({
        message: cleanedMessage,
        ready_for_proposals: isReadyForProposals,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
