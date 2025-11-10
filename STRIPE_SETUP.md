# Stripe連携セットアップガイド

このドキュメントでは、PostCreatorでStripeを使用したサブスクリプション決済を実装するための手順を説明します。

## 前提条件

- Stripeアカウントを作成済み
- Supabase CLIがインストール済み
- プロジェクトがSupabaseにデプロイ済み

## 1. Stripeでの設定

### 1.1 プロダクトと価格の作成

1. [Stripe Dashboard](https://dashboard.stripe.com/)にログイン
2. 「商品」→「商品を追加」から以下の3つのプランを作成:

**ベーシックプラン**
- 名前: PostCreator Basic
- 価格: ¥980/月
- 価格IDをコピーして保存 (例: `price_xxxxxxxxxxxxx`)

**プロプラン**
- 名前: PostCreator Pro
- 価格: ¥2,980/月
- 価格IDをコピーして保存

**エンタープライズプラン**
- 名前: PostCreator Enterprise
- 価格: カスタム
- 価格IDをコピーして保存

### 1.2 Webhook Endpointの設定

1. Stripe Dashboard → 「開発者」→「Webhook」
2. 「エンドポイントを追加」をクリック
3. エンドポイントURL: `https://<your-project-ref>.supabase.co/functions/v1/snsgen_stripe-webhook`
4. 「イベントを選択」で以下を選択:

   **必須イベント（Checkout events）**
   - `checkout.session.completed` - チェックアウト完了時（最重要）

   **必須イベント（Customer events）**
   - `customer.subscription.created` - サブスクリプション作成時
   - `customer.subscription.updated` - サブスクリプション更新時（プラン変更、更新日変更など）
   - `customer.subscription.deleted` - サブスクリプション削除・解約時

   **必須イベント（Billing events）**
   - `invoice.payment_failed` - 請求失敗時（支払いエラー）
   - `invoice.payment_succeeded` - 請求成功時

   **推奨イベント（オプション）**
   - `customer.subscription.trial_will_end` - トライアル期間終了3日前
   - `invoice.payment_action_required` - 追加認証（3Dセキュアなど）が必要な場合

5. 「エンドポイントを追加」をクリック
6. Webhook署名シークレット（`whsec_`で始まる文字列）をコピーして保存

## 2. 環境変数の設定

### 2.1 Supabase Secretsの設定

```bash
# Stripe APIキーを設定
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Webhook署名シークレットを設定
supabase secrets set SNSGEN_STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# 各プランの価格IDを設定
supabase secrets set SNSGEN_STRIPE_BASIC_PRICE_ID=price_xxxxxxxxxxxxx
supabase secrets set SNSGEN_STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxx
supabase secrets set SNSGEN_STRIPE_ENTERPRISE_PRICE_ID=price_xxxxxxxxxxxxx
```

### 2.2 フロントエンド環境変数 (.env)

`.env`ファイルに以下を追加:

```env
VITE_STRIPE_BASIC_PRICE_ID=price_xxxxxxxxxxxxx
VITE_STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxx
```

## 3. データベースマイグレーション

```bash
# マイグレーションを適用
supabase db push

# または本番環境の場合
supabase db push --linked
```

## 4. Edge Functionsのデプロイ

```bash
# Stripe Webhook関数をデプロイ
supabase functions deploy snsgen_stripe-webhook

# チェックアウトセッション作成関数をデプロイ
supabase functions deploy snsgen_create-checkout-session

# ポータルセッション作成関数をデプロイ
supabase functions deploy snsgen_create-portal-session
```

## 5. 動作確認

### 5.1 ローカルテスト

```bash
# Stripe CLIをインストール
brew install stripe/stripe-cli/stripe

# Stripeにログイン
stripe login

# Webhookをローカルに転送
stripe listen --forward-to localhost:54321/functions/v1/snsgen_stripe-webhook

# 別のターミナルでSupabaseローカル開発サーバーを起動
supabase start
npm run dev
```

### 5.2 テスト決済

1. アプリケーションにログイン
2. サブスクリプションページに移動
3. プランを選択して「アップグレード」をクリック
4. Stripeのテストカードを使用:
   - カード番号: `4242 4242 4242 4242`
   - 有効期限: 未来の任意の日付
   - CVC: 任意の3桁の数字

## 6. 本番環境への移行

### 6.1 本番用APIキーの設定

1. Stripe Dashboardで本番モードに切り替え
2. 本番用のAPIキーと価格IDを取得
3. Supabase Secretsを本番用の値で更新:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx --project-ref <your-project-ref>
supabase secrets set SNSGEN_STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx --project-ref <your-project-ref>
# ... 他のsecretsも同様に設定
```

4. フロントエンド環境変数も本番用に更新

### 6.2 Webhook URLの確認

本番環境のWebhook URLが正しく設定されていることを確認:
`https://<your-project-ref>.supabase.co/functions/v1/snsgen_stripe-webhook`

## 7. セキュリティチェックリスト

- [ ] 本番用APIキーは環境変数で管理
- [ ] Webhook署名を必ず検証
- [ ] RLSポリシーが正しく設定されている
- [ ] HTTPSのみを使用
- [ ] エラーログが適切に記録される
- [ ] テストモードと本番モードが分離されている

## トラブルシューティング

### Webhookが受信されない

1. Stripe Dashboardでイベントログを確認
2. Supabase Logsでエラーを確認: `supabase functions logs snsgen_stripe-webhook`
3. Webhook署名シークレットが正しいか確認

### 決済は成功するがDBが更新されない

1. Edge Functionのログを確認
2. RLSポリシーがService Role Keyで実行されているか確認
3. データベーステーブルが正しく作成されているか確認

### サブスクリプション状態の不整合

Stripe Dashboardで手動で同期:
```bash
# カスタムスクリプトで同期処理を実行
# または Stripe Dashboardから手動でWebhookイベントを再送信
```

## 参考リンク

- [Stripe公式ドキュメント](https://stripe.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Webhookテスト](https://stripe.com/docs/webhooks/test)
