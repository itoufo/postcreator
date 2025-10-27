# 詳細設計書

## システム概要

**PostCreator** は、Claude APIを活用したSNS投稿文自動生成ツールです。
アカウント連携なしで、事前登録したペルソナ・トーンガイドラインに基づき、複数SNSに最適化された投稿文を生成します。

## アーキテクチャ

### 全体構成

```
┌──────────────────────────────────────────┐
│           ユーザー（ブラウザ）             │
└────────────────┬─────────────────────────┘
                 │
                 │ HTTPS
                 ▼
┌────────────────────────────────────────────┐
│         Vite + React (Frontend)            │
│  ┌──────────────────────────────────────┐  │
│  │  Components                          │  │
│  │  - Auth (Login/Signup)               │  │
│  │  - AccountManager                    │  │
│  │  - PostGenerator                     │  │
│  │  - HistoryList                       │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  Supabase Client                     │  │
│  │  - Auth                              │  │
│  │  - Database (RLS)                    │  │
│  │  - Edge Functions                    │  │
│  └──────────────────────────────────────┘  │
└────────────────┬───────────────────────────┘
                 │
                 │ Supabase API
                 ▼
┌────────────────────────────────────────────┐
│            Supabase (Backend)              │
│  ┌──────────────────────────────────────┐  │
│  │  PostgreSQL + RLS                    │  │
│  │  - snsgen_profiles                   │  │
│  │  - snsgen_accounts                   │  │
│  │  - snsgen_templates                  │  │
│  │  - snsgen_requests                   │  │
│  │  - snsgen_results                    │  │
│  │  - snsgen_dictionaries               │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  Edge Functions (Deno)               │  │
│  │  - generate-post                     │  │
│  │    └─ Claude API呼び出し             │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  Auth (Supabase Auth)                │  │
│  │  - Email/Password                    │  │
│  │  - OAuth (Google等、任意)            │  │
│  └──────────────────────────────────────┘  │
└────────────────┬───────────────────────────┘
                 │
                 │ HTTPS (Anthropic API)
                 ▼
┌────────────────────────────────────────────┐
│          Claude API (Anthropic)            │
│  - Model: claude-3-5-sonnet-latest         │
│  - Messages API                            │
└────────────────────────────────────────────┘
```

---

## フロントエンド設計

### 技術スタック

- **Vite**: ビルドツール
- **React 18+**: UIライブラリ
- **TypeScript**: 型安全
- **Tailwind CSS**: スタイリング（推奨）
- **Supabase JS Client**: バックエンド接続
- **React Router**: ルーティング
- **React Hook Form**: フォーム管理（任意）
- **Zustand / Jotai**: 状態管理（任意）

### ディレクトリ構成

```
src/
├── components/
│   ├── auth/
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   └── AuthGuard.tsx
│   ├── accounts/
│   │   ├── AccountList.tsx
│   │   ├── AccountForm.tsx
│   │   └── AccountCard.tsx
│   ├── generator/
│   │   ├── GeneratorForm.tsx
│   │   ├── SNSSelector.tsx
│   │   ├── OptionsPanel.tsx
│   │   └── ResultDisplay.tsx
│   ├── history/
│   │   ├── HistoryList.tsx
│   │   ├── HistoryItem.tsx
│   │   └── HistoryFilter.tsx
│   ├── templates/
│   │   ├── TemplateList.tsx
│   │   └── TemplateForm.tsx
│   └── common/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Loading.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useAccounts.ts
│   ├── useGenerator.ts
│   └── useHistory.ts
├── lib/
│   ├── supabase.ts          # Supabaseクライアント
│   ├── types.ts             # 型定義
│   └── constants.ts         # 定数（SNS仕様等）
├── pages/
│   ├── Dashboard.tsx
│   ├── Accounts.tsx
│   ├── Generator.tsx
│   ├── History.tsx
│   └── Settings.tsx
├── utils/
│   ├── validators.ts        # バリデーション
│   └── formatters.ts        # 整形関数
├── App.tsx
└── main.tsx
```

### 主要コンポーネント

#### 1. AuthGuard.tsx

```typescript
// 認証ガード（ログイン必須ページを保護）
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
}
```

#### 2. GeneratorForm.tsx

投稿生成のメインフォーム。

**入力項目:**
- アカウント選択
- SNS選択（X/Instagram/Threads/note）
- 投稿種別（normal/thread/reel等）
- プロンプト（テキストエリア）
- ベース文章（任意）
- オプション（ハッシュタグ/文字数/絵文字/CTA）

**処理フロー:**
1. フォーム入力
2. バリデーション
3. `snsgen_requests` にリクエストレコード作成
4. Edge Function `generate-post` 呼び出し
5. 結果表示（本命・代替・短縮版）

#### 3. ResultDisplay.tsx

生成結果の表示・コピー・保存。

**機能:**
- タブ切り替え（本命/代替1/代替2/短縮版）
- SNSプレビュー（X/IG風のモックUI）
- クリップボードコピー
- 評価（スコア入力）
- 再生成ボタン

---

## バックエンド設計（Supabase）

### データフロー

```
1. ユーザーがフォーム送信
   ↓
2. Frontend: snsgen_requests にレコード挿入
   ↓
3. Frontend: Edge Function 呼び出し
   ↓
4. Edge Function: Claude API にリクエスト
   ↓
5. Edge Function: レスポンスを整形・検証
   ↓
6. Edge Function: snsgen_results に保存
   ↓
7. Frontend: 結果を表示
```

### Edge Function: generate-post

**入力:**
```typescript
type GeneratePostRequest = {
  request_id: string;
  account: Account;
  inputs: {
    prompt: string;
    base_text?: string;
    sns: 'X' | 'Instagram' | 'Threads' | 'note';
    post_type: string;
    options?: {
      hashtags?: { on: boolean; max?: number; position?: string };
      max_chars?: number;
      emoji?: 'none' | 'light' | 'moderate' | 'heavy';
      cta?: 'none' | 'weak' | 'strong';
      link?: { mode?: string; utm?: boolean };
    };
  };
};
```

**処理:**
1. アカウント情報からペルソナ・トーンを取得
2. SNS仕様プロファイルを読み込み
3. systemプロンプト・userプロンプトを生成
4. Claude API呼び出し
5. レスポンスからJSON抽出
6. 文字数・NG語・整形チェック
7. `snsgen_results` に保存
8. フロントエンドに返却

**エラーハンドリング:**
- Claude API エラー → status: 'failed'、error_message に記録
- タイムアウト → 30秒でリトライ（最大3回）
- レート制限 → 指数バックオフ

---

## プロンプト設計

### System Prompt（共通）

```
あなたはSNSコピーライターです。各SNSの仕様・読者心理・ブランドトーンに準拠して、短く刺さる投稿文を日本語で作成します。
以下のルールを厳守してください：
- 誇大表現や根拠のない断定を避ける
- 禁止語を使用しない
- 指定された文字数・ハッシュタグ数を守る
- トーンガイドラインに沿った口調・語彙を使用する
- 出力はJSON形式で返す
```

### User Prompt Template（Mustache形式）

```
# ブランドトーン
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
}
```

---

## 品質チェック機能

### 1. 文字数チェック

```typescript
function validateCharCount(text: string, maxChars: number): { valid: boolean; count: number } {
  const count = text.length; // 全角・半角問わず1文字
  return { valid: count <= maxChars, count };
}
```

### 2. 禁止語チェック

```typescript
function checkBannedTerms(text: string, bannedTerms: string[]): string[] {
  return bannedTerms.filter(term => text.includes(term));
}
```

### 3. ハッシュタグ抽出・検証

```typescript
function extractHashtags(text: string): string[] {
  return text.match(/#[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+/g) || [];
}

function validateHashtags(hashtags: string[], max: number): boolean {
  return hashtags.length <= max;
}
```

### 4. トーンスコア（簡易版）

```typescript
// 将来的に埋め込みベクトルで実装
function calculateToneScore(text: string, toneExamples: string[]): number {
  // 簡易版：キーワード一致度
  // TODO: 埋め込みベクトルでコサイン類似度
  return 0.85; // 仮
}
```

---

## 認証・権限管理

### Supabase Auth

**対応方法:**
- Email + Password（必須）
- OAuth（Google等、任意）

**フロー:**
```
1. ユーザー登録 (supabase.auth.signUp)
   ↓
2. auth.users テーブルに自動作成
   ↓
3. Trigger: snsgen_profiles に自動挿入（user_id, role: 'user'）
   ↓
4. ログイン (supabase.auth.signInWithPassword)
   ↓
5. JWT トークン取得
   ↓
6. RLS で user_id = auth.uid() を検証
```

### RLS（Row Level Security）

全テーブルでRLSを有効化し、以下のポリシーを適用：

**SELECT:**
```sql
CREATE POLICY "Users can view own data"
ON snsgen_accounts
FOR SELECT
USING (auth.uid() = user_id);
```

**INSERT:**
```sql
CREATE POLICY "Users can insert own data"
ON snsgen_accounts
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**UPDATE/DELETE:**
同様に `auth.uid() = user_id` で制限。

---

## SNS仕様プロファイル（JSON）

`src/lib/constants.ts` で管理：

```typescript
export const SNS_PROFILES = {
  X: {
    max_chars: 280,
    recommended_chars: [140, 260],
    hashtags: { recommended: [2, 4], max: 5, position: 'end' },
    line_breaks: 'minimal',
  },
  Instagram: {
    max_chars: 2200,
    recommended_chars: [200, 500],
    hashtags: { recommended: [8, 15], max: 30, position: 'end' },
    line_breaks: 'generous',
  },
  Threads: {
    max_chars: 500,
    recommended_chars: [100, 300],
    hashtags: { recommended: [1, 3], max: 5, position: 'inline_or_end' },
  },
  note: {
    max_chars: 50000,
    recommended_chars: [1000, 3000],
    hashtags: { recommended: [3, 5], max: 10, position: 'end' },
  },
} as const;
```

---

## エラーハンドリング

### フロントエンド

```typescript
try {
  const result = await generatePost(params);
  // 成功処理
} catch (error) {
  if (error instanceof SupabaseError) {
    // DB/RLSエラー
    toast.error('データベースエラーが発生しました');
  } else if (error instanceof ClaudeAPIError) {
    // Claude APIエラー
    toast.error('投稿文の生成に失敗しました。再試行してください');
  } else {
    // その他
    toast.error('予期しないエラーが発生しました');
  }
}
```

### Edge Function

```typescript
try {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': ANTHROPIC_API_KEY, ... },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  // 成功処理
} catch (error) {
  // エラーログ（Supabase Logs）
  console.error('Edge Function Error:', error);

  // DB に status: 'failed' を記録
  await supabase
    .from('snsgen_requests')
    .update({ status: 'failed', error_message: error.message })
    .eq('id', request_id);

  return new Response(JSON.stringify({ error: error.message }), { status: 500 });
}
```

---

## セキュリティ

### 1. APIキー保護

- **Claude API Key**: Edge Function の環境変数（`supabase secrets`）
- **Supabase Keys**: フロントは ANON_KEY のみ（RLSで保護）

### 2. RLS（必須）

全テーブルで RLS 有効化 + ポリシー設定。

### 3. 入力検証

- フロント：React Hook Form + Zod（推奨）
- バックエンド：Edge Function で再検証

### 4. レート制限

- Supabase Edge Functions: 500リクエスト/分（Free Tier）
- Claude API: 使用量に応じた制限（ユーザーごとにトークン管理）

---

## パフォーマンス最適化

### 1. キャッシュ戦略

- **SNS仕様**: 静的定数として実装
- **辞書データ**: 初回読み込み後にメモリキャッシュ
- **アカウント情報**: Supabase Realtime で同期

### 2. ページネーション

履歴一覧は Cursor-based Pagination：

```typescript
const { data, error } = await supabase
  .from('snsgen_requests')
  .select('*, snsgen_results(*)')
  .order('created_at', { ascending: false })
  .range(0, 19); // 20件ずつ
```

### 3. 並列処理

複数SNS同時生成時は Promise.all：

```typescript
const promises = sns_list.map(sns => generatePost({ ...params, sns }));
const results = await Promise.all(promises);
```

---

## テスト戦略

### 1. ユニットテスト

- ユーティリティ関数（validators, formatters）
- カスタムフック（useAuth, useGenerator）
- ツール: Vitest

### 2. 統合テスト

- Edge Function のE2E
- DB接続・RLS検証
- ツール: Deno Test

### 3. E2Eテスト（任意）

- ログイン→投稿生成→履歴確認
- ツール: Playwright

---

## デプロイ

### フロントエンド

**推奨: Vercel / Netlify**

```bash
npm run build
# dist/ が生成される

# Vercel
vercel deploy

# Netlify
netlify deploy --prod
```

### バックエンド（Supabase）

```bash
# マイグレーション適用
supabase db push

# Edge Functions デプロイ
supabase functions deploy generate-post

# 環境変数設定
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

---

## 運用

### ログ

- **Edge Functions**: Supabase Logs（Cloud Console）
- **フロント**: Browser Console（本番はSentry等）

### モニタリング

監視不要の要件により、最小限：

- Supabase Dashboard でリクエスト数・エラー率を手動確認
- Claude API の使用量を定期チェック

### バックアップ

Supabase の自動バックアップ機能を利用（7日間保持）。

---

## 今後の拡張

1. **RAG統合**: 過去の高エンゲージ投稿を参照
2. **ABテスト**: 複数案の比較・評価
3. **自動カレンダー**: 曜日・時間帯最適化
4. **多言語対応**: 日本語→英語の並行生成
5. **画像生成**: DALL-E等との連携（任意）

---

## 参考資料

- [Supabase Documentation](https://supabase.com/docs)
- [Claude API Documentation](https://docs.anthropic.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
