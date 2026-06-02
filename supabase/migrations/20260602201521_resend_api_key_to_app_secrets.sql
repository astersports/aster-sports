-- Closes Wave 3.A #19 P1: RESEND_API_KEY in Deno.env (should be app_secrets per AP #33).
--
-- The outbound Resend API key is read by 2 edge functions
-- (send-tournament-message + briefing-auto-draft-tick/_reminderSend)
-- via Deno.env.get("RESEND_API_KEY"). Per AP #33 doctrine, rotatable
-- shared secrets used by edge functions belong in public.app_secrets
-- (SQL-settable rotation, no Vercel/Supabase dashboard step).
--
-- This migration seeds the slot. Operator action: populate the value
-- via SQL UPDATE before the env fallback is removed in a follow-up PR.
-- Until populated, the edge functions fall back to Deno.env.RESEND_API_KEY
-- so no behavior changes immediately on apply.
--
--   UPDATE public.app_secrets
--      SET value = '<paste resend key from Vercel env or Resend dashboard>',
--          rotated_at = now()
--    WHERE name = 'resend_api_key';

insert into public.app_secrets (name, value)
  values ('resend_api_key', null)
  on conflict (name) do nothing;

comment on table public.app_secrets is
  'Centralized shared secrets per AP #33. Edge functions read via service-role SELECT through getAppSecret(sb, name). Rotation = UPDATE ... SET value, rotated_at. Includes HMAC token secrets (rsvp/callup/feedback/unsubscribe), cron_secret, supabase_jwt_secret, anthropic_api_key, resend_api_key (post Wave 3.A #19 P1 closure), and VAPID keys.';
