-- ユーザー登録時に自動でプロファイルを作成するトリガー

-- プロファイル自動作成関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.snsgen_profiles (user_id, role, display_name)
  VALUES (
    NEW.id,
    'user',
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- ユーザー作成時のトリガー
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 既存ユーザーのプロファイルを作成（初回のみ実行）
INSERT INTO public.snsgen_profiles (user_id, role, display_name)
SELECT
  id,
  'user',
  COALESCE(raw_user_meta_data->>'display_name', email)
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.snsgen_profiles)
ON CONFLICT (user_id) DO NOTHING;
