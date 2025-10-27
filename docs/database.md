# データベース設計書

## 命名規則

- **プレフィックス**: `snsgen_`
- **命名スタイル**: スネークケース
- **外部キー**: `{table}_id`

## ER図（概要）

```
auth.users (Supabase Auth)
    │
    ├─→ snsgen_profiles (1:1)
    │
    └─→ snsgen_accounts (1:N)
            │
            ├─→ snsgen_templates (1:N)
            ├─→ snsgen_dictionaries (1:N)
            └─→ snsgen_requests (1:N)
                    │
                    └─→ snsgen_results (1:N)
```

## テーブル定義

### 1. snsgen_profiles（ユーザープロファイル・権限）

ユーザーごとの権限レベルとプロファイル情報を管理。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | uuid | PK, default gen_random_uuid() | プロファイルID |
| user_id | uuid | FK → auth.users(id), UNIQUE, NOT NULL | ユーザーID |
| role | text | NOT NULL, default 'user' | 権限（'admin', 'user', 'viewer'） |
| display_name | text | | 表示名 |
| avatar_url | text | | アバター画像URL |
| settings | jsonb | default '{}' | ユーザー設定 |
| created_at | timestamptz | default now() | 作成日時 |
| updated_at | timestamptz | default now() | 更新日時 |

**インデックス:**
- `user_id` (UNIQUE)

**RLS:**
- ユーザーは自分のプロファイルのみ参照・更新可能

---

### 2. snsgen_accounts（アカウント/ブランド）

投稿を生成する主体（ブランド、プロジェクト、ペルソナ）を管理。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | uuid | PK, default gen_random_uuid() | アカウントID |
| user_id | uuid | FK → auth.users(id), NOT NULL | 所有者ID |
| name | text | NOT NULL | アカウント名 |
| theme | text | | テーマ（例：「自己成長×AI」） |
| persona | jsonb | default '{}' | ペルソナ定義 |
| tone_guidelines | jsonb | default '{}' | トーンガイドライン |
| banned_terms | text[] | default '{}' | 禁止語リスト |
| must_include | text[] | default '{}' | 必須語・フレーズ |
| link_policy | jsonb | default '{}' | リンク挿入ポリシー |
| created_at | timestamptz | default now() | 作成日時 |
| updated_at | timestamptz | default now() | 更新日時 |

**persona の構造例:**
```json
{
  "target_age": "25-34",
  "interests": ["AI", "自己啓発", "キャリア"],
  "pain_points": ["時間がない", "何から始めるか分からない"],
  "benefits": ["短時間で成果", "実践的な知識"]
}
```

**tone_guidelines の構造例:**
```json
{
  "formality": "semi-formal",  // formal, semi-formal, casual
  "emoji_usage": "moderate",   // none, light, moderate, heavy
  "sentence_style": "mixed",   // desu-masu, da, mixed
  "brand_voice": ["親しみやすい", "前向き", "実用的"]
}
```

**インデックス:**
- `user_id`

**RLS:**
- ユーザーは自分のアカウントのみCRUD可能

---

### 3. snsgen_templates（プロンプトテンプレート）

投稿生成用のプロンプトテンプレートを保存。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | uuid | PK, default gen_random_uuid() | テンプレートID |
| user_id | uuid | FK → auth.users(id), NOT NULL | 所有者ID |
| account_id | uuid | FK → snsgen_accounts(id), NOT NULL | アカウントID |
| name | text | NOT NULL | テンプレート名 |
| description | text | | 説明 |
| system_prompt | text | NOT NULL | Claudeのsystemプロンプト |
| user_prompt_template | text | NOT NULL | ユーザープロンプトテンプレート |
| constraints | jsonb | default '{}' | 制約条件 |
| sns_profiles | jsonb | default '{}' | SNS別設定 |
| version | int | default 1 | バージョン番号 |
| created_at | timestamptz | default now() | 作成日時 |
| updated_at | timestamptz | default now() | 更新日時 |

**constraints の構造例:**
```json
{
  "default_max_chars": 280,
  "default_hashtags": {"on": true, "max": 5},
  "default_emoji": "moderate",
  "default_cta": "weak"
}
```

**sns_profiles の構造例:**
```json
{
  "X": {
    "max_chars": 280,
    "hashtag_position": "end",
    "hashtag_count": "2-4",
    "line_breaks": "minimal"
  },
  "Instagram": {
    "max_chars": 2200,
    "hashtag_position": "end",
    "hashtag_count": "8-15",
    "line_breaks": "generous"
  }
}
```

**インデックス:**
- `user_id`
- `account_id`

**RLS:**
- ユーザーは自分のテンプレートのみCRUD可能

---

### 4. snsgen_requests（生成リクエスト履歴）

投稿生成リクエストの履歴を記録。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | uuid | PK, default gen_random_uuid() | リクエストID |
| user_id | uuid | FK → auth.users(id), NOT NULL | ユーザーID |
| account_id | uuid | FK → snsgen_accounts(id), NOT NULL | アカウントID |
| template_id | uuid | FK → snsgen_templates(id), NULL | 使用テンプレートID |
| inputs | jsonb | NOT NULL | 入力パラメータ |
| status | text | default 'queued' | ステータス |
| error_message | text | | エラーメッセージ |
| created_at | timestamptz | default now() | リクエスト日時 |
| completed_at | timestamptz | | 完了日時 |

**status の値:**
- `queued`: 待機中
- `processing`: 処理中
- `completed`: 完了
- `failed`: 失敗

**inputs の構造例:**
```json
{
  "prompt": "新商品の告知文を作成",
  "base_text": "...",
  "sns": "X",
  "post_type": "normal",
  "options": {
    "hashtags": {"on": true, "max": 5, "position": "end"},
    "max_chars": 280,
    "emoji": "moderate",
    "cta": "weak",
    "link": {"mode": "body", "utm": true}
  }
}
```

**インデックス:**
- `user_id`
- `account_id`
- `created_at` (DESC)

**RLS:**
- ユーザーは自分のリクエストのみ参照可能

---

### 5. snsgen_results（生成結果）

生成された投稿文と評価情報を保存。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | uuid | PK, default gen_random_uuid() | 結果ID |
| request_id | uuid | FK → snsgen_requests(id), NOT NULL | リクエストID |
| sns | text | NOT NULL | 対象SNS |
| post_type | text | NOT NULL | 投稿種別 |
| draft | text | NOT NULL | 本命案 |
| alt_versions | jsonb | default '{}' | 代替案・短縮版 |
| hashtags | text[] | default '{}' | ハッシュタグリスト |
| checks | jsonb | default '{}' | 品質チェック結果 |
| score | int | | 手動評価スコア（1-5） |
| note | text | | メモ |
| is_published | boolean | default false | 公開済みフラグ |
| created_at | timestamptz | default now() | 生成日時 |

**alt_versions の構造例:**
```json
{
  "alt1": "代替案1の文章",
  "alt2": "代替案2の文章",
  "short_main": "短縮版",
  "short_alt1": "代替案1の短縮版"
}
```

**checks の構造例:**
```json
{
  "char_count": 275,
  "banned_terms_found": [],
  "tone_score": 0.85,
  "sns_compliant": true,
  "warnings": []
}
```

**インデックス:**
- `request_id`
- `sns`
- `created_at` (DESC)

**RLS:**
- ユーザーは自分のリクエストに紐づく結果のみ参照可能

---

### 6. snsgen_dictionaries（辞書）

ハッシュタグ、CTA候補、同義語などを管理。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | uuid | PK, default gen_random_uuid() | 辞書ID |
| user_id | uuid | FK → auth.users(id), NOT NULL | ユーザーID |
| account_id | uuid | FK → snsgen_accounts(id), NOT NULL | アカウントID |
| type | text | NOT NULL | 辞書種別 |
| name | text | NOT NULL | 辞書名 |
| entries | jsonb | NOT NULL | エントリーリスト |
| created_at | timestamptz | default now() | 作成日時 |
| updated_at | timestamptz | default now() | 更新日時 |

**type の値:**
- `hashtags`: ハッシュタグ候補
- `cta`: CTA（Call To Action）候補
- `synonyms`: 同義語
- `domain_terms`: 専門用語

**entries の構造例（hashtags）:**
```json
{
  "core": ["#AI学習", "#自己成長"],
  "niche": ["#キャリアデザイン", "#朝活"],
  "campaign": ["#春の新生活"]
}
```

**entries の構造例（cta）:**
```json
{
  "weak": ["詳しくはプロフィールから", "続きはブログで"],
  "strong": ["今すぐチェック！", "限定5名様まで"]
}
```

**インデックス:**
- `user_id`
- `account_id`
- `type`

**RLS:**
- ユーザーは自分の辞書のみCRUD可能

---

## マイグレーション適用順序

1. `snsgen_profiles`
2. `snsgen_accounts`
3. `snsgen_templates`
4. `snsgen_dictionaries`
5. `snsgen_requests`
6. `snsgen_results`

## RLS（Row Level Security）ポリシー概要

全テーブルでRLSを有効化し、以下の原則を適用：

1. **所有権ベース**: `user_id` が一致するレコードのみアクセス可能
2. **関連テーブル**: 外部キーで紐づくレコードは親の所有権を継承
3. **読み取り制限**: SELECT/UPDATE/DELETE は所有者のみ
4. **挿入制限**: INSERT 時に `user_id` が `auth.uid()` と一致することを検証

## トリガー

### updated_at 自動更新

全テーブルに `updated_at` 自動更新トリガーを設定：

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルに適用例
CREATE TRIGGER update_snsgen_accounts_updated_at
  BEFORE UPDATE ON snsgen_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## バックアップ・リストア

Supabase の自動バックアップ機能を利用。

手動エクスポート：
```bash
supabase db dump -f backup.sql
```

リストア：
```bash
psql -h <HOST> -U postgres -d postgres < backup.sql
```

## パフォーマンス最適化

### インデックス戦略

- 外部キー：自動インデックス
- 検索頻度が高いカラム：複合インデックス
  - `(user_id, created_at DESC)` - 履歴一覧
  - `(account_id, created_at DESC)` - アカウント別履歴

### クエリ最適化

- N+1問題回避：適切な JOIN または Supabase の `select('*, relation(*)')` 構文
- ページネーション：`LIMIT` + `OFFSET` または Cursor-based

## セキュリティ考慮事項

1. **RLS 必須**: 全テーブルで RLS を有効化
2. **機密情報**: API Key は Edge Functions の環境変数で管理
3. **PII**: 個人情報はマスキング・暗号化を検討
4. **監査ログ**: 重要操作は `snsgen_requests` に記録

## 拡張予定

- `snsgen_ab_tests`: ABテスト結果の記録
- `snsgen_analytics`: 投稿パフォーマンス分析
- `snsgen_schedules`: 予約投稿管理（将来）
