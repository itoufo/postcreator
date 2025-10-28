import type { SNSProfile, SNSType } from '@/types';

// SNS別仕様プロファイル
export const SNS_PROFILES: Record<SNSType, SNSProfile> = {
  X: {
    max_chars: 280,
    recommended_chars: [140, 260],
    short_chars: [80, 120],
    hashtags: {
      recommended: [2, 4],
      max: 5,
      position: 'end',
    },
    line_breaks: 'minimal',
    link_count: 1,
    tone: ['concise', 'impactful', 'timely'],
  },
  Instagram: {
    max_chars: 2200,
    recommended_chars: [200, 500],
    short_chars: [100, 150],
    hashtags: {
      recommended: [8, 15],
      max: 30,
      position: 'end_or_comment',
      composition: {
        core: 3,
        niche: 7,
      },
    },
    line_breaks: 'generous',
    paragraphs: [3, 5],
    tone: ['storytelling', 'empathy', 'visual'],
  },
  Threads: {
    max_chars: 500,
    recommended_chars: [100, 300],
    short_chars: [80, 150],
    hashtags: {
      recommended: [1, 3],
      max: 5,
      position: 'inline_or_end',
    },
    line_breaks: 'moderate',
    tone: ['conversational', 'casual', 'community'],
  },
  note: {
    max_chars: 50000,
    recommended_chars: [1000, 3000],
    short_chars: [500, 800],
    hashtags: {
      recommended: [3, 5],
      max: 10,
      position: 'end',
    },
    line_breaks: 'generous',
    structure: ['title', 'lead', 'body', 'summary'],
    tone: ['detailed', 'structured', 'educational'],
  },
};

// 投稿種別の表示名
export const POST_TYPE_LABELS: Record<string, string> = {
  normal: '通常投稿',
  thread: 'スレッド',
  feed: 'フィード投稿',
  reel: 'リール',
  story: 'ストーリーズ',
  carousel: 'カルーセル',
  article: '記事',
  snippet: 'つぶやき',
};

// SNS別の投稿種別
export const SNS_POST_TYPES: Record<SNSType, string[]> = {
  X: ['normal', 'thread'],
  Instagram: ['feed', 'reel', 'story', 'carousel'],
  Threads: ['normal', 'thread'],
  note: ['article', 'snippet'],
};

// 絵文字レベルの説明
export const EMOJI_LEVEL_DESCRIPTIONS = {
  none: '絵文字なし（ビジネス・公式）',
  light: '控えめ（1-2個/投稿）',
  moderate: '通常（3-5個/投稿）',
  heavy: '多め（6個以上/投稿）',
};

// CTAレベルの説明
export const CTA_LEVEL_DESCRIPTIONS = {
  none: 'なし',
  weak: '弱（例：詳しくはプロフィールから）',
  strong: '強（例：今すぐチェック！）',
};

// 投稿内容タイプの説明
export const CONTENT_TYPE_DESCRIPTIONS = {
  contrast: '対立型 - 常識否定、逆張り、仮想敵設定で注目を集める',
  authority: '権威構築型 - 実績・専門性をアピールして信頼を得る',
  value: '価値提供型 - ノウハウ・Tips・教育的コンテンツで役立つ',
  empathy: '共感型 - あるある・悩み共有で寄り添う',
  insight: '洞察型 - 哲学・本質・深い気づきで考えさせる',
  story: 'ストーリー型 - 体験談・変化の物語で引き込む',
  question: '問いかけ型 - 質問・対話でエンゲージメント促進',
  achievement: '結果公開型 - 数字・実績・証拠で説得力を持たせる',
};

// ハッシュタグ位置の説明
export const HASHTAG_POSITION_DESCRIPTIONS = {
  end: '末尾',
  inline: '文中',
  end_or_comment: '末尾またはコメント',
  inline_or_end: '文中または末尾',
  none: 'なし',
};

// デフォルトのシステムプロンプト
export const DEFAULT_SYSTEM_PROMPT = `あなたはSNSコピーライターです。各SNSの仕様・読者心理・ブランドトーンに準拠して、短く刺さる投稿文を日本語で作成します。
以下のルールを厳守してください：
- 誇大表現や根拠のない断定を避ける
- 禁止語を使用しない
- 指定された文字数・ハッシュタグ数を守る
- トーンガイドラインに沿った口調・語彙を使用する
- 出力はJSON形式で返す`;

// デフォルトのユーザープロンプトテンプレート
export const DEFAULT_USER_PROMPT_TEMPLATE = `# ブランドトーン
{{tone_guidelines}}

# ターゲットペルソナ
{{persona}}

# SNS: {{sns}}
# 投稿種別: {{post_type}}

# 目的
{{prompt}}

# ベース文章（任意）
{{base_text}}

# 必須/禁止語
必須語: {{must_include}}
禁止語: {{banned_terms}}

# 制約
最大文字数: {{max_chars}}
ハッシュタグ: {{hashtag_policy}}
絵文字: {{emoji_policy}}
CTA: {{cta_policy}}

# 出力形式（JSON）
{
  "main": "本命案の投稿文",
  "alt1": "代替案1",
  "alt2": "代替案2",
  "short_main": "短縮版",
  "hashtags": ["#タグ1", "#タグ2", "..."]
}`;

// ハッシュタグ生成のヒント
export const HASHTAG_HINTS: Record<SNSType, string> = {
  X: 'コア2個 + ニッチ1-2個、トレンドを意識',
  Instagram: 'コア3個 + ニッチ7-12個、検索とトレンドのバランス',
  Threads: 'コア1-2個 + ニッチ1個、控えめに',
  note: 'コア2-3個 + ニッチ2個、検索重視',
};

// トーンガイドラインのサンプル
export const TONE_GUIDELINE_SAMPLES = {
  friendly: {
    formality: 'semi-formal' as const,
    emoji_usage: 'moderate' as const,
    sentence_style: 'mixed' as const,
    brand_voice: ['親しみやすい', '前向き', '実用的'],
  },
  professional: {
    formality: 'formal' as const,
    emoji_usage: 'light' as const,
    sentence_style: 'desu-masu' as const,
    brand_voice: ['誠実', '信頼', '専門的'],
  },
  casual: {
    formality: 'casual' as const,
    emoji_usage: 'heavy' as const,
    sentence_style: 'da' as const,
    brand_voice: ['フレンドリー', '楽しい', 'リラックス'],
  },
};

// ペルソナのサンプル
export const PERSONA_SAMPLES = {
  'young-professional': {
    target_age: '25-34',
    interests: ['キャリア', 'スキルアップ', '副業'],
    pain_points: ['時間がない', '何から始めるか分からない'],
    benefits: ['短時間で成果', '実践的な知識'],
  },
  'tech-enthusiast': {
    target_age: '20-40',
    interests: ['AI', 'テクノロジー', 'イノベーション'],
    pain_points: ['最新情報に追いつけない', '実装方法が分からない'],
    benefits: ['最新トレンド', '具体的な使い方'],
  },
  'lifestyle-seeker': {
    target_age: '30-45',
    interests: ['ライフスタイル', '自己啓発', 'ウェルビーイング'],
    pain_points: ['日々のストレス', 'ワークライフバランス'],
    benefits: ['心地よい暮らし', '自分らしさ'],
  },
};
