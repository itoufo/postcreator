-- SNS接続情報テーブル
CREATE TABLE IF NOT EXISTS public.snsgen_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.snsgen_accounts(id) ON DELETE CASCADE,
  sns_type TEXT NOT NULL CHECK (sns_type IN ('X', 'Instagram', 'Threads', 'note')),
  connection_name TEXT NOT NULL,

  -- 暗号化されたトークン情報（JSONB）
  -- 例: {"access_token": "...", "refresh_token": "...", "token_secret": "...", "expires_at": "..."}
  credentials JSONB NOT NULL,

  -- 接続のメタデータ
  metadata JSONB DEFAULT '{}'::jsonb,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- 1ユーザーあたり1つのSNSタイプにつき複数の接続を許可するが、名前は一意
  UNIQUE(user_id, sns_type, connection_name)
);

-- インデックス
CREATE INDEX idx_snsgen_connections_user_id ON public.snsgen_connections(user_id);
CREATE INDEX idx_snsgen_connections_account_id ON public.snsgen_connections(account_id);
CREATE INDEX idx_snsgen_connections_sns_type ON public.snsgen_connections(sns_type);
CREATE INDEX idx_snsgen_connections_is_active ON public.snsgen_connections(is_active);

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_snsgen_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_snsgen_connections_updated_at
  BEFORE UPDATE ON public.snsgen_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_snsgen_connections_updated_at();

-- RLS（Row Level Security）ポリシー
ALTER TABLE public.snsgen_connections ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の接続情報のみ閲覧可能
CREATE POLICY "Users can view their own connections"
  ON public.snsgen_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分の接続情報のみ作成可能
CREATE POLICY "Users can create their own connections"
  ON public.snsgen_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の接続情報のみ更新可能
CREATE POLICY "Users can update their own connections"
  ON public.snsgen_connections
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の接続情報のみ削除可能
CREATE POLICY "Users can delete their own connections"
  ON public.snsgen_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- 投稿履歴にSNS接続情報を追加
ALTER TABLE public.snsgen_results
  ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES public.snsgen_connections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS publish_error TEXT;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_snsgen_results_connection_id ON public.snsgen_results(connection_id);
CREATE INDEX IF NOT EXISTS idx_snsgen_results_published_at ON public.snsgen_results(published_at);

COMMENT ON TABLE public.snsgen_connections IS 'SNS接続情報（OAuth トークンなど）';
COMMENT ON COLUMN public.snsgen_connections.credentials IS '暗号化されたトークン情報（JSONB）';
COMMENT ON COLUMN public.snsgen_connections.metadata IS '接続に関する追加メタデータ';
