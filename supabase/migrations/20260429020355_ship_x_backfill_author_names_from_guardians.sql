-- Mirror file backfilled 2026-05-28 from supabase_migrations.schema_migrations.statements per Wave 2.A audit #23 P0-1.
-- Original SQL applied via chat-side claude.ai MCP without same-turn mirror; this file restores the AP #21 mirror invariant.

-- Ship X data backfill: replace email-shaped author values with proper guardian display names.
-- Companion to code fix in src/hooks/useDuties.js + src/hooks/useComments.js (commit pending).
--
-- Pattern: when guardian_id is set and current author field contains '@', replace with
-- guardians.first_name || ' ' || last_name. Idempotent — re-runs are no-ops once values are clean.
--
-- event_comments: defensive update; current production has 0 polluted rows but the same write-side
-- bug pattern exists in useComments.js, so backfill rule is in place ahead of any future writes.

UPDATE event_duties d
SET claimed_by_name = g.first_name || ' ' || g.last_name
FROM guardians g
WHERE d.guardian_id = g.id
  AND d.guardian_id IS NOT NULL
  AND (d.claimed_by_name IS NULL OR d.claimed_by_name = '' OR d.claimed_by_name LIKE '%@%');

UPDATE event_comments c
SET author_name = g.first_name || ' ' || g.last_name
FROM guardians g
WHERE c.author_guardian_id = g.id
  AND c.author_guardian_id IS NOT NULL
  AND (c.author_name IS NULL OR c.author_name = '' OR c.author_name LIKE '%@%');
