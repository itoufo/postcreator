-- PostCreator 初期スキーマ
-- テーブルプレフィックス: snsgen_

-- 1. プロファイル（ユーザー権限管理）
CREATE TABLE IF NOT EXISTS public.snsgen_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  display_name text,
  avatar_url text,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. アカウント（ブランド/ペルソナ）
CREATE TABLE IF NOT EXISTS public.snsgen_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  theme text,
  persona jsonb DEFAULT '{}'::jsonb,
  tone_guidelines jsonb DEFAULT '{}'::jsonb,
  banned_terms text[] DEFAULT '{}'::text[],
  must_include text[] DEFAULT '{}'::text[],
  link_policy jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. プロンプトテンプレート
CREATE TABLE IF NOT EXISTS public.snsgen_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.snsgen_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  system_prompt text NOT NULL,
  user_prompt_template text NOT NULL,
  constraints jsonb DEFAULT '{}'::jsonb,
  sns_profiles jsonb DEFAULT '{}'::jsonb,
  version int DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. 生成リクエスト
CREATE TABLE IF NOT EXISTS public.snsgen_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.snsgen_accounts(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.snsgen_templates(id) ON DELETE SET NULL,
  inputs jsonb NOT NULL,
  status text DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- 5. 生成結果
CREATE TABLE IF NOT EXISTS public.snsgen_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.snsgen_requests(id) ON DELETE CASCADE,
  sns text NOT NULL CHECK (sns IN ('X', 'Instagram', 'Threads', 'note')),
  post_type text NOT NULL,
  draft text NOT NULL,
  alt_versions jsonb DEFAULT '{}'::jsonb,
  hashtags text[] DEFAULT '{}'::text[],
  checks jsonb DEFAULT '{}'::jsonb,
  score int CHECK (score >= 1 AND score <= 5),
  note text,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 6. 辞書（ハッシュタグ/CTA候補等）
CREATE TABLE IF NOT EXISTS public.snsgen_dictionaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.snsgen_accounts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('hashtags', 'cta', 'synonyms', 'domain_terms')),
  name text NOT NULL,
  entries jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_snsgen_profiles_user_id ON public.snsgen_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_snsgen_accounts_user_id ON public.snsgen_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_snsgen_templates_user_id ON public.snsgen_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_snsgen_templates_account_id ON public.snsgen_templates(account_id);
CREATE INDEX IF NOT EXISTS idx_snsgen_requests_user_id ON public.snsgen_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_snsgen_requests_account_id ON public.snsgen_requests(account_id);
CREATE INDEX IF NOT EXISTS idx_snsgen_requests_created_at ON public.snsgen_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snsgen_results_request_id ON public.snsgen_results(request_id);
CREATE INDEX IF NOT EXISTS idx_snsgen_results_sns ON public.snsgen_results(sns);
CREATE INDEX IF NOT EXISTS idx_snsgen_results_created_at ON public.snsgen_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snsgen_dictionaries_user_id ON public.snsgen_dictionaries(user_id);
CREATE INDEX IF NOT EXISTS idx_snsgen_dictionaries_account_id ON public.snsgen_dictionaries(account_id);
CREATE INDEX IF NOT EXISTS idx_snsgen_dictionaries_type ON public.snsgen_dictionaries(type);

-- updated_at 自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at トリガー
CREATE TRIGGER update_snsgen_profiles_updated_at
  BEFORE UPDATE ON public.snsgen_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_snsgen_accounts_updated_at
  BEFORE UPDATE ON public.snsgen_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_snsgen_templates_updated_at
  BEFORE UPDATE ON public.snsgen_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_snsgen_dictionaries_updated_at
  BEFORE UPDATE ON public.snsgen_dictionaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
