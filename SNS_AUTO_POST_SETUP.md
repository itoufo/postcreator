# SNS自動投稿機能セットアップガイド

## 概要

PostCreatorにX (Twitter)とThreadsへの自動投稿機能が追加されました。このガイドでは、機能の使い方とセットアップ方法を説明します。

## 実装された機能

### 1. SNS接続管理
- ユーザーごとにSNSアカウントの認証情報を安全に保存
- X (Twitter)、Threads、Instagram、noteに対応（投稿機能は X と Threads のみ）
- 複数のアカウント接続をサポート

### 2. 自動投稿
- 生成された投稿文を直接 X または Threads に投稿
- 接続済みアカウントから投稿先を選択
- ハッシュタグ込みで投稿

### 3. 投稿履歴
- 投稿成功/失敗の記録
- 使用した接続情報の記録
- エラーメッセージの保存

## データベースマイグレーション

マイグレーションファイルが作成されているので、Supabase に適用してください：

```bash
npx supabase migration up
```

または、Supabase Dashboard から SQL を直接実行：
`supabase/migrations/20250127000005_add_sns_connections.sql`

## Edge Functions のデプロイ

### 1. X (Twitter) 投稿用

```bash
npx supabase functions deploy publish-to-x
```

環境変数（オプション）:
- `TWITTER_API_KEY` - Twitter API Key（デフォルト値として使用）
- `TWITTER_API_SECRET` - Twitter API Secret（デフォルト値として使用）

### 2. Threads 投稿用

```bash
npx supabase functions deploy publish-to-threads
```

## X (Twitter) の認証情報取得

### 1. Twitter Developer Portal にアクセス
https://developer.twitter.com/en/portal/dashboard

### 2. App を作成
1. "Projects & Apps" > "Create App"
2. App 名を入力（例: PostCreator）
3. API Keys を保存（後で必要）

### 3. User Authentication Settings
1. 作成した App の Settings > User authentication settings
2. "Set up" をクリック
3. App permissions: **Read and write**（重要！）
4. Type of App: **Web App, Automated App or Bot**
5. Callback URL / Redirect URL: 任意（必須フィールドだが今回は使用しない）
6. Website URL: 任意
7. Save

### 4. Access Token と Secret を取得
1. App の "Keys and tokens" タブ
2. "Access Token and Secret" セクション
3. **Generate** をクリック
4. Access Token と Access Token Secret を**必ず保存**（再表示不可）
5. ⚠️ 権限が "Read and Write" であることを確認

### PostCreator での登録
1. 設定 > SNS接続管理
2. "接続を追加"
3. SNS種別: **X (Twitter)**
4. 接続名: 任意（例: メインアカウント）
5. アクセストークン: 上記で取得した **Access Token**
6. アクセストークンシークレット: 上記で取得した **Access Token Secret**

## Threads の認証情報取得

### 1. Meta for Developers にアクセス
https://developers.facebook.com/

### 2. App を作成
1. "My Apps" > "Create App"
2. Use case: **Other**
3. App type: **Business**
4. App 名を入力
5. Contact email を入力

### 3. Threads API を有効化
1. ダッシュボードで "Add Product"
2. "Threads" を選択
3. "Set Up" をクリック

### 4. 権限の設定
必要な権限:
- `threads_basic` - 基本的なプロフィール情報の読み取り
- `threads_content_publish` - 投稿作成権限

### 5. アクセストークンの生成
1. Tools > Graph API Explorer
2. User or Page: 自分のアカウントを選択
3. Permissions: `threads_basic`, `threads_content_publish`
4. "Generate Access Token"
5. 長期トークンに変換することを推奨

### 6. User ID の取得
Graph API Explorer で以下を実行:
```
GET /me?fields=id
```

### PostCreator での登録
1. 設定 > SNS接続管理
2. "接続を追加"
3. SNS種別: **Threads**
4. 接続名: 任意（例: メインアカウント）
5. アクセストークン: 上記で取得したトークン
6. （将来的に user_id も保存できるように metadata を活用）

## 使い方

### 1. SNS接続を追加
1. アプリの設定画面に移動
2. "SNS接続管理" セクション
3. "接続を追加" ボタン
4. SNS種別を選択（X または Threads）
5. 接続名を入力
6. トークン情報を入力
7. "保存" をクリック

### 2. 投稿文を生成
1. 通常通り投稿文を生成
2. 生成結果が表示される

### 3. SNSに自動投稿
1. 生成結果の下部に「○○に投稿」ボタンが表示される
2. クリックして投稿先アカウントを選択
3. "投稿する" をクリック
4. 投稿完了！

## セキュリティについて

- SNS接続情報（トークン）は Supabase の RLS（Row Level Security）で保護
- ユーザーは自分の接続情報のみアクセス可能
- トークンは JSONB 型で保存（将来的に暗号化も検討）

## トラブルシューティング

### X への投稿が失敗する
- Access Token の権限が "Read and Write" になっているか確認
- Access Token が有効期限内か確認
- API Key と API Secret が正しいか確認

### Threads への投稿が失敗する
- アクセストークンに `threads_content_publish` 権限があるか確認
- トークンの有効期限を確認
- User ID が正しいか確認

### Edge Function のエラー
- Supabase Functions のログを確認: Dashboard > Edge Functions > Logs
- CORS エラーの場合: Origin 設定を確認

## 今後の拡張

- Instagram / note への投稿対応
- OAuth フローの実装（手動トークン入力の代わり）
- 予約投稿機能
- 投稿履歴の詳細表示
- トークンの自動更新（Refresh Token 対応）
