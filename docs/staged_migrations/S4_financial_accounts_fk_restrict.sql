-- STAGED — NOT APPLIED. S4 / FORK-DELETE (stop program-delete cascade-nuking the ledger).
-- Ratified FK-RESTRICT form by the architect 2026-06-08 (declarative, chosen over
-- a BEFORE DELETE trigger). Blast radius if unguarded (live): program delete
-- CASCADEs program -> financial_accounts -> financial_transactions across all 3
-- programs holding accounts = 164 accts / 244 txns / $165,635.47 (incl. the live
-- Spring 2026 season). Current FK is ON DELETE CASCADE (confdeltype='c').
-- After this change a program holding financial_accounts cannot be deleted
-- (archive instead) — the intended posture for financial history.
-- LEAVE financial_accounts.org_id -> organizations ON DELETE CASCADE as-is: an
-- org-level delete legitimately cascades the whole financial graph.

ALTER TABLE financial_accounts DROP CONSTRAINT financial_accounts_season_id_fkey;
ALTER TABLE financial_accounts ADD CONSTRAINT financial_accounts_season_id_fkey
  FOREIGN KEY (season_id) REFERENCES programs(id) ON DELETE RESTRICT;

DO $$
BEGIN
  IF (SELECT confdeltype FROM pg_constraint
        WHERE conname='financial_accounts_season_id_fkey') <> 'r' THEN
    RAISE EXCEPTION 'verify failed: FK not ON DELETE RESTRICT';
  END IF;
END $$;

-- COMPANION (separate build PR — NOT this migration): extend
-- useProgramAdmin.deleteProgram's pre-check to count financial_accounts (and
-- coach_payouts) and return the kind "archive instead" message BEFORE attempting
-- the delete (count-and-block, matching the existing registrations pattern); fix
-- programDelete.js's stale "cascade clean" comment that caused the R-2 false closeout.
