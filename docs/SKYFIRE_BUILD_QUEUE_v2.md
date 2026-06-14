# SKYFIRE BUILD QUEUE v2 — Financials redesign (elite suite)
Per FINANCIALS_REDESIGN_MASTER_SPEC_v2.md §7. One entry per applied migration / shipped PR:
UTC date, files+LOC, version/SHA, verification evidence, next unlock.

---

2026-06-13 · Migration A 20260613203959_financials_invoices_settlement applied via Supabase MCP
  Spine: invoices table, financial_transactions.invoice_id, next_invoice_number(), pay_coach() RPC,
  comment-deprecate coaching_assignments.rates + registration_fees. Post-flight clean (CC verified
  live: invoices/invoice_id/pay_coach/next_invoice_number all present).

2026-06-13 · Migration B 20260613204237_financials_elite_layer applied via Supabase MCP
  Elite: organizations.legal_name + ein; payment_plans + payment_plan_installments; discounts +
  financial_transactions.discount_id; invoice_reminder_log; ar_aging view. Applied admin-only on
  discounts (org_members read policy from the spec text dropped at apply time — never shipped).
  Post-flight clean. Left as-applied; corrected forward by C (DR-F2 leave-history-forward).

2026-06-13 · Migration C 20260613210010_financials_b_corrections applied via Supabase MCP
  Forward correction of B (not a rewrite; B left as-applied).
  B-2: ar_aging ages never-paid debt from financial_accounts.created_at, not now().
       Verified: never-paid $70 account (created 06-12) -> d0_30 correctly; Jon -> d60_plus.
  B-3: invoices/pp/ppi parent-read policies conformed to (SELECT auth.uid()); 0 bare remain.
  P1-1: uq_fin_tx_reverses partial unique index (double-void guard); 0 reversing rows, no dupes.
  P1-7: fin_tx_no_mutate BEFORE UPDATE/DELETE trigger; behaviorally proven to block a real UPDATE.
  Post-flight clean. Mirror committed same turn. Rulings: DR-F8 refined, DR-F13 new.
  Next unlock: PR-1 (unify coach owed across 3 hooks).

2026-06-13 · PR-1 — unify coach owed/paid across the 3 hooks (canonical, DR-F1)
  New src/lib/coachComp.js (26): sumOwedCents / sumPaidCents / countOwedSessions — ONE
  definition all three hooks call. owed = Σ event_coach_assignments.pay_cents WHERE
  pay_status='owed'; paid = Σ coach_payouts.amount_cents WHERE status='paid'. Both
  org-scoped; NEVER netted (removed every balance = owed − paid → the −$680 artifact).
  Hooks: useCoachComp (40, sessions+payouts, season filter dropped → org), useCoachDetail
  (53, owed via helper, season filter dropped, balanceCents removed), useCoachPayouts (70,
  rate×count owed REPLACED with Σ owed pay_cents, season param dropped, balance removed).
  Consumers: CoachCompCard (formatCurrency not whole-dollar round [audit A6]; "paid" not
  "this season" [A2]; owedSessions), CoachPayoutCard + CoachPayoutsSection + FinancialCoach
  DetailPage (Balance stat → Owed now / Sessions / Paid). Tests: coachComp.test.js
  (cross-surface invariant, AP#43) + updated CoachCompCard + financialsCards.
  Verified live: Kenny owed $12,240 / paid $2,820 (102 sess); Darien owed $2,100 / paid
  $2,780 (35 sess); 0 negative. Also lands A/B migration mirrors (parity).
  Next unlock: PR-2 (PayCoachSheet + pay_coach() wiring).

2026-06-13 · Migration D 20260613213906_pay_coach_paid_only_guard applied via Supabase MCP
  pay_coach() now RAISEs if p_status <> 'paid' (guard after the auth check, before any write).
  Closes the inconsistency where a non-paid payout would flip sessions out of owed
  (session pay_status has no intermediate state). Paid path unchanged; signature unchanged;
  EXECUTE grant to authenticated intact. Post-flight clean. Mirror committed same turn.
  CC pre-flight (live): guard present, signature unchanged, authenticated EXECUTE intact; all
  owed sessions (Kenny 102, Darien 35) map to ONE season (Spring 2026) → one pay_coach call
  per coach today. PR-2 contract ready.

2026-06-13 · Migration E 20260613221111_reconcile_coach_payout_source_assignments applied via Supabase MCP
  Seed fixture correction. Honored Darien's PAID $1,680 payout (28 sessions x $60, exact) by
  flipping those 28 owed->paid and linking settled_by_payout_id; cleared source_assignments on
  his PENDING $540 payout (a non-paid payout must not claim sessions under Migration D).
  Invariant restored: every session referenced by a PAID payout is itself paid, so pay_coach
  can never re-settle it. Paid totals unchanged ($2,780). Darien owed 35/$2,100 -> 7/$420.
  Org owed 137/$14,340 -> 109/$12,660 (delta exactly the 28 Darien sessions). Kenny untouched
  (102/$12,240). Post-flight clean. Idempotent. Mirror committed same turn (sourced from the
  registered schema_migrations.statements — body not re-attached; byte-faithful to applied SQL).

2026-06-13 · PR-2 — PayCoachSheet + pay_coach() wiring (settlement, DR-F1)
  New src/components/admin/PayCoachSheet.jsx (108, FullScreenForm/AP#15): select a coach's
  OWED sessions (default all, select-all) → settle bar sums Σ selected pay_cents → "Pay $X"
  calls pay_coach() once per season with status='paid'. Pessimistic (money out) + double-submit
  ref guard; §16.3 error microcopy on failure; refetch on success. New lib helper
  buildSettlements (coachComp.js 42) groups selected sessions by season into pay_coach payloads
  (pure, tested). useCoachDetail (55) now stamps seasonId per session. FinancialCoachDetailPage
  (117) gets a "Pay coach · $X owed" button (shown when owed>0) opening the sheet.
  Tests: coachComp.test.js extended (buildSettlements: one-season/two-season grouping, always
  status='paid', amount=Σ, empty→[]). Live data shape verified: Darien 7 owed all Spring 2026
  → one call, $420. Did NOT run pay_coach live (settles out-of-band + can't auth admin via MCP);
  architect verifies Darien end-to-end post-merge. Next unlock: PR-3 (prior-payouts split).

2026-06-13 · POST-CLOSE-OUT AUDIT (11-agent bug audit of the post-A-E + PR-1/PR-2 state)
  Auto-fix batches (Frank-directed "auto execute"):
  #1059 settlement-edit desync cluster — paid sessions read-only (page guard + CoachSession
    Sheet); CoachPayoutEditSheet locks amount/status for source-bearing payouts, error-checks
    un-settle + confirms impact; PayCoachSheet multi-season partial-failure no-strand; F1
    (seasonId from events.season_id), F2 (Select-all 44px); savingRef double-submit guards.
  Migration 20260613233000_financial_function_grants_and_fk_indexes (applied + mirrored):
    REVOKE pay_coach + next_invoice_number FROM PUBLIC/anon (AP#23/#57); next_invoice_number
    admin auth check added (was anon-callable cross-tenant leak); 6 FK covering indexes.
  #1060 family-side: doVoid fail-loud (no report-success-on-failure) + voidingRef guard;
    useFamilyLedger error state (load failure no longer masquerades as "Family not found").
  DEFERRED TO ARCHITECT (exact SQL in docs/FINANCIALS_AUDIT2_FIX_DISPOSITION_2026-06-13.txt,
    both latent today): pay_coach TOCTOU+blind-amount rewrite (their money RPC); DR-F13
    confidentiality RLS / PR-6b (needs column-separation pre-flight — blind REVOKE blanks
    admin rate reads + parent footer). STILL OPEN prior-mapped: overdue NULL-last-payment +
    lane-vs-alert; RecordPaymentForm fee capture.

2026-06-14 · PR-3 — prior-payouts split on the coach ledger (DR-F2)
  Executed per Frank's direct request, built to the canonical close-out §6 shape
  (discriminator: source_assignments IS NULL = prior). Follow-ups 5a (seasonId from
  events.season_id) + 5b (Select-all 44px) were ALREADY shipped in audit batch #1059,
  so PR-3 = the split only. New src/components/admin/CoachPayoutList.jsx (60): splits
  the coach-detail Payouts section into "Settled · $X" (source_assignments populated,
  shows session count) vs "Prior payouts · $X — before settlement tracking"
  (source_assignments NULL). FinancialCoachDetailPage 120→107 (payout list extracted).
  Test: coachPayoutList.test.jsx (split discriminator + paid subtotals + session-count
  caption + empty). Live shape: Darien Settled $1,800 (28+2 sess) / Prior $1,100; Kenny
  Prior $2,820. Tappable rows → CoachPayoutEditSheet (settled-locked per the audit).
