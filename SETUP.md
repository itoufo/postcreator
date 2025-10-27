# PostCreator セットアップガイド

## 前提条件

- Node.js 18+ がインストールされていること
- Supabaseプロジェクトが作成済みであること
- Claude API Key（Anthropic）を取得済みであること

## 1. 環境変数の設定

`.env` ファイルを作成し、Supabaseの接続情報を設定します。

```bash
cp .env.example .env
```

`.env` ファイルを開き、以下の値を設定：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Supabaseの URL と ANON_KEY は、Supabase Dashboard の **Settings > API** から取得できます。

## 2. 依存関係のインストール

```bash
npm install
```

## 3. Supabase セットアップ

### 3.1 Supabase CLI のインストール

```bash
npm install -g supabase
```

### 3.2 ログイン

```bash
supabase login
```

### 3.3 プロジェクトとリンク

```bash
supabase link --project-ref <YOUR_PROJECT_REF>
```

プロジェクト REF は Supabase Dashboard の **Settings > General** で確認できます。

### 3.4 マイグレーション適用

```bash
supabase db push
```

このコマンドで以下のテーブルが作成されます：

- `snsgen_profiles` - ユーザープロファイル
- `snsgen_accounts` - アカウント/ペルソナ
- `snsgen_templates` - プロンプトテンプレート
- `snsgen_requests` - 生成リクエスト
- `snsgen_results` - 生成結果
- `snsgen_dictionaries` - 辞書

### 3.5 Edge Function デプロイ

Claude API Key を Supabase Secrets に設定：

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx
```

Edge Function をデプロイ：

```bash
supabase functions deploy generate-post
```

## 4. 開発サーバー起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスすると、アプリが起動します。

## 5. 初回セットアップ（ユーザー登録）

1. `/signup` にアクセスしてアカウントを作成
2. ログイン後、`/accounts` でブランド/ペルソナを登録
3. `/generator` で投稿文を生成

## トラブルシューティング

### エラー: "Supabase環境変数が設定されていません"

→ `.env` ファイルが正しく設定されているか確認してください。

### エラー: "Edge Functionの呼び出しに失敗しました"

→ Edge Function が正しくデプロイされているか確認：

```bash
supabase functions list
```

→ Claude API Key が正しく設定されているか確認：

```bash
supabase secrets list
```

### マイグレーションエラー

テーブルが既に存在する場合は、一度リセット：

```bash
supabase db reset
```

**注意**: このコマンドは全データを削除します。

## 本番環境へのデプロイ

### フロントエンド（Vercel推奨）

1. GitHubリポジトリにプッシュ
2. Vercelで新規プロジェクトを作成
3. 環境変数を設定：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. デプロイ

### バックエンド（Supabase）

本番環境では自動的にEdge Functionが利用可能になります。
Supabase Dashboard で確認：

- **Functions** タブで `generate-post` が表示される
- **Logs** タブでリクエスト/エラーログを確認できる

## 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [Claude API Documentation](https://docs.anthropic.com/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)
