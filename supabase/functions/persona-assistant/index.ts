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
    // Parse request body
    const { messages, action } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages array is required');
    }

    const claudeApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!claudeApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    console.log('API Key exists:', !!claudeApiKey, 'Length:', claudeApiKey?.length);

    // Build system prompt based on action
    let systemPrompt = '';

    if (action === 'chat') {
      systemPrompt = `あなたはSNSマーケティングの専門家であり、ターゲットペルソナの作成を支援します。

ユーザーと対話しながら、以下の情報を自然に引き出してください：
1. ターゲット年齢層（例: 25-34歳）
2. 興味・関心（例: AI, スキルアップ, 副業）
3. 課題・悩み（例: 時間がない, 何から始めるか分からない）
4. 提供価値（例: 短時間で成果, 実践的な知識）
5. ストーリー（難関→救い→成功）：
   - どんな難関や課題を抱えているか
   - どんな商品・サービス（救い）で解決するか
   - その結果どんな成功を手に入れるか

重要なガイドライン：
- 一度にすべてを聞かず、自然な会話の流れで段階的に情報を引き出す
- ユーザーの回答に基づいて、より具体的な質問をする
- 具体例を提示して、ユーザーが答えやすくする
- ストーリーは共感を生むための重要な要素なので、具体的に引き出す
- 5-7回のやり取りで十分な情報を集める
- 情報が十分に集まったら、「それでは、いくつかペルソナを提案しますね！」と伝え、最後のメッセージに「[READY_FOR_PROPOSALS]」というマーカーを含める

会話は日本語で、フレンドリーかつプロフェッショナルなトーンで行ってください。`;
    } else if (action === 'generate_proposals') {
      systemPrompt = `あなたはJSON生成APIです。これまでの会話から、3つの異なるペルソナ案をJSON形式で出力してください。

**絶対に守ること：**
- 出力は必ず有効なJSONのみ
- 説明文、挨拶、コメントは一切不要
- 最初の文字は必ず「{」で始まる
- 最後の文字は必ず「}」で終わる
- JSON以外のテキストを含めてはいけない

**出力フォーマット（必ずこの構造を守る）：**

{
  "personas": [
    {
      "name": "ペルソナの名前",
      "target_age": "年齢層",
      "interests": ["興味1", "興味2", "興味3"],
      "pain_points": ["課題1", "課題2", "課題3"],
      "benefits": ["提供価値1", "提供価値2", "提供価値3"],
      "story": {
        "hardship": "難関・課題の具体的な描写（2-3文）",
        "solution": "救い・商品による解決策の描写（2-3文）",
        "success": "成功・結果の具体的な描写（2-3文）"
      },
      "rationale": "なぜこのペルソナを提案するのか（1-2文）"
    }
  ]
}

**ペルソナ作成のガイドライン：**
- 3つの異なる角度から提案（初心者/中級者/専門家など）
- 各ペルソナは具体的で実用的に
- ストーリーは「難関→救い→成功」の流れ
- 会話から得られた情報を活用

**重要：このレスポンスはプログラムが解析するため、JSON以外の一切のテキストを含めないでください。**`;
    }

    // Call Claude API
    let apiMessages = messages;

    // For generate_proposals, create a single summarized message
    if (action === 'generate_proposals') {
      // Extract all user responses from conversation
      const conversationSummary = messages
        .map((msg, idx) => `${idx + 1}. ${msg.role === 'user' ? 'ユーザー' : 'AI'}: ${msg.content}`)
        .join('\n');

      apiMessages = [
        {
          role: 'user',
          content: `以下の会話履歴から3つのペルソナをJSON形式で生成してください：\n\n${conversationSummary}\n\nJSON形式で出力してください。説明は不要です。`,
        },
        {
          role: 'assistant',
          content: '{',
        },
      ];
    }

    const requestBody = {
      model: "claude-sonnet-4-5",
      max_tokens: 3000,
      system: systemPrompt,
      messages: apiMessages,
    };

    console.log('Claude API request (action: ' + action + '):', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API error response:', errorData);
      throw new Error(`Claude API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('Claude API response:', JSON.stringify(data, null, 2));

    // Validate response structure
    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      console.error('Invalid Claude API response structure:', data);
      throw new Error('Invalid response from Claude API: missing content');
    }

    if (!data.content[0].text) {
      console.error('Invalid Claude API content:', data.content[0]);
      throw new Error('Invalid response from Claude API: missing text in content');
    }

    const assistantMessage = data.content[0].text;

    // For generate_proposals, prepend the { we sent and extract JSON
    let finalMessage = assistantMessage;
    if (action === 'generate_proposals') {
      // We sent { as assistant message, so prepend it back
      finalMessage = '{' + assistantMessage;
      console.log('Prepended { to complete JSON');

      // Validate it's valid JSON
      try {
        JSON.parse(finalMessage);
        console.log('JSON validation successful');
      } catch (e) {
        console.error('JSON validation failed:', e);
        console.error('Response was:', finalMessage);
      }
    }

    // Check if ready for proposals
    const isReadyForProposals = assistantMessage.includes('[READY_FOR_PROPOSALS]');
    const cleanedMessage = action === 'chat'
      ? finalMessage.replace('[READY_FOR_PROPOSALS]', '').trim()
      : finalMessage;

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
