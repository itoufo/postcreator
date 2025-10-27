-- アカウントテーブルに知識ベースカラムを追加

ALTER TABLE public.snsgen_accounts
ADD COLUMN knowledge_base text DEFAULT '';

COMMENT ON COLUMN public.snsgen_accounts.knowledge_base IS 'ブランド/商品情報、トーン例、参考投稿など、投稿生成時に参照する知識ベース';
