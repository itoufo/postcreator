# SNS投稿文自動生成ツール（PostCreator）

Claude APIを活用した、複数SNS対応の投稿文自動生成システム

## 概要

アカウント連携なしで、登録済みの「テーマ/ペルソナ」をもとに、プロンプト・ベース文章・SNS種別に適合した投稿文をClaudeで生成します。

### 対応SNS

- **X**（旧Twitter）
- **Instagram**
- **Threads**
- **note**

## 主要機能

### 1. アカウント（ブランド/ペルソナ）管理

- 複数のアカウント（ブランド/プロジェクト）を管理
- アカウントごとにテーマ/ペルソナ/口調/NGワード等のスタイルを保存
- 権限管理（`snsgen_profile`）による柔軟なアクセス制御

### 2. 投稿生成

**入力項目：**
- プロンプト（自由記述）
- ハッシュタグ生成の有無（ON/OFF・数・形式）
- ベース文章（長文の要約・要点抽出・口調変換）
- 対象SNS（X/Instagram/Threads/note）
- 投稿種別（通常/スレッド/リール/ショート/カルーセル/ストーリー/告知/速報 等）
- 文字数上限・絵文字使用方針・CTA有無

**出力：**
- 各SNSの仕様に適合した文面
- 複数案（本命・代替・短縮版）
- ハッシュタグ候補

### 3. プロンプトテンプレート管理

- 生成プロンプトのテンプレート化と再利用
- Mustache形式での変数差し込み
- SNS別の制約ルールの管理

### 4. 履歴管理

- 生成リクエスト・結果の保存
- バージョン管理（入力・出力の履歴）
- 再生成・複製機能

### 5. 品質チェック

- 禁則ワード検出
- トーン逸脱チェック
- 文字数超過検証
- SNS仕様適合確認

## 技術スタック

### フロントエンド

- **Vite** - ビルドツール
- **React** - UIフレームワーク
- **TypeScript** - 型安全
- **Tailwind CSS** - スタイリング（推奨）

### バックエンド

- **Supabase** - BaaS
  - PostgreSQL（データベース）
  - Row Level Security（権限管理）
  - Edge Functions（サーバーサイドロジック）
  - Authentication（認証）

### LLM

- **Claude API**（Anthropic Messages API）
  - モデル：`claude-3-5-sonnet-latest`
  - システムプロンプト＋ユーザープロンプト構成

## アーキテクチャ

```
┌─────────────────┐
│  Vite + React   │  ← フロントエンド（UI）
└────────┬────────┘
         │
         │ Supabase Client
         │
┌────────┴────────┐
│    Supabase     │
├─────────────────┤
│  PostgreSQL     │  ← データ保存（RLS）
│  Edge Functions │  ← Claude API呼び出し
│  Auth           │  ← 認証
└─────────────────┘
         │
         │ HTTPS
         │
┌────────┴────────┐
│   Claude API    │  ← LLM
└─────────────────┘
```

## セットアップ

### 前提条件

- Node.js 18+
- Supabaseプロジェクト（作成済み）
- Claude API Key（Anthropic）

### 1. プロジェクトのセットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .env に Supabase の URL と ANON_KEY を設定
```

### 2. Supabaseの設定

```bash
# Supabase CLI のインストール
npm install -g supabase

# ログイン
supabase login

# プロジェクトとリンク
supabase link --project-ref <YOUR_PROJECT_REF>

# マイグレーション適用
supabase db push

# Edge Functions のデプロイ
supabase secrets set ANTHROPIC_API_KEY=<YOUR_CLAUDE_API_KEY>
supabase functions deploy generate-post
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

## データベース構造

### テーブル一覧（プレフィックス：`snsgen_`）

| テーブル名 | 説明 |
|-----------|------|
| `snsgen_profiles` | ユーザープロファイル・権限管理 |
| `snsgen_accounts` | アカウント（ブランド/ペルソナ） |
| `snsgen_templates` | プロンプトテンプレート |
| `snsgen_requests` | 生成リクエスト履歴 |
| `snsgen_results` | 生成結果 |
| `snsgen_dictionaries` | 辞書（ハッシュタグ/CTA候補等） |

詳細は [docs/database.md](./docs/database.md) を参照

## API仕様

### Edge Functions

#### POST `/functions/v1/generate-post`

投稿文を生成します。

**Request:**
```json
{
  "request_id": "uuid",
  "account": { /* account object */ },
  "inputs": {
    "prompt": "新商品の告知",
    "base_text": "...",
    "sns": "X",
    "post_type": "normal",
    "options": {
      "hashtags": { "on": true, "max": 5, "position": "end" },
      "max_chars": 280,
      "emoji": "normal",
      "cta": "weak"
    }
  }
}
```

**Response:**
```json
{
  "request_id": "uuid",
  "results": {
    "main": "本命案の投稿文",
    "alt1": "代替案1",
    "alt2": "代替案2",
    "short_main": "短縮版",
    "hashtags": ["#タグ1", "#タグ2"]
  }
}
```

## SNS別仕様

各SNSの文字数制限・ハッシュタグ推奨数・スタイルガイドは [docs/sns-specs.md](./docs/sns-specs.md) を参照

## ディレクトリ構成

```
postcreator/
├── src/
│   ├── components/       # Reactコンポーネント
│   ├── lib/             # ユーティリティ（Supabase client等）
│   ├── hooks/           # カスタムフック
│   ├── types/           # TypeScript型定義
│   └── App.tsx          # メインアプリ
├── supabase/
│   ├── migrations/      # DBマイグレーション
│   └── functions/       # Edge Functions
│       └── generate-post/
├── docs/                # ドキュメント
│   ├── database.md      # DB設計書
│   ├── sns-specs.md     # SNS別仕様
│   └── design.md        # 詳細設計
├── .env.example         # 環境変数テンプレート
└── README.md            # このファイル
```

## 開発ロードマップ

### v0.1（MVP）

- [x] プロジェクトセットアップ
- [x] データベース設計
- [ ] 認証機能
- [ ] アカウント管理画面
- [ ] 投稿生成フォーム（X対応）
- [ ] 履歴一覧

### v0.2

- [ ] Instagram/Threads/note 対応
- [ ] プロンプトテンプレート管理
- [ ] ハッシュタグ辞書機能
- [ ] 品質チェック強化

### v1.0

- [ ] 複数案生成・比較
- [ ] ABテスト機能
- [ ] 要約パス（長文→短文）
- [ ] UIブラッシュアップ

## ライセンス

MIT

## 貢献

Issue・PRを歓迎します。

## サポート

質問・バグ報告は [Issues](../../issues) へ
