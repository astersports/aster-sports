-- Wave C (push notifications) PR A — push_subscriptions foundation.
-- Stores Web Push (RFC 8291) subscriptions per user/device. The device
-- registers + removes its OWN subscription (owner-self RLS); the send
-- path (a future edge function) reads via service_role, which bypasses
-- RLS. p256dh + auth_key are the subscription's public key + auth secret
-- (PushSubscription.keys.{p256dh,auth}). endpoint is unique per device.
-- (SELECT auth.uid()) subselect wrapper is initplan-safe per CLAUDE.md §5;
-- WITH CHECK mirrors USING on the ALL policy per AP #20.
--
-- Mirror of MCP-applied migration registered as version 20260527224244
-- (AP #21). Byte-identical to the applied DDL.

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE INDEX push_subscriptions_user_idx ON public.push_subscriptions(user_id);
CREATE INDEX push_subscriptions_org_idx ON public.push_subscriptions(org_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own push subscriptions"
  ON public.push_subscriptions FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
