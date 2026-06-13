# FINANCIALS SPEC v2 — RULING ADDENDUM (2026-06-13)
Appends to FINANCIALS_REDESIGN_MASTER_SPEC_v2.md after Migrations A, B, C applied.
All claims below verified live against vrwwpsbfbnveawqwbdmj this session.

================================================================================
MIGRATIONS APPLIED (production, verified)
================================================================================
A  20260613203959  financials_invoices_settlement   (spine)        post-flight clean
B  20260613204237  financials_elite_layer           (elite)        post-flight clean
C  20260613210010  financials_b_corrections         (corrections)  post-flight clean
Mirror files for all three are in supabase/migrations/. B is left as-applied; C
corrects it forward (leave-history-forward, DR-F2).

================================================================================
DR-F8 REFINED — discounts stay admin-only; label denormalized into notes
================================================================================
financial_transactions has a `notes` column. Applying a discount writes an
adjustment(+) credit whose human label goes in `notes` (e.g. "Sibling credit").
The parent/coach ledger renders the label from the transaction row, never by
joining `discounts`. Therefore:
  - `discounts` is admin-only (RLS: discounts_admin FOR ALL). Confirmed live: the
    only policy on the table.
  - Parents/coaches never get catalog read. This is tighter than a broad member
    read: it does not expose other families' scholarship award amounts.
  - The same `notes` column carries the required reason on adjustments and refunds
    (DR-F12). There is no `description` column; do not reference one.
Build impact: PR-14 (apply discount) and PR-6 (adjustment/refund) both write the
human string into financial_transactions.notes. PR-7/PR-11 (parent ledger,
statement) read the label/reason from notes.

================================================================================
DR-F13 NEW — pay confidentiality
================================================================================
Coach rate and coach pay are readable only by admins and the owning coach.
  - Parents: never read coach rate or pay (any of coaching_assignments.
    pay_per_session_cents, event_coach_assignments.pay_cents/pay_status,
    coach_payouts).
  - A coach reads only their own rows, not co-staff pay.
This addresses audit P1-2 (parent reads coach rate) and P1-3 (coach reads
co-staff pay). NOT folded into Migration C: it changes read RLS on tables that
feed live coach surfaces, so it gets its own migration with a pre-flight against
the CURRENT read policies first (inspect what coach-facing reads exist before
narrowing them, or the coach pay surface breaks). Queued as a verified RLS PR.

================================================================================
SIX AUDIT SHIP-NOW FIXES — build-order map (nothing dropped)
================================================================================
P0-1  doVoid reports success on failure          -> PR-6 (verb set).
P1-1  double-void: no unique on reverses_*        -> DONE in Migration C
                                                      (uq_fin_tx_reverses, partial).
P1-7  append-only has no trigger                  -> DONE in Migration C
                                                      (fin_tx_no_mutate, behaviorally
                                                      verified to block UPDATE).
P1-8  void-pair integrity                         -> new void RPC (server reads the
                                                      original, mirrors pay_coach),
                                                      slots immediately before PR-6.
P1-2/P1-3  pay-confidentiality RLS leaks          -> DR-F13 above, its own RLS PR.
P1-4  overdue alert drops NULL last_payment_at    -> app-layer alert query; fix with
                                                      the same COALESCE(last_payment_at,
                                                      created_at) pattern Migration C
                                                      set in ar_aging. Folds into the
                                                      PR that touches the alert.

================================================================================
REVISED PR SEQUENCE HEAD (CC lane)
================================================================================
PR-1  Unify coach owed across 3 hooks (canonical owed, kills -$680 artifact).
PR-2  PayCoachSheet + pay_coach() wiring.
PR-3  Prior-payouts split on coach detail.
PR-4  Rate per assignment.
PR-5  Invoices (useInvoices, FamilyInvoicePanel, SendInvoiceSheet via Resend).
PR-5b void RPC (P1-8) — server-authoritative reversal.
PR-6  Verb set: AdjustmentSheet + IssueRefundSheet (reason -> notes), doVoid
      failure fix (P0-1), uses the void RPC from PR-5b.
PR-6b DR-F13 pay-confidentiality RLS (own pre-flight).
... then PR-7..PR-17 as in spec v2 §7, with P1-4 folded into whichever PR touches
the overdue alert (PR-16 reporting or earlier if the alert is on the dashboard).
