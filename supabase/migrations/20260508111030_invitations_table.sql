CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'coach', 'parent')),
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  player_ids uuid[] NOT NULL DEFAULT '{}',
  coaching_assignment_payload jsonb,
  message text,
  token text NOT NULL UNIQUE
    DEFAULT replace(replace(encode(gen_random_bytes(24), 'base64'), '/', '_'), '+', '-'),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  invited_at timestamptz NOT NULL DEFAULT NOW(),
  expires_at timestamptz NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id),
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES auth.users(id),
  cancel_reason text,
  resent_count int NOT NULL DEFAULT 0,
  last_resent_at timestamptz,
  CONSTRAINT invitations_not_both_accepted_and_cancelled
    CHECK (accepted_at IS NULL OR cancelled_at IS NULL)
);

COMMENT ON TABLE public.invitations IS
  'Pending invitations for org membership. Token-based public claim. One row per invite, append-only.';
COMMENT ON COLUMN public.invitations.coaching_assignment_payload IS
  'For role=coach: {scope, team_id, rates, pay_per_session_cents, display_name, org_title}.';
COMMENT ON COLUMN public.invitations.player_ids IS
  'For role=parent: array of player.id values to link as guardian on accept.';

CREATE UNIQUE INDEX invitations_one_open_per_org_email_role
  ON public.invitations (org_id, lower(email), role)
  WHERE accepted_at IS NULL AND cancelled_at IS NULL;
CREATE INDEX invitations_org_pending
  ON public.invitations (org_id, expires_at)
  WHERE accepted_at IS NULL AND cancelled_at IS NULL;
CREATE INDEX invitations_token_open ON public.invitations (token)
  WHERE accepted_at IS NULL AND cancelled_at IS NULL;
CREATE INDEX invitations_email_lookup ON public.invitations (lower(email));

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_select_admin" ON public.invitations
  FOR SELECT TO authenticated
  USING (public.user_has_role_in_org(org_id, ARRAY['admin']));

CREATE POLICY "invitations_insert_admin" ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_has_role_in_org(org_id, ARRAY['admin'])
    AND invited_by = auth.uid()
  );

CREATE POLICY "invitations_update_admin" ON public.invitations
  FOR UPDATE TO authenticated
  USING (public.user_has_role_in_org(org_id, ARRAY['admin']))
  WITH CHECK (public.user_has_role_in_org(org_id, ARRAY['admin']));

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
  SELECT jsonb_build_object(
    'id', i.id, 'org_id', i.org_id,
    'org_name', o.display_name, 'org_logo_url', o.logo_url,
    'email', i.email, 'role', i.role,
    'team_id', i.team_id, 'team_name', t.name,
    'expires_at', i.expires_at,
    'is_expired', (i.expires_at < NOW()),
    'is_accepted', (i.accepted_at IS NOT NULL),
    'is_cancelled', (i.cancelled_at IS NOT NULL),
    'message', i.message
  )
  FROM public.invitations i
  LEFT JOIN public.organizations o ON o.id = i.org_id
  LEFT JOIN public.teams t ON t.id = i.team_id
  WHERE i.token = p_token LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;
