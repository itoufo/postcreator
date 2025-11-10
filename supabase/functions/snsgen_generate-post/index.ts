// PostCreator - 投稿生成 Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// 投稿内容タイプの例文
const CONTENT_TYPE_EXAMPLES: Record<string, string[]> = {
  contrast: [
    '「毎日投稿すべき」は嘘です。SNS疲れの原因は量より質の問題。週3本の濃い投稿の方が圧倒的に伸びます。',
    '業界の常識「フォロワーが増えれば売上も上がる」←これ、半分間違ってます。大事なのは数じゃなくて○○です。',
    '「SNS運用は楽しく」という人ほど伸びない理由。本気で結果を出したいなら、戦略的に設計すべきです。',
  ],
  authority: [
    'フォロワー0→10万まで1年で達成した私が、実践した3つの施策を公開します。再現性高めです。',
    'マーケター歴10年、累計100社のSNS運用を支援してきました。その経験から見えた「伸びるアカウント」の共通点とは？',
    '書籍「SNS設計の教科書」著者。これまで培ったノウハウを惜しみなく発信していきます。',
  ],
  value: [
    '【保存版】投稿のインプレッションを3倍にする5つのテクニック｜①投稿時間を最適化 ②冒頭で引きを作る ③...',
    'プロフィール文章の作り方、完全ガイド。見た瞬間にフォローされるプロフィールには、この3要素が入っています。',
    'ハッシュタグ選定の正しい手順｜闇雲に付けても無意味です。ビッグ×ミドル×スモールの黄金比率を解説します。',
  ],
  empathy: [
    'SNS運用してると「いいね少ない…私ダメなのかな」って思う時ありますよね。大丈夫、みんな通る道です。',
    '投稿ネタが思いつかなくて手が止まる…わかります。私も毎週その壁にぶち当たってます。',
    'フォロワー増えないし、反応も薄い。「何のためにやってるんだろう」って思う日、ありますよね。',
  ],
  insight: [
    'SNS運用の本質は「発信」ではなく「対話」です。一方的に話すだけでは、誰も振り向いてくれません。',
    '「バズり」を追うのをやめた時、本当の成長が始まる。数字ではなく、届けたい人に届ける。それがSNSの真髄。',
    'フォロワー数は「結果」であって「目的」ではない。あなたが提供する価値こそが、すべての起点です。',
  ],
  story: [
    '3ヶ月前、フォロワー200人で心が折れかけてました。でも、ある投稿をきっかけに風向きが変わったんです。',
    '初めてバズった日のこと、今でも覚えてます。朝起きたら通知が1000件。でも、それ以上に嬉しかったのは…',
    '「SNSなんて無理」と思ってた私が、1年後には講座を開くまでになった話。すべてはあの日の決断から始まりました。',
  ],
  question: [
    'あなたがSNSで一番伸び悩んでるポイントはどこですか？｜①ネタ切れ ②文章力 ③継続 ④戦略 コメントで教えてください！',
    '正直に聞きます。SNS運用、楽しめてますか？それとも義務になってますか？',
    'もし明日からフォロワーが0になったら、あなたは同じ発信を続けますか？この質問、意外と本質を突いてると思います。',
  ],
  achievement: [
    '【運用6ヶ月の成果報告】フォロワー：0→12,340人｜月間インプレッション：328万｜問い合わせ：月42件。やったこと全部公開します。',
    '先月の投稿で最も反応が良かったTOP3を分析しました。共通点は「○○」でした。データで見ると一目瞭然です。',
    'A/Bテストの結果が出ました｜パターンA：いいね487 パターンB：いいね1,240。勝因は冒頭の「たった2文字」の違いでした。',
  ],
};

// 型定義
interface GeneratePayload {
  request_id: string;
  account: {
    id: string;
    name: string;
    theme?: string;
    persona: Record<string, unknown>;
    tone_guidelines: Record<string, unknown>;
    banned_terms: string[];
    must_include: string[];
    knowledge_base?: string;
    link_policy: Record<string, unknown>;
  };
  inputs: {
    prompt: string;
    base_text?: string;
    sns: "X" | "Instagram" | "Threads" | "note";
    post_type: string;
    content_type?: string;
    options?: {
      hashtags?: { on: boolean; max?: number; position?: string };
      max_chars?: number;
      emoji?: "none" | "light" | "moderate" | "heavy";
      cta?: "none" | "weak" | "strong";
      link?: { mode?: string; utm?: boolean; shorten?: boolean };
    };
  };
}

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
  stop_reason: string;
}

// プロンプト生成
function buildPrompt(payload: GeneratePayload): { system: string; user: string } {
  const { account, inputs } = payload;
  const options = inputs.options || {};

  const system = `あなたはSNSコピーライターです。各SNSの仕様・読者心理・ブランドトーンに準拠して、短く刺さる投稿文を日本語で作成します。
以下のルールを厳守してください：
- 誇大表現や根拠のない断定を避ける
- 禁止語を使用しない
- 指定された文字数・ハッシュタグ数を守る
- トーンガイドラインに沿った口調・語彙を使用する
- 出力はJSON形式で返す`;

  const hashtagPolicy = options.hashtags?.on
    ? `生成ON、最大${options.hashtags.max || 5}個、配置：${options.hashtags.position || "末尾"}`
    : "生成なし";

  const user = `# ブランドトーン
${JSON.stringify(account.tone_guidelines, null, 2)}

# ターゲットペルソナ
${JSON.stringify(account.persona, null, 2)}

${account.knowledge_base ? `# 知識ベース（ブランド・商品情報）\n${account.knowledge_base}\n` : ""}
# SNS: ${inputs.sns}
# 投稿種別: ${inputs.post_type}
${inputs.content_type ? `# 投稿内容タイプ: ${inputs.content_type}\n` : ""}
${inputs.content_type && CONTENT_TYPE_EXAMPLES[inputs.content_type] ? `
# 参考例文（このタイプの投稿イメージ）
${CONTENT_TYPE_EXAMPLES[inputs.content_type].map((ex, i) => `${i + 1}. ${ex}`).join('\n')}
` : ""}
# 目的
${inputs.prompt}

${inputs.base_text ? `# ベース文章\n${inputs.base_text}\n` : ""}

# 必須/禁止語
必須語: ${account.must_include.join(", ") || "なし"}
禁止語: ${account.banned_terms.join(", ") || "なし"}

# 制約
最大文字数: ${options.max_chars || 280}
ハッシュタグ: ${hashtagPolicy}
絵文字: ${options.emoji || "moderate"}
CTA: ${options.cta || "weak"}

# 出力形式（JSON）
{
  "main": "本命案の投稿文",
  "alt1": "代替案1",
  "alt2": "代替案2",
  "short_main": "短縮版",
  "hashtags": ["#タグ1", "#タグ2"]
}`;

  return { system, user };
}

// Claude API 呼び出し
async function callClaude(system: string, user: string): Promise<ClaudeResponse> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      system,
      max_tokens: 20000,
      temperature: 0.7,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// JSON抽出（```json...```やテキストから）
function extractJSON(text: string): unknown {
  // まず ```json で囲まれたブロックを探す（より柔軟に）
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    return JSON.parse(jsonBlockMatch[1].trim());
  }

  // 次に { ... } の形式を探す
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  // どちらもなければそのままパース試行
  return JSON.parse(text);
}

// 品質チェック
function performChecks(
  draft: string,
  bannedTerms: string[],
  maxChars: number
): {
  char_count: number;
  banned_terms_found: string[];
  sns_compliant: boolean;
  warnings: string[];
} {
  const charCount = draft.length;
  const bannedFound = bannedTerms.filter((term) => draft.includes(term));
  const snsCompliant = charCount <= maxChars && bannedFound.length === 0;
  const warnings: string[] = [];

  if (charCount > maxChars) {
    warnings.push(`文字数超過: ${charCount}/${maxChars}`);
  }
  if (bannedFound.length > 0) {
    warnings.push(`禁止語検出: ${bannedFound.join(", ")}`);
  }

  return {
    char_count: charCount,
    banned_terms_found: bannedFound,
    sns_compliant: snsCompliant,
    warnings,
  };
}

// メインハンドラー
serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const payload: GeneratePayload = await req.json();
    const { request_id, account, inputs } = payload;

    console.log(`[generate-post] Request: ${request_id}, SNS: ${inputs.sns}`);

    // プロンプト生成
    const { system, user } = buildPrompt(payload);

    // Claude呼び出し
    const claudeResp = await callClaude(system, user);

    // テキスト抽出
    const text = claudeResp.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n");

    console.log(`[generate-post] Claude response: ${text.substring(0, 100)}...`);

    // JSON抽出
    const parsed = extractJSON(text);

    // 品質チェック
    const maxChars = inputs.options?.max_chars || 280;
    const checks = performChecks(
      (parsed as { main: string }).main,
      account.banned_terms,
      maxChars
    );

    console.log(`[generate-post] Checks: ${JSON.stringify(checks)}`);

    // レスポンス
    return new Response(
      JSON.stringify({
        request_id,
        results: parsed,
        checks,
      }),
      {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[generate-post] Error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
