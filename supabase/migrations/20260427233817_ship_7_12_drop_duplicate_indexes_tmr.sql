-- Ship 7.12: Drop 2 duplicate indexes on tournament_message_recipients
-- Source: Supabase performance advisor lint 0009_duplicate_index
-- Pre-state: 2 duplicate_index WARN lints
-- Post-state: 0
--
-- Pair 1: idx_message_recipients_guardian == idx_tmr_guardian_opened
--   Both are: btree (guardian_id, opened_at) on tournament_message_recipients
--   Drop: idx_message_recipients_guardian (older legacy name)
--   Keep: idx_tmr_guardian_opened (matches tmr_* naming convention)
--
-- Pair 2: idx_message_recipients_msg == idx_tmr_message_id
--   Both are: btree (message_id) on tournament_message_recipients
--   Drop: idx_message_recipients_msg (older legacy name)
--   Keep: idx_tmr_message_id (matches tmr_* naming convention)
--
-- Both indexes in each pair are flagged unused by the unused_index advisor (no production
-- queries hit either yet), so dropping the duplicates carries no read-path risk and reclaims
-- 16 KB plus eliminates redundant write amplification on every INSERT/UPDATE to the table.

DROP INDEX IF EXISTS public.idx_message_recipients_guardian;
DROP INDEX IF EXISTS public.idx_message_recipients_msg;
