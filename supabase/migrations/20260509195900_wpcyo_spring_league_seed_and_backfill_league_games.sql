-- Wave 3.16.1 §2.3 + §2.4: seed WPCYO Spring League 2026 + parent the
-- 16 league games for 10U Blue + 9U Boys.
--
-- §2.2 (ZG NY State link) DROPPED from scope per Frank: the link
-- was illustrative for the spec, not a real tournament Legacy
-- Hoopers attends. Both Girls Nationals - ZG and Boys Nationals - ZG
-- stay tourney_url=NULL.
--
-- Schema discovery surface: tournaments.status CHECK accepts
-- {planned, scheduled, in_progress, eliminated, champions,
-- complete, cancelled}. Spec said 'confirmed' which doesn't exist.
-- Picking 'in_progress' since today (May 9) is mid-league window.
-- Frank's auto-approve covers this best-fit pick.
--
-- Atomic: any failure rolls the whole migration back.

WITH new_tournament AS (
  INSERT INTO tournaments (
    org_id, name, circuit, start_date, end_date,
    tourney_url, status, schedule_status
  ) VALUES (
    'e3e95e21-3571-4e9a-985a-d5d01480d4a6',
    'WPCYO Spring League 2026',
    'League Play',
    '2026-03-01',
    '2026-06-30',
    'https://setourney.app.link/0zodCbVw02b',
    'in_progress',
    'final'
  )
  RETURNING id
),
team_links AS (
  INSERT INTO tournament_teams (
    tournament_id, team_id, final_record_wins, final_record_losses
  )
  SELECT nt.id, t.team_id, 0, 0
  FROM new_tournament nt
  CROSS JOIN (VALUES
    ('13abc98d-5e88-4fe0-8929-690add6e2bdd'::uuid),
    ('0366db32-e9ae-454b-a43c-504bb150c77f'::uuid)
  ) AS t(team_id)
  RETURNING tournament_id
),
backfilled AS (
  UPDATE events
  SET tournament_id = (SELECT id FROM new_tournament)
  WHERE team_id IN (
    '13abc98d-5e88-4fe0-8929-690add6e2bdd',
    '0366db32-e9ae-454b-a43c-504bb150c77f'
  )
    AND event_type = 'game'
    AND start_at::date BETWEEN '2026-03-01' AND '2026-06-30'
    AND tournament_id IS NULL
  RETURNING id
)
SELECT
  (SELECT id FROM new_tournament) AS wpcyo_id,
  (SELECT count(*) FROM team_links) AS team_links_inserted,
  (SELECT count(*) FROM backfilled) AS games_backfilled;
