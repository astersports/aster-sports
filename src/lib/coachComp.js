// Canonical coach compensation math (PR-1, DR-F1 event-sourced settlement).
// ONE definition of owed + paid, shared by every coach surface so the three
// hooks (useCoachComp, useCoachDetail, useCoachPayouts) can never diverge again
// (the source of the old three-way "$2,100 vs $1,140 vs ..." + the -$680 netting
// artifact). owed and paid are COMPLEMENTARY, never netted/subtracted:
//   owed = Σ event_coach_assignments.pay_cents WHERE pay_status='owed'
//   paid = Σ coach_payouts.amount_cents       WHERE status='paid'
// Session-settled paid (Σ sessions pay_status='paid') is $0 until pay_coach()
// runs and is intentionally NOT the lifetime "paid" a coach sees — that's the
// coach_payouts paid total. Both are org-scoped by the caller (sessions via
// event→team→org_id; payouts via org_id).

// Σ pay_cents over owed sessions. `sessions` rows expose { pay_cents, pay_status }.
export function sumOwedCents(sessions) {
  return (sessions || []).reduce((n, s) => (s.pay_status === 'owed' ? n + (s.pay_cents || 0) : n), 0);
}

// Σ amount_cents over paid payouts. `payouts` rows expose { amount_cents, status }.
export function sumPaidCents(payouts) {
  return (payouts || []).reduce((n, p) => (p.status === 'paid' ? n + (p.amount_cents || 0) : n), 0);
}

// Count of owed (unsettled) sessions — the "N sessions, not yet paid" figure.
export function countOwedSessions(sessions) {
  return (sessions || []).reduce((n, s) => (s.pay_status === 'owed' ? n + 1 : n), 0);
}

// Group selected owed sessions by season into pay_coach() payloads (PR-2, DR-F1).
// ONE payload per season (the RPC's p_season is NOT NULL); amount = Σ pay_cents of
// that season's selected sessions; status is ALWAYS 'paid' (Migration D rejects
// anything else). Pure — the sheet calls supabase.rpc with each payload.
export function buildSettlements(sessions, { orgId, coachId, method, paidAt, notes } = {}) {
  const bySeason = {};
  for (const s of sessions || []) (bySeason[s.seasonId] ||= []).push(s);
  return Object.entries(bySeason).map(([seasonId, rows]) => ({
    p_org: orgId, p_coach: coachId, p_season: seasonId,
    p_session_ids: rows.map((r) => r.id),
    p_amount_cents: rows.reduce((n, r) => n + (r.pay_cents || 0), 0),
    p_status: 'paid', p_method: method, p_paid_at: paidAt,
    p_notes: notes || `Settled ${rows.length} session${rows.length === 1 ? '' : 's'} via app`,
  }));
}
