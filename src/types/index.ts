// PostCreator 型定義

// SNS種別
export type SNSType = 'X' | 'Instagram' | 'Threads' | 'note';

// 投稿種別
export type PostType =
  | 'normal'      // 通常投稿
  | 'thread'      // スレッド
  | 'feed'        // フィード（Instagram）
  | 'reel'        // リール
  | 'story'       // ストーリーズ
  | 'carousel'    // カルーセル
  | 'article'     // 記事（note）
  | 'snippet';    // つぶやき（note）

// 絵文字使用レベル
export type EmojiLevel = 'none' | 'light' | 'moderate' | 'heavy';

// CTA強度
export type CTALevel = 'none' | 'weak' | 'strong';

// ユーザーロール
export type UserRole = 'admin' | 'user' | 'viewer';

// リクエストステータス
export type RequestStatus = 'queued' | 'processing' | 'completed' | 'failed';

// 辞書タイプ
export type DictionaryType = 'hashtags' | 'cta' | 'synonyms' | 'domain_terms';

// SNS仕様プロファイル
export interface SNSProfile {
  max_chars: number;
  recommended_chars: [number, number];
  short_chars: [number, number];
  hashtags: {
    recommended: [number, number];
    max: number;
    position: 'end' | 'inline' | 'end_or_comment' | 'inline_or_end';
    composition?: {
      core?: number;
      niche?: number;
    };
  };
  line_breaks: 'minimal' | 'moderate' | 'generous';
  paragraphs?: [number, number];
  link_count?: number;
  tone: string[];
  structure?: string[];
}

// ユーザープロファイル
export interface UserProfile {
  id: string;
  user_id: string;
  role: UserRole;
  display_name?: string;
  avatar_url?: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// アカウント（ブランド/ペルソナ）
export interface Account {
  id: string;
  user_id: string;
  name: string;
  default_sns: SNSType;
  theme?: string;
  // ペルソナ情報（ターゲット層の特徴）
  persona: {
    target_age?: string;
    interests?: string[];
    pain_points?: string[];
    benefits?: string[];
    [key: string]: unknown;
  };
  // アカウント設計（ペルソナにヒットさせるための戦略）
  account_design?: {
    story?: {
      hardship?: string;    // 難関・課題
      solution?: string;    // 救い・商品
      success?: string;     // 成功・結果
    };
    positioning?: string;   // ポジショニング
    [key: string]: unknown;
  };
  tone_guidelines: {
    formality?: 'formal' | 'semi-formal' | 'casual';
    emoji_usage?: EmojiLevel;
    sentence_style?: 'desu-masu' | 'da' | 'mixed';
    brand_voice?: string[];
    [key: string]: unknown;
  };
  banned_terms: string[];
  must_include: string[];
  knowledge_base?: string;
  link_policy: {
    utm_template?: string;
    shorten_allowed?: boolean;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

// プロンプトテンプレート
export interface PromptTemplate {
  id: string;
  user_id: string;
  account_id: string;
  name: string;
  description?: string;
  system_prompt: string;
  user_prompt_template: string;
  constraints: {
    default_max_chars?: number;
    default_hashtags?: {
      on: boolean;
      max?: number;
    };
    default_emoji?: EmojiLevel;
    default_cta?: CTALevel;
    [key: string]: unknown;
  };
  sns_profiles: Partial<Record<SNSType, Partial<SNSProfile>>>;
  version: number;
  created_at: string;
  updated_at: string;
}

// 生成オプション
export interface GenerationOptions {
  hashtags?: {
    on: boolean;
    max?: number;
    position?: 'end' | 'inline' | 'end_or_comment' | 'inline_or_end' | 'none';
  };
  max_chars?: number;
  emoji?: EmojiLevel;
  cta?: CTALevel;
  link?: {
    mode?: 'body' | 'comment';
    utm?: boolean;
    shorten?: boolean;
  };
}

// 生成入力
export interface GenerationInputs {
  prompt: string;
  base_text?: string;
  sns: SNSType;
  post_type: PostType;
  options?: GenerationOptions;
}

// 生成リクエスト
export interface GenerationRequest {
  id: string;
  user_id: string;
  account_id: string;
  template_id?: string;
  inputs: GenerationInputs;
  status: RequestStatus;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

// 品質チェック結果
export interface QualityChecks {
  char_count: number;
  banned_terms_found: string[];
  tone_score?: number;
  sns_compliant: boolean;
  warnings: string[];
}

// 生成結果
export interface GenerationResult {
  id: string;
  request_id: string;
  sns: SNSType;
  post_type: PostType;
  draft: string;
  alt_versions: {
    alt1?: string;
    alt2?: string;
    short_main?: string;
    short_alt1?: string;
    short_alt2?: string;
    [key: string]: string | undefined;
  };
  hashtags: string[];
  checks: QualityChecks;
  score?: number;
  note?: string;
  is_published: boolean;
  created_at: string;
}

// 辞書
export interface Dictionary {
  id: string;
  user_id: string;
  account_id: string;
  type: DictionaryType;
  name: string;
  entries: {
    core?: string[];
    niche?: string[];
    campaign?: string[];
    weak?: string[];
    strong?: string[];
    items?: string[];
    [key: string]: string[] | undefined;
  };
  created_at: string;
  updated_at: string;
}

// 生成された投稿文の結果
export interface GeneratedPostResults {
  main: string;
  alt1: string;
  alt2: string;
  short_main: string;
  hashtags: string[];
}

// SNS接続情報
export interface SNSConnection {
  id: string;
  user_id: string;
  account_id?: string;
  sns_type: SNSType;
  connection_name: string;
  credentials: {
    access_token: string;
    refresh_token?: string;
    token_secret?: string;
    expires_at?: string;
    [key: string]: unknown;
  };
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Edge Function レスポンス
export interface GeneratePostResponse {
  request_id: string;
  results: GeneratedPostResults;
}
