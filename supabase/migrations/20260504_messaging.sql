-- Phase 4 Wave 1: Messaging foundation
CREATE TABLE IF NOT EXISTS public.messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel       text NOT NULL CHECK (channel IN ('team', 'announcement', 'dm')),
  team_id       uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  sender_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name   text NOT NULL,
  body          text NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 2000),
  pinned        boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_channel_needs_team CHECK (channel != 'team' OR team_id IS NOT NULL)
);
CREATE INDEX idx_messages_team_channel ON public.messages (team_id, created_at DESC) WHERE channel = 'team';
CREATE INDEX idx_messages_org_announce ON public.messages (org_id, created_at DESC) WHERE channel = 'announcement';
CREATE INDEX idx_messages_sender ON public.messages (sender_id, created_at DESC);
CREATE TABLE IF NOT EXISTS public.message_reads (
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_key   text NOT NULL,
  last_read_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, channel_key)
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY messages_select ON public.messages FOR SELECT TO authenticated USING (org_id IN (SELECT ur.organization_id FROM public.user_roles ur WHERE ur.user_id = (SELECT auth.uid())));
CREATE POLICY messages_insert ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = (SELECT auth.uid()) AND org_id IN (SELECT ur.organization_id FROM public.user_roles ur WHERE ur.user_id = (SELECT auth.uid())) AND ((channel = 'team' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = (SELECT auth.uid()) AND ur.organization_id = org_id AND ur.role IN ('admin', 'coach'))) OR (channel = 'announcement' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = (SELECT auth.uid()) AND ur.organization_id = org_id AND ur.role = 'admin')) OR (channel = 'team' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = (SELECT auth.uid()) AND ur.organization_id = org_id AND ur.role = 'parent') AND EXISTS (SELECT 1 FROM public.guardians g JOIN public.player_guardians pg ON pg.guardian_id = g.id JOIN public.roster_members rm ON rm.player_id = pg.player_id WHERE g.user_id = (SELECT auth.uid()) AND rm.team_id = messages.team_id))));
CREATE POLICY messages_delete ON public.messages FOR DELETE TO authenticated USING (sender_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = (SELECT auth.uid()) AND ur.organization_id = org_id AND ur.role = 'admin'));
CREATE POLICY message_reads_own ON public.message_reads FOR ALL TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
