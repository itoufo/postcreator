// PostCreator - 投稿生成 Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
      max_tokens: 1024,
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
  // まず ```json で囲まれたブロックを探す
  const jsonBlockMatch = text.match(/```json\s*\n([\s\S]*?)\n```/);
  if (jsonBlockMatch) {
    return JSON.parse(jsonBlockMatch[1]);
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
