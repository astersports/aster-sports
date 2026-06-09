-- FORK-DELETE (S4): stop a program delete from cascade-nuking the financial ledger.
-- Ratified FK-RESTRICT form (architect 2026-06-08). Blast radius if unguarded:
-- program delete CASCADEs program -> financial_accounts -> financial_transactions
-- across all 3 programs holding accounts = 164 accts / 244 txns / $165,635.47
-- (incl. the live Spring 2026 season). After this, a program holding
-- financial_accounts cannot be deleted (archive instead).
-- financial_accounts.org_id -> organizations CASCADE is intentionally left as-is.
-- Applied via MCP 2026-06-09 (mirror per AP#21). Spec: docs/PROGRAMS_TIER1_FORK_SPECS_2026-06-08.txt
ALTER TABLE financial_accounts DROP CONSTRAINT financial_accounts_season_id_fkey;
ALTER TABLE financial_accounts ADD CONSTRAINT financial_accounts_season_id_fkey
  FOREIGN KEY (season_id) REFERENCES programs(id) ON DELETE RESTRICT;

DO $$
BEGIN
  IF (SELECT confdeltype FROM pg_constraint
        WHERE conname = 'financial_accounts_season_id_fkey') <> 'r' THEN
    RAISE EXCEPTION 'verify failed: FK not ON DELETE RESTRICT';
  END IF;
END $$;
