-- Add story field to snsgen_accounts table

ALTER TABLE public.snsgen_accounts
  ADD COLUMN IF NOT EXISTS story JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.snsgen_accounts.story IS 'Account story structure: hardship -> solution -> success';
