-- RLS（Row Level Security）ポリシー設定

-- 1. snsgen_profiles のRLS
ALTER TABLE public.snsgen_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.snsgen_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.snsgen_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.snsgen_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON public.snsgen_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- 2. snsgen_accounts のRLS
ALTER TABLE public.snsgen_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts"
  ON public.snsgen_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON public.snsgen_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON public.snsgen_accounts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON public.snsgen_accounts
  FOR DELETE
  USING (auth.uid() = user_id);

-- 3. snsgen_templates のRLS
ALTER TABLE public.snsgen_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
  ON public.snsgen_templates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON public.snsgen_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON public.snsgen_templates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON public.snsgen_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. snsgen_requests のRLS
ALTER TABLE public.snsgen_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests"
  ON public.snsgen_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests"
  ON public.snsgen_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own requests"
  ON public.snsgen_requests
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own requests"
  ON public.snsgen_requests
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. snsgen_results のRLS（request経由で所有権判定）
ALTER TABLE public.snsgen_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own results"
  ON public.snsgen_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.snsgen_requests r
      WHERE r.id = snsgen_results.request_id
      AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own results"
  ON public.snsgen_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.snsgen_requests r
      WHERE r.id = request_id
      AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own results"
  ON public.snsgen_results
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.snsgen_requests r
      WHERE r.id = snsgen_results.request_id
      AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own results"
  ON public.snsgen_results
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.snsgen_requests r
      WHERE r.id = snsgen_results.request_id
      AND r.user_id = auth.uid()
    )
  );

-- 6. snsgen_dictionaries のRLS
ALTER TABLE public.snsgen_dictionaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dictionaries"
  ON public.snsgen_dictionaries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dictionaries"
  ON public.snsgen_dictionaries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dictionaries"
  ON public.snsgen_dictionaries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dictionaries"
  ON public.snsgen_dictionaries
  FOR DELETE
  USING (auth.uid() = user_id);
