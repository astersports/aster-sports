-- L99 wave 4.1+4.2 foundation step M6: voice_config on organizations
-- Per-org voice tokens used by templates: signoff block, primary contact, tone notes, AI examples.
-- Lets each org maintain its own voice consistency without hardcoded values.

ALTER TABLE organizations
  ADD COLUMN voice_config jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE organizations
SET voice_config = jsonb_build_object(
  'primary_contact_name', 'Frankie Samaritano',
  'primary_contact_role', 'Program Director',
  'primary_contact_phone', '(917) 991-9830',
  'primary_contact_email', 'admin@legacyhoopers.org',
  'secondary_contact_name', 'Kenny Lane',
  'secondary_contact_role', 'Coaching Director',
  'secondary_contact_phone', '(516) 644-0208',
  'signoff_default', 'Frankie + Kenny',
  'tone_notes', 'warm, direct, sharp operator voice. no corporate jargon. occasional emoji ok. number-first team naming.',
  'team_naming_convention', 'number_first',
  'unsubscribe_explainer_text', 'You are receiving this because your child is on a Legacy Hoopers roster.',
  'brand_accent_hex', '#4a8fd4',
  'brand_header_hex', '#1e3a5f'
)
WHERE id='e3e95e21-3571-4e9a-985a-d5d01480d4a6';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM organizations
    WHERE id='e3e95e21-3571-4e9a-985a-d5d01480d4a6'
      AND voice_config ? 'primary_contact_name'
      AND voice_config ? 'signoff_default'
  ) THEN
    RAISE EXCEPTION 'M6 voice_config seed missing keys for Legacy Hoopers';
  END IF;
END $$;
