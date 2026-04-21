-- ============================================================
-- 011_tournaments.sql
--
-- Retrospective: captures tournament tables (tournaments, tournament_teams,
-- tournament_rosters, tournament_messages, tournament_message_recipients,
-- championship_scenarios, circuit_rules) plus opponents table extensions.
-- Created in production via SQL Editor during Session 2A. Captured here so
-- a fresh DB rebuild reproduces the live schema.
-- Excludes the idx_tmr_* duplicate indexes (will be dropped from production
-- in migration 013). Safe to re-apply: idempotent.
-- ============================================================

BEGIN;

-- ============================================================
-- SECTION 1: opponents table extensions
-- ============================================================

ALTER TABLE public.opponents ADD COLUMN IF NOT EXISTS circuit text;
ALTER TABLE public.opponents ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.opponents ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.opponents ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.opponents ADD COLUMN IF NOT EXISTS scouting_notes text;
ALTER TABLE public.opponents ADD COLUMN IF NOT EXISTS default_character_note text;
ALTER TABLE public.opponents ADD COLUMN IF NOT EXISTS first_played_at date;
ALTER TABLE public.opponents ADD COLUMN IF NOT EXISTS last_played_at date;
ALTER TABLE public.opponents ADD COLUMN IF NOT EXISTS head_to_head_wins integer NOT NULL DEFAULT 0;
ALTER TABLE public.opponents ADD COLUMN IF NOT EXISTS head_to_head_losses integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_opponents_org_name_circuit
  ON public.opponents (org_id, name, COALESCE(circuit, ''::text));

DROP POLICY IF EXISTS opponents_org_isolation ON public.opponents;
CREATE POLICY opponents_org_isolation ON public.opponents
  FOR ALL
  USING (org_id = public.current_user_org_id());

-- ============================================================
-- SECTION 2: tournaments
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  circuit text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  primary_venue text,
  primary_venue_address text,
  tourney_url text,
  hotel_url text,
  entry_fee_cents integer,
  survival_notes text,
  coach_theme text,
  status text NOT NULL DEFAULT 'planned',
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  schedule_status text NOT NULL DEFAULT 'draft',
  game_day_guide jsonb,
  rsvp_deadline_at timestamptz,
  hotel_deadline_at timestamptz,
  pool_label text,
  roster_locked_at timestamptz,
  roster_locked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT tournaments_status_check CHECK (status = ANY (ARRAY['planned'::text, 'scheduled'::text, 'in_progress'::text, 'eliminated'::text, 'champions'::text, 'complete'::text, 'cancelled'::text])),
  CONSTRAINT tournaments_schedule_status_check CHECK (schedule_status = ANY (ARRAY['draft'::text, 'preliminary'::text, 'final'::text, 'live'::text, 'complete'::text]))
);

CREATE INDEX IF NOT EXISTS idx_tournaments_org_dates
  ON public.tournaments (org_id, start_date DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tournaments_status
  ON public.tournaments (org_id, status)
  WHERE archived_at IS NULL;

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tournaments_read ON public.tournaments;
CREATE POLICY tournaments_read ON public.tournaments
  FOR SELECT
  USING (
    org_id IN (
      SELECT user_roles.organization_id
      FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS tournaments_write ON public.tournaments;
CREATE POLICY tournaments_write ON public.tournaments
  FOR ALL
  USING (
    org_id IN (
      SELECT user_roles.organization_id
      FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = ANY (ARRAY['admin'::text, 'coach'::text])
    )
  );

-- ============================================================
-- SECTION 3: tournament_teams
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tournament_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  final_record_wins integer NOT NULL DEFAULT 0,
  final_record_losses integer NOT NULL DEFAULT 0,
  final_place text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tournament_teams_tournament_id_team_id_key UNIQUE (tournament_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_teams_team
  ON public.tournament_teams (team_id, tournament_id);

ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tournament_teams_read ON public.tournament_teams;
CREATE POLICY tournament_teams_read ON public.tournament_teams
  FOR SELECT
  USING (
    tournament_id IN (
      SELECT tournaments.id FROM tournaments
      WHERE tournaments.org_id IN (
        SELECT user_roles.organization_id
        FROM user_roles
        WHERE user_roles.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS tournament_teams_write ON public.tournament_teams;
CREATE POLICY tournament_teams_write ON public.tournament_teams
  FOR ALL
  USING (
    tournament_id IN (
      SELECT tournaments.id FROM tournaments
      WHERE tournaments.org_id IN (
        SELECT user_roles.organization_id
        FROM user_roles
        WHERE user_roles.user_id = auth.uid()
          AND user_roles.role = ANY (ARRAY['admin'::text, 'coach'::text])
      )
    )
  );

-- ============================================================
-- SECTION 4: tournament_rosters
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tournament_rosters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  roster_status text NOT NULL DEFAULT 'active',
  jersey_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tournament_rosters_tournament_id_team_id_player_id_key UNIQUE (tournament_id, team_id, player_id),
  CONSTRAINT tournament_rosters_roster_status_check CHECK (roster_status = ANY (ARRAY['active'::text, 'futures_callup'::text, 'unavailable'::text]))
);

CREATE INDEX IF NOT EXISTS idx_tournament_rosters_lookup
  ON public.tournament_rosters (tournament_id, team_id, roster_status);

ALTER TABLE public.tournament_rosters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tournament_rosters_read ON public.tournament_rosters;
CREATE POLICY tournament_rosters_read ON public.tournament_rosters
  FOR SELECT
  USING (
    tournament_id IN (
      SELECT tournaments.id FROM tournaments
      WHERE tournaments.org_id IN (
        SELECT user_roles.organization_id
        FROM user_roles
        WHERE user_roles.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS tournament_rosters_write ON public.tournament_rosters;
CREATE POLICY tournament_rosters_write ON public.tournament_rosters
  FOR ALL
  USING (
    tournament_id IN (
      SELECT tournaments.id FROM tournaments
      WHERE tournaments.org_id IN (
        SELECT user_roles.organization_id
        FROM user_roles
        WHERE user_roles.user_id = auth.uid()
          AND user_roles.role = ANY (ARRAY['admin'::text, 'coach'::text])
      )
    )
  );

-- ============================================================
-- SECTION 5: tournament_messages
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tournament_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  message_type text NOT NULL,
  subject text,
  body_html text NOT NULL,
  body_plain text NOT NULL,
  sent_by uuid REFERENCES auth.users(id),
  sent_at timestamptz NOT NULL DEFAULT now(),
  recipient_count integer NOT NULL DEFAULT 0,
  delivery_method text NOT NULL DEFAULT 'copy_paste',
  language_code text NOT NULL DEFAULT 'en',
  custom_header text,
  custom_subheader text,
  custom_narrative text,
  custom_closing text,
  custom_signoff text,
  replaces_message_id uuid REFERENCES public.tournament_messages(id) ON DELETE SET NULL,
  opened_count integer NOT NULL DEFAULT 0,
  displayed_from_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_message_id uuid REFERENCES public.tournament_messages(id) ON DELETE SET NULL,
  message_group_id uuid,
  CONSTRAINT tournament_messages_message_type_check CHECK (message_type = ANY (ARRAY['preliminary_schedule'::text, 'final_schedule'::text, 'rsvp_lock'::text, 'saturday_scenarios'::text, 'day1_recap'::text, 'weekend_recap'::text, 'schedule_change'::text, 'multi_team_notice'::text, 'custom'::text])),
  CONSTRAINT tournament_messages_delivery_method_check CHECK (delivery_method = ANY (ARRAY['copy_paste'::text, 'in_app'::text, 'email'::text, 'sms'::text]))
);

CREATE INDEX IF NOT EXISTS idx_tournament_messages_lookup
  ON public.tournament_messages (tournament_id, team_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_tournament_messages_parent
  ON public.tournament_messages (parent_message_id)
  WHERE parent_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tournament_messages_group
  ON public.tournament_messages (message_group_id)
  WHERE message_group_id IS NOT NULL;

ALTER TABLE public.tournament_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tournament_messages_read ON public.tournament_messages;
CREATE POLICY tournament_messages_read ON public.tournament_messages
  FOR SELECT
  USING (
    tournament_id IN (
      SELECT tournaments.id FROM tournaments
      WHERE tournaments.org_id IN (
        SELECT user_roles.organization_id
        FROM user_roles
        WHERE user_roles.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS tournament_messages_write ON public.tournament_messages;
CREATE POLICY tournament_messages_write ON public.tournament_messages
  FOR ALL
  USING (
    tournament_id IN (
      SELECT tournaments.id FROM tournaments
      WHERE tournaments.org_id IN (
        SELECT user_roles.organization_id
        FROM user_roles
        WHERE user_roles.user_id = auth.uid()
          AND user_roles.role = ANY (ARRAY['admin'::text, 'coach'::text])
      )
    )
  );

-- ============================================================
-- SECTION 6: tournament_message_recipients (clean, no duplicate indexes)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tournament_message_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.tournament_messages(id) ON DELETE CASCADE,
  guardian_id uuid REFERENCES public.guardians(id) ON DELETE SET NULL,
  email_at_send text NOT NULL,
  delivery_method text NOT NULL DEFAULT 'copy_paste',
  delivery_status text DEFAULT 'sent',
  opened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tournament_message_recipients_delivery_status_check CHECK (delivery_status = ANY (ARRAY['sent'::text, 'delivered'::text, 'opened'::text, 'bounced'::text, 'unsubscribed'::text]))
);

CREATE INDEX IF NOT EXISTS idx_message_recipients_msg
  ON public.tournament_message_recipients (message_id);

CREATE INDEX IF NOT EXISTS idx_message_recipients_guardian
  ON public.tournament_message_recipients (guardian_id, opened_at);

ALTER TABLE public.tournament_message_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tmr_read ON public.tournament_message_recipients;
CREATE POLICY tmr_read ON public.tournament_message_recipients
  FOR SELECT
  USING (
    message_id IN (
      SELECT tournament_messages.id FROM tournament_messages
      WHERE tournament_messages.tournament_id IN (
        SELECT tournaments.id FROM tournaments
        WHERE tournaments.org_id IN (
          SELECT user_roles.organization_id
          FROM user_roles
          WHERE user_roles.user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS tmr_write ON public.tournament_message_recipients;
CREATE POLICY tmr_write ON public.tournament_message_recipients
  FOR ALL
  USING (
    message_id IN (
      SELECT tournament_messages.id FROM tournament_messages
      WHERE tournament_messages.tournament_id IN (
        SELECT tournaments.id FROM tournaments
        WHERE tournaments.org_id IN (
          SELECT user_roles.organization_id
          FROM user_roles
          WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = ANY (ARRAY['admin'::text, 'coach'::text])
        )
      )
    )
  );

-- ============================================================
-- SECTION 7: championship_scenarios
-- ============================================================

CREATE TABLE IF NOT EXISTS public.championship_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  condition_label text NOT NULL,
  outcome_color text NOT NULL,
  narrative text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT championship_scenarios_outcome_color_check CHECK (outcome_color = ANY (ARRAY['positive'::text, 'negative'::text, 'neutral'::text]))
);

CREATE INDEX IF NOT EXISTS idx_scenarios_lookup
  ON public.championship_scenarios (tournament_id, team_id, sort_order);

ALTER TABLE public.championship_scenarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scenarios_read ON public.championship_scenarios;
CREATE POLICY scenarios_read ON public.championship_scenarios
  FOR SELECT
  USING (
    tournament_id IN (
      SELECT tournaments.id FROM tournaments
      WHERE tournaments.org_id IN (
        SELECT user_roles.organization_id
        FROM user_roles
        WHERE user_roles.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS scenarios_write ON public.championship_scenarios;
CREATE POLICY scenarios_write ON public.championship_scenarios
  FOR ALL
  USING (
    tournament_id IN (
      SELECT tournaments.id FROM tournaments
      WHERE tournaments.org_id IN (
        SELECT user_roles.organization_id
        FROM user_roles
        WHERE user_roles.user_id = auth.uid()
          AND user_roles.role = ANY (ARRAY['admin'::text, 'coach'::text])
      )
    )
  );

-- ============================================================
-- SECTION 8: circuit_rules
-- ============================================================

CREATE TABLE IF NOT EXISTS public.circuit_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  circuit_name text NOT NULL,
  tiebreaker_rules text NOT NULL,
  point_differential_cap integer,
  defensive_rules text,
  other_rules jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT circuit_rules_org_id_circuit_name_key UNIQUE (org_id, circuit_name)
);

ALTER TABLE public.circuit_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS circuit_rules_read ON public.circuit_rules;
CREATE POLICY circuit_rules_read ON public.circuit_rules
  FOR SELECT
  USING (
    org_id IN (
      SELECT user_roles.organization_id
      FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS circuit_rules_write ON public.circuit_rules;
CREATE POLICY circuit_rules_write ON public.circuit_rules
  FOR ALL
  USING (
    org_id IN (
      SELECT user_roles.organization_id
      FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'::text
    )
  );

-- ============================================================
-- SECTION 9: Functions (trigger functions + helpers)
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_default_hotel_deadline()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.hotel_url IS NOT NULL AND NEW.hotel_deadline_at IS NULL THEN
    NEW.hotel_deadline_at := (NEW.start_date - INTERVAL '30 days')::timestamptz;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_message_body_edit()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF OLD.sent_at IS NOT NULL
     AND (NEW.body_html IS DISTINCT FROM OLD.body_html
          OR NEW.body_plain IS DISTINCT FROM OLD.body_plain) THEN
    RAISE EXCEPTION 'Cannot edit body of a sent message. Send a correction via replaces_message_id.';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_tournament_recipients(
  p_tournament_id uuid,
  p_team_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  guardian_id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  receive_tournament_briefings boolean
)
LANGUAGE sql
STABLE
AS $function$
  SELECT DISTINCT
    g.id AS guardian_id,
    g.first_name, g.last_name, g.email, g.phone,
    COALESCE(gnp.receive_tournament_briefings, true) AS receive_tournament_briefings
  FROM tournament_rosters tr
  JOIN player_guardians pg ON pg.player_id = tr.player_id
  JOIN guardians g ON g.id = pg.guardian_id
  LEFT JOIN guardian_notification_prefs gnp ON gnp.guardian_id = g.id
  WHERE tr.tournament_id = p_tournament_id
    AND tr.roster_status IN ('active','futures_callup')
    AND (p_team_id IS NULL OR tr.team_id = p_team_id)
    AND g.email IS NOT NULL;
$function$;

CREATE OR REPLACE FUNCTION public.get_tournament_rsvp_summary(
  p_tournament_id uuid,
  p_team_id uuid
)
RETURNS TABLE(
  player_id uuid,
  first_name text,
  last_name text,
  roster_status text,
  rsvp_status text
)
LANGUAGE sql
STABLE
AS $function$
  WITH tournament_events AS (
    SELECT id FROM events WHERE tournament_id = p_tournament_id AND team_id = p_team_id
  ),
  player_responses AS (
    SELECT
      tr.player_id,
      p.first_name,
      p.last_name,
      tr.roster_status,
      COUNT(DISTINCT CASE WHEN er.response = 'going' THEN er.event_id END) AS going_count,
      COUNT(DISTINCT CASE WHEN er.response = 'not_going' THEN er.event_id END) AS not_going_count,
      COUNT(DISTINCT CASE WHEN er.response = 'maybe' THEN er.event_id END) AS maybe_count,
      COUNT(DISTINCT er.event_id) AS any_response_count,
      (SELECT COUNT(*) FROM tournament_events) AS total_events
    FROM tournament_rosters tr
    JOIN players p ON p.id = tr.player_id
    LEFT JOIN event_rsvps er
      ON er.player_id = tr.player_id
      AND er.event_id IN (SELECT id FROM tournament_events)
    WHERE tr.tournament_id = p_tournament_id
      AND tr.team_id = p_team_id
    GROUP BY tr.player_id, p.first_name, p.last_name, tr.roster_status
  )
  SELECT
    pr.player_id, pr.first_name, pr.last_name, pr.roster_status,
    CASE
      WHEN pr.going_count > 0 THEN 'going'
      WHEN pr.not_going_count = pr.total_events AND pr.total_events > 0 THEN 'not_going'
      WHEN pr.maybe_count > 0 THEN 'maybe'
      WHEN pr.any_response_count = 0 THEN 'no_response'
      ELSE 'partial'
    END AS rsvp_status
  FROM player_responses pr
  ORDER BY pr.first_name;
$function$;

-- ============================================================
-- SECTION 10: Triggers
-- ============================================================

DROP TRIGGER IF EXISTS trg_hotel_deadline ON public.tournaments;
CREATE TRIGGER trg_hotel_deadline
  BEFORE INSERT OR UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.set_default_hotel_deadline();

DROP TRIGGER IF EXISTS trg_messages_immutable ON public.tournament_messages;
CREATE TRIGGER trg_messages_immutable
  BEFORE UPDATE ON public.tournament_messages
  FOR EACH ROW EXECUTE FUNCTION public.prevent_message_body_edit();

-- ============================================================
-- SECTION 11: Seed data for circuit_rules (Legacy Hoopers only)
-- ============================================================

INSERT INTO public.circuit_rules (org_id, circuit_name, tiebreaker_rules, point_differential_cap, defensive_rules, other_rules)
VALUES (
  'e3e95e21-3571-4e9a-985a-d5d01480d4a6'::uuid,
  'AAU Zero Gravity',
  'Two teams tied? The team that won head-to-head advances. Three teams tied? Point differential decides it. Max PD from any single game is capped at +20.',
  20,
  'Man-to-man only in the first half. Man-to-man press allowed in the second half. No zone defense. No restrictions in the final 2 minutes.',
  NULL
)
ON CONFLICT (org_id, circuit_name) DO NOTHING;

INSERT INTO public.circuit_rules (org_id, circuit_name, tiebreaker_rules, point_differential_cap, defensive_rules, other_rules)
VALUES (
  'e3e95e21-3571-4e9a-985a-d5d01480d4a6'::uuid,
  'League Play',
  'League standings determined by win percentage. Head-to-head is the primary tiebreaker, followed by point differential against tied opponents.',
  NULL,
  'Zone defense permitted. Standard FIBA rules apply. Each team allowed 4 timeouts per game.',
  NULL
)
ON CONFLICT (org_id, circuit_name) DO NOTHING;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================
-- Verification: if re-applied to a fresh DB, all tables, policies,
-- triggers, and functions above should exist. Idempotent patterns
-- (IF NOT EXISTS, DROP ... IF EXISTS before CREATE) mean re-running
-- against an already-populated DB is safe and has no effect.
-- ============================================================
