-- アカウント設計フィールドの追加とストーリーの移行

-- 1. account_design カラムを追加
ALTER TABLE public.snsgen_accounts
  ADD COLUMN IF NOT EXISTS account_design JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.snsgen_accounts.account_design IS 'Account design strategy to target persona (includes story, positioning, etc)';

-- 2. 既存の story データを account_design.story に移行
UPDATE public.snsgen_accounts
SET account_design = jsonb_set(
  COALESCE(account_design, '{}'::jsonb),
  '{story}',
  COALESCE(story, '{}'::jsonb)
)
WHERE story IS NOT NULL AND story != '{}'::jsonb;

-- 3. story カラムを削除
ALTER TABLE public.snsgen_accounts
  DROP COLUMN IF EXISTS story;
