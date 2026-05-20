-- May 16 audit P2 item #15: briefing_templates.org_id was nullable.
-- All rows that ever land must be org-scoped (multi-tenant invariant);
-- the nullable shape was a schema-design slip. Table is empty at
-- PR-write (0 rows total, 0 NULL rows) so the constraint addition
-- is risk-free.

ALTER TABLE briefing_templates ALTER COLUMN org_id SET NOT NULL;
