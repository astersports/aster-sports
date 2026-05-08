-- Mirror of production migration applied via Supabase MCP on May 8.
-- Already in production schema_migrations history; does not re-run on db reset.
-- Reshapes tournament_messages from copy-paste-after-send to queue-then-send.

ALTER TABLE public.tournament_messages
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

UPDATE public.tournament_messages tm
SET org_id = t.org_id
FROM public.tournaments t
WHERE tm.tournament_id = t.id AND tm.org_id IS NULL;

ALTER TABLE public.tournament_messages
  ALTER COLUMN org_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS tournament_messages_org_id_idx
  ON public.tournament_messages (org_id);

ALTER TABLE public.tournament_messages
  ALTER COLUMN sent_at DROP NOT NULL,
  ALTER COLUMN sent_at DROP DEFAULT;
