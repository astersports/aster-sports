-- Migration: locations_admin_notes
-- Wave 1F — Privacy boundary for admin-only location notes
-- Adds admin_notes column for staff-only operational notes
-- (billing disputes, vendor flags, internal coordination, etc).
-- Existing notes, parking_notes, entry_instructions remain
-- parent-visible. Column-level access enforced at app layer:
-- (a) parent queries omit admin_notes from explicit column list
-- (b) LocationCard renders admin_notes block only when isStaff(role)
-- Postgres has no column-level RLS; two-layer app-side defense.

ALTER TABLE locations
  ADD COLUMN admin_notes text;

COMMENT ON COLUMN locations.admin_notes IS
  'Staff-only operational notes. Parent queries must omit this column. LocationCard renders this block only when isStaff(role).';
