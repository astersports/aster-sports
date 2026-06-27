-- §2.A ratified: structure division identity (gender/grade/tier/day) from the name.
-- No-fabrication: keep `name` untouched; fill only deterministic high-confidence parses;
-- never touch Family D League headers (ADMIN TEAMS / *DIVISIONS); no numeric grade for
-- High School / Varsity. Adds tier + day (ratified); gender/grade_label/min/max exist.
-- Result: 302/305 gender+grade filled; 3 Family-D skipped; 34 HS/Varsity no numeric grade.
-- Applied to prod via MCP 2026-06-27 (owner-authorized, architect-ratified); mirror per AP #21.

alter table public.tournament_divisions
  add column if not exists tier text,
  add column if not exists day  text;

-- gender M/F — skip Family D; only when EXACTLY one of boys/girls appears
update public.tournament_divisions d
set gender = case when d.name ~* '\mgirls\M' then 'F' else 'M' end
where d.gender is null
  and d.name !~* 'DIVISIONS|ADMIN TEAMS'
  and ((d.name ~* '\mboys\M') <> (d.name ~* '\mgirls\M'));

-- day (Family A only: [Sat] / [Sunday])
update public.tournament_divisions d
set day = case lower((regexp_match(d.name, '^\[(Sat|Sunday)\]', 'i'))[1])
            when 'sat' then 'Sat' when 'sunday' then 'Sun' end
where d.day is null and d.name ~* '^\[(Sat|Sunday)\]';

-- grade_label: High School / Varsity / Var(->Varsity) / numeric (single or paired)
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

-- grade_min/max: numeric grades ONLY (deterministic); leave NULL for HS/Varsity
update public.tournament_divisions d
set grade_min = (regexp_match(d.grade_label, '^(\d{1,2})'))[1]::int,
    grade_max = coalesce((regexp_match(d.grade_label, '/(\d{1,2})'))[1],
                         (regexp_match(d.grade_label, '^(\d{1,2})'))[1])::int
where d.grade_min is null and d.grade_label ~ '^\d';

-- tier (Family A only; whitelist — never invent a tier)
update public.tournament_divisions d
set tier = (regexp_match(d.name, '\m(Black Diamond|Blue Chip|Rising Stars|Ballers\d?|Hoosiers|Cager)\M', 'i'))[1]
where d.tier is null
  and d.name ~* '\m(Black Diamond|Blue Chip|Rising Stars|Ballers\d?|Hoosiers|Cager)\M';
