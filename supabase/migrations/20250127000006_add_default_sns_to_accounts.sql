-- アカウントにデフォルトSNSを追加
ALTER TABLE public.snsgen_accounts
  ADD COLUMN IF NOT EXISTS default_sns TEXT CHECK (default_sns IN ('X', 'Instagram', 'Threads', 'note')) DEFAULT 'X';

COMMENT ON COLUMN public.snsgen_accounts.default_sns IS 'このアカウントで主に使用するSNS';

-- 既存のアカウントにデフォルト値を設定
UPDATE public.snsgen_accounts SET default_sns = 'X' WHERE default_sns IS NULL;
