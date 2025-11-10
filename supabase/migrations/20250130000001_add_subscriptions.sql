-- サブスクリプション管理テーブル
CREATE TABLE snsgen_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text NOT NULL CHECK (plan_type IN ('free', 'basic', 'pro', 'enterprise')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'paused', 'trialing')),
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 利用規約・プライバシーポリシー同意記録
CREATE TABLE snsgen_user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (consent_type IN ('terms', 'privacy')),
  consent_version text NOT NULL,
  consented_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);

-- 利用制限・クォータ管理
CREATE TABLE snsgen_usage_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  requests_count int NOT NULL DEFAULT 0,
  requests_limit int NOT NULL,
  accounts_count int NOT NULL DEFAULT 0,
  accounts_limit int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_start)
);

-- インデックス作成
CREATE INDEX idx_subscriptions_user_id ON snsgen_subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON snsgen_subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON snsgen_subscriptions(status);

CREATE INDEX idx_user_consents_user_id ON snsgen_user_consents(user_id);
CREATE INDEX idx_user_consents_type ON snsgen_user_consents(consent_type);

CREATE INDEX idx_usage_quotas_user_id ON snsgen_usage_quotas(user_id);
CREATE INDEX idx_usage_quotas_period ON snsgen_usage_quotas(period_start, period_end);

-- updated_at 自動更新トリガー
CREATE TRIGGER update_snsgen_subscriptions_updated_at
  BEFORE UPDATE ON snsgen_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_snsgen_usage_quotas_updated_at
  BEFORE UPDATE ON snsgen_usage_quotas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLSポリシー有効化
ALTER TABLE snsgen_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE snsgen_user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE snsgen_usage_quotas ENABLE ROW LEVEL SECURITY;

-- subscriptions RLS
CREATE POLICY "Users can view own subscription"
  ON snsgen_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON snsgen_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON snsgen_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- user_consents RLS
CREATE POLICY "Users can view own consents"
  ON snsgen_user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents"
  ON snsgen_user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- usage_quotas RLS
CREATE POLICY "Users can view own quotas"
  ON snsgen_usage_quotas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quotas"
  ON snsgen_usage_quotas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotas"
  ON snsgen_usage_quotas FOR UPDATE
  USING (auth.uid() = user_id);

-- プラン別の制限を定義する関数
CREATE OR REPLACE FUNCTION get_plan_limits(plan text)
RETURNS jsonb AS $$
BEGIN
  RETURN CASE plan
    WHEN 'free' THEN jsonb_build_object(
      'requests_per_month', 10,
      'accounts_limit', 1
    )
    WHEN 'basic' THEN jsonb_build_object(
      'requests_per_month', 100,
      'accounts_limit', 3
    )
    WHEN 'pro' THEN jsonb_build_object(
      'requests_per_month', 500,
      'accounts_limit', 10
    )
    WHEN 'enterprise' THEN jsonb_build_object(
      'requests_per_month', -1,
      'accounts_limit', -1
    )
    ELSE jsonb_build_object(
      'requests_per_month', 10,
      'accounts_limit', 1
    )
  END;
END;
$$ LANGUAGE plpgsql;

-- デフォルトのフリープランサブスクリプションを作成する関数
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- サブスクリプションレコードを作成
  INSERT INTO snsgen_subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active');

  -- 当月のクォータレコードを作成
  INSERT INTO snsgen_usage_quotas (
    user_id,
    plan_type,
    period_start,
    period_end,
    requests_count,
    requests_limit,
    accounts_count,
    accounts_limit
  )
  VALUES (
    NEW.id,
    'free',
    date_trunc('month', now()),
    date_trunc('month', now()) + interval '1 month',
    0,
    10,
    0,
    1
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 新規ユーザー作成時にデフォルトサブスクリプションを作成
CREATE TRIGGER create_default_subscription_trigger
  AFTER INSERT ON snsgen_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();
