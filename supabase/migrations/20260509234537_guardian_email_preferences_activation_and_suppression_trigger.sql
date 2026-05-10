-- L99 wave 4.1+4.2 foundation step M7: activate guardian_email_preferences
-- Table already exists with right shape. Add index, RLS policies, and BEFORE INSERT
-- trigger on comms_message_recipients that suppresses sends to unsubscribed guardians.
-- This is the CAN-SPAM compliance backbone.

CREATE INDEX IF NOT EXISTS guardian_email_prefs_unsubscribed_idx
  ON guardian_email_preferences(guardian_id)
  WHERE unsubscribed_at IS NOT NULL;

ALTER TABLE guardian_email_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guardian_email_prefs_read_self" ON guardian_email_preferences;
DROP POLICY IF EXISTS "guardian_email_prefs_read_admin" ON guardian_email_preferences;
DROP POLICY IF EXISTS "guardian_email_prefs_self_update" ON guardian_email_preferences;
DROP POLICY IF EXISTS "guardian_email_prefs_admin_all" ON guardian_email_preferences;

CREATE POLICY "guardian_email_prefs_read_self" ON guardian_email_preferences FOR SELECT
  USING (
    guardian_id IN (SELECT id FROM guardians WHERE user_id = auth.uid())
  );

CREATE POLICY "guardian_email_prefs_read_admin" ON guardian_email_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guardians g
      JOIN user_roles ur ON ur.organization_id = g.org_id
      WHERE g.id = guardian_email_preferences.guardian_id
        AND ur.user_id = auth.uid()
        AND ur.role IN ('admin','super_admin','coach')
    )
  );

CREATE POLICY "guardian_email_prefs_self_update" ON guardian_email_preferences FOR UPDATE
  USING (guardian_id IN (SELECT id FROM guardians WHERE user_id = auth.uid()))
  WITH CHECK (guardian_id IN (SELECT id FROM guardians WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION suppress_unsubscribed_recipients()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM guardian_email_preferences
    WHERE guardian_id = NEW.guardian_id
      AND unsubscribed_at IS NOT NULL
  ) THEN
    RAISE NOTICE 'Suppressed recipient INSERT: guardian % is unsubscribed', NEW.guardian_id;
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS suppress_unsubscribed_trigger ON comms_message_recipients;
CREATE TRIGGER suppress_unsubscribed_trigger
  BEFORE INSERT ON comms_message_recipients
  FOR EACH ROW
  EXECUTE FUNCTION suppress_unsubscribed_recipients();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='suppress_unsubscribed_trigger') THEN
    RAISE EXCEPTION 'suppress_unsubscribed_trigger not created';
  END IF;
END $$;
