-- Phase 4 Wave 2: Direct messages
-- dm_threads tracks 1:1 conversations between two users.
-- Messages with channel='dm' reference dm_thread_id.

CREATE TABLE IF NOT EXISTS public.dm_threads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_a      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT dm_users_ordered CHECK (user_a < user_b),
  CONSTRAINT dm_unique_pair UNIQUE (org_id, user_a, user_b)
);

CREATE INDEX idx_dm_threads_user_a ON public.dm_threads (user_a, org_id);
CREATE INDEX idx_dm_threads_user_b ON public.dm_threads (user_b, org_id);

-- Add dm_thread_id to messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS dm_thread_id uuid REFERENCES public.dm_threads(id) ON DELETE CASCADE;

CREATE INDEX idx_messages_dm_thread ON public.messages (dm_thread_id, created_at DESC)
  WHERE channel = 'dm';

-- Add constraint: dm channel needs a thread
ALTER TABLE public.messages
  ADD CONSTRAINT dm_channel_needs_thread CHECK (
    channel != 'dm' OR dm_thread_id IS NOT NULL
  );

-- RLS for dm_threads
ALTER TABLE public.dm_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY dm_threads_select ON public.dm_threads
  FOR SELECT TO authenticated
  USING (user_a = (SELECT auth.uid()) OR user_b = (SELECT auth.uid()));

CREATE POLICY dm_threads_insert ON public.dm_threads
  FOR INSERT TO authenticated
  WITH CHECK (
    (user_a = (SELECT auth.uid()) OR user_b = (SELECT auth.uid()))
    AND org_id IN (
      SELECT ur.organization_id FROM public.user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
    )
  );

-- Update messages insert policy to allow DMs
DROP POLICY IF EXISTS messages_insert ON public.messages;
CREATE POLICY messages_insert ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND org_id IN (
      SELECT ur.organization_id FROM public.user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
    )
    AND (
      (channel = 'team' AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
          AND ur.organization_id = org_id
          AND ur.role IN ('admin', 'coach')
      ))
      OR
      (channel = 'announcement' AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
          AND ur.organization_id = org_id
          AND ur.role = 'admin'
      ))
      OR
      (channel = 'team' AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
          AND ur.organization_id = org_id
          AND ur.role = 'parent'
      ) AND EXISTS (
        SELECT 1 FROM public.guardians g
        JOIN public.player_guardians pg ON pg.guardian_id = g.id
        JOIN public.roster_members rm ON rm.player_id = pg.player_id
        WHERE g.user_id = (SELECT auth.uid())
          AND rm.team_id = messages.team_id
      ))
      OR
      (channel = 'dm' AND EXISTS (
        SELECT 1 FROM public.dm_threads dt
        WHERE dt.id = messages.dm_thread_id
          AND (dt.user_a = (SELECT auth.uid()) OR dt.user_b = (SELECT auth.uid()))
      ))
    )
  );

-- Update messages select to restrict DM visibility
DROP POLICY IF EXISTS messages_select ON public.messages;
CREATE POLICY messages_select ON public.messages
  FOR SELECT TO authenticated
  USING (
    (channel != 'dm' AND org_id IN (
      SELECT ur.organization_id FROM public.user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
    ))
    OR
    (channel = 'dm' AND EXISTS (
      SELECT 1 FROM public.dm_threads dt
      WHERE dt.id = dm_thread_id
        AND (dt.user_a = (SELECT auth.uid()) OR dt.user_b = (SELECT auth.uid()))
    ))
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_threads;
