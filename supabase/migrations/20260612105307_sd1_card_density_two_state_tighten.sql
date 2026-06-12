-- SD-1 (SCHEDULE_L99_BUILD_SPEC §3, PR-A'): density collapses to the ONE
-- home-level card_density control (§16.2, 2-state). Sweep the dead
-- 'schedule-list' section key and legacy 'medium' values from live rows,
-- then tighten the CHECK so the retired 'medium' state can never be
-- written again. App-side: useDensity already rejects 'medium'; the
-- schedule surface now reads sectionKey 'default'.
-- (AP #21 mirror of MCP apply_migration 20260612105307. Sweep verified:
-- 5 'medium' rows + 3 'schedule-list' rows -> 0/0.)

UPDATE user_preferences
SET card_density = card_density - 'schedule-list'
WHERE card_density ? 'schedule-list';

-- Drop any key whose value is the retired 'medium' (falls back to the
-- 2-state default resolution in useDensity).
UPDATE user_preferences
SET card_density = COALESCE(
  (SELECT jsonb_object_agg(k, v) FROM jsonb_each(card_density) AS e(k, v) WHERE v <> '"medium"'::jsonb),
  '{}'::jsonb)
WHERE jsonb_path_exists(card_density, '$.*?(@ == "medium")');

ALTER TABLE user_preferences DROP CONSTRAINT user_preferences_card_density_valid;
ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_card_density_valid
  CHECK (jsonb_typeof(card_density) = 'object'
         AND NOT jsonb_path_exists(card_density, '$.*?(@ != "minimal" && @ != "maximum")'));
