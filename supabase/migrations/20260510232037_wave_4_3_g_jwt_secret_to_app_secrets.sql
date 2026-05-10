-- Wave 4.3-G: provision app_secrets slot for SUPABASE_JWT_SECRET.
-- Admin populates the value separately via SQL editor with the
-- secret read from Supabase dashboard (Settings → API → JWT
-- Settings → JWT Secret). NULL until populated; dispatcher
-- fail-louds on NULL with a clear error message.
--
-- Drops NOT NULL on app_secrets.value to allow provisioning a slot
-- before its value is known. Existing rows are unaffected (all have
-- values). Application-level NULL checks in the read helpers
-- (getAppSecret) are the real integrity guard.

ALTER TABLE public.app_secrets ALTER COLUMN value DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_secrets WHERE name = 'supabase_jwt_secret') THEN
    INSERT INTO public.app_secrets (name, value) VALUES ('supabase_jwt_secret', NULL);
    RAISE NOTICE 'Wave 4.3-G: supabase_jwt_secret slot created (NULL). Admin must populate via SQL UPDATE before dispatcher can mint JWTs.';
  ELSE
    RAISE NOTICE 'Wave 4.3-G: supabase_jwt_secret row already exists; leaving as-is.';
  END IF;
END $$;

-- Verification: confirm the row exists. Does NOT print value.
DO $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.app_secrets WHERE name = 'supabase_jwt_secret') INTO v_exists;
  IF NOT v_exists THEN
    RAISE EXCEPTION 'Wave 4.3-G: supabase_jwt_secret row missing after migration';
  END IF;
  RAISE NOTICE 'Wave 4.3-G: supabase_jwt_secret slot present in app_secrets.';
END $$;
