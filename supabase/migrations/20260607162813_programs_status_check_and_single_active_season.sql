-- Programs L99 registry build (ratified 2026-06-07).
-- Q4: formalize the three-value status set now that `draft` ships with the
-- registry. programs.status was free TEXT (only active/archived in use), so this
-- closes the float-free-enum at the cheapest moment.
ALTER TABLE public.programs
  ADD CONSTRAINT programs_status_check CHECK (status IN ('active','draft','archived'));

-- Fork 3 durable backstop: single-active is app-only (useSeasons setActive is a
-- two-statement, non-atomic write). Enforce "at most one active SEASON per org"
-- at the DB so the unified activate() (or any future caller) can't violate it
-- across the non-atomic window. season is the only singleActive program type;
-- camps/clinics/etc. can be many-active, so the index is scoped to season.
CREATE UNIQUE INDEX programs_one_active_season_per_org
  ON public.programs (org_id)
  WHERE status = 'active' AND program_type = 'season';
