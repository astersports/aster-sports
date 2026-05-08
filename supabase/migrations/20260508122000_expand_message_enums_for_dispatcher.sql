-- Mirror of production migration applied via Supabase MCP on May 8.
-- Widens delivery enums to support queue-then-send and Resend dispatcher.

ALTER TABLE public.tournament_message_recipients
  DROP CONSTRAINT tournament_message_recipients_delivery_status_check;

ALTER TABLE public.tournament_message_recipients
  ADD CONSTRAINT tournament_message_recipients_delivery_status_check
  CHECK (delivery_status = ANY (ARRAY[
    'queued', 'sent', 'delivered', 'opened', 'bounced', 'unsubscribed', 'failed'
  ]::text[]));

ALTER TABLE public.tournament_messages
  DROP CONSTRAINT tournament_messages_delivery_method_check;

ALTER TABLE public.tournament_messages
  ADD CONSTRAINT tournament_messages_delivery_method_check
  CHECK (delivery_method = ANY (ARRAY[
    'copy_paste', 'in_app', 'email', 'sms', 'resend_api', 'queued'
  ]::text[]));
