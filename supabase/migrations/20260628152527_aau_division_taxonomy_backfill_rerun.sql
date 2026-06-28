-- Re-run of the §2.A division-taxonomy backfill (mirror: 20260627122920). The original was a
-- one-off; tournaments ingested AFTER it ran (notably "ZERO GRAVITY Summer Slam 2026", ingested
-- 2026-06-27 14:18, after the backfill at 12:29) never got gender/grade_label populated, so their
-- divisions rendered without grade/gender labels in the hub directory and their teams' qkeys
-- degraded for cross-tournament grouping. These UPDATEs are idempotent + no-fabrication: they fill
-- ONLY null fields, skip the Family-D umbrella headers (DIVISIONS|ADMIN TEAMS), and never assign a
-- numeric grade to HS/Varsity. Re-running closes the gap deterministically with the same logic.
-- Result: Summer Slam's 12 divisions filled (11 fully; "Girls - HS" gets gender F, no numeric grade
-- by design); the 3 WPCYO umbrella/ADMIN headers stay null intentionally.
--
-- APPLIED to prod via MCP 2026-06-28 on Frank's go ("make sure all games are linked to the actual
-- teams in the browse sections"); mirror per AP #21.
--
-- FOLLOW-UP (flagged, not in this migration): taxonomy is populated by this backfill, NOT by the
-- ingest itself, so every NEW tournament ingested after a backfill falls into the same gap until
-- the next re-run. The durable fix is to derive taxonomy inside aau-ingest-tournament (or a trigger
-- on tournament_divisions insert) — architect-scoped, deferred.

update public.tournament_divisions d
set gender = case when d.name ~* '\mgirls\M' then 'F' else 'M' end
where d.gender is null
  and d.name !~* 'DIVISIONS|ADMIN TEAMS'
  and ((d.name ~* '\mboys\M') <> (d.name ~* '\mgirls\M'));

update public.tournament_divisions d
set grade_label = g.tok
from (
  select id, coalesce(
      (regexp_match(name, '\m(High School|Varsity)\M', 'i'))[1],
      (regexp_match(name, '\m(\d{1,2}(?:st|nd|rd|th)(?:/\d{1,2}(?:st|nd|rd|th))?)\M', 'i'))[1],
      case when name ~* '\mVar\M' then 'Varsity' end
  ) as tok
  from public.tournament_divisions
  where name !~* 'DIVISIONS|ADMIN TEAMS'
) g
where d.id = g.id and d.grade_label is null and g.tok is not null;

update public.tournament_divisions d
set grade_min = (regexp_match(d.grade_label, '^(\d{1,2})'))[1]::int,
    grade_max = coalesce((regexp_match(d.grade_label, '/(\d{1,2})'))[1],
                         (regexp_match(d.grade_label, '^(\d{1,2})'))[1])::int
where d.grade_min is null and d.grade_label ~ '^\d';
