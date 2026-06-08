-- Migration: 20260608013307_parent_moat_archived_select_backstop
-- Applied via Supabase MCP apply_migration on 2026-06-08 (design lane). Verbatim
-- mirror of the registered migration; do not edit.
-- F-PARENT-MOAT-LEAK backstop: archived briefings must never be parent-visible.
-- Recursion-safe: comms_messages_read references current_user_recipient_message_ids()
-- which reads comms_message_recipients, so a plain EXISTS subquery from this policy
-- into comms_messages would loop. SECURITY DEFINER bypasses comms_messages RLS.
-- Defense-in-depth: this is the RLS backstop; the useInboxList status filter +
-- useParentNeedsYou + the AP#43 cross-surface test ship as the PR MOAT code half.

CREATE OR REPLACE FUNCTION message_is_not_archived(p_message_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM comms_messages m
    WHERE m.id = p_message_id AND m.status <> 'archived'
  );
$$;
REVOKE ALL ON FUNCTION message_is_not_archived(uuid) FROM public;
GRANT EXECUTE ON FUNCTION message_is_not_archived(uuid) TO authenticated;

DROP POLICY IF EXISTS parent_select_own_recipients ON comms_message_recipients;
CREATE POLICY parent_select_own_recipients ON comms_message_recipients
FOR SELECT USING (
  guardian_id IN (
    SELECT guardians.id FROM guardians WHERE guardians.user_id = (SELECT auth.uid())
  )
  AND message_is_not_archived(message_id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'message_is_not_archived') THEN
    RAISE EXCEPTION 'post-condition failed: helper message_is_not_archived missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid
    WHERE c.relname = 'comms_message_recipients'
      AND p.polname = 'parent_select_own_recipients'
      AND pg_get_expr(p.polqual, p.polrelid) LIKE '%message_is_not_archived%'
  ) THEN
    RAISE EXCEPTION 'post-condition failed: parent_select_own_recipients not tightened';
  END IF;
END $$;
