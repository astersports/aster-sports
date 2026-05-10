// Wave 4.2-A-8d (P0 hotfix) — wizard-state-to-digest-args translator.
//
// BriefingComposer wizard exposes weekly_digest as a kind option (via
// TEAM_BRIEFING_KINDS on TeamDetailPage). The wizard state shape
// doesn't match sendWeeklyDigest's signature (no period, no events,
// no tournaments, etc.). This helper translates the wizard state +
// React-side fetched data into sendWeeklyDigest's expected args, then
// short-circuits the dispatch so we never hit the composerSubmit
// wrong-call-site guard.
//
// The helper is pure (no IO except delegating to sendWeeklyDigest)
// so vitest can cover the state mapping logic without rendering the
// wizard.
//
// composerSubmit's dispatch guard for `weekly_digest` stays intact —
// it remains the defensive backstop if this short-circuit ever
// regresses.

import { sendWeeklyDigest } from '../digestSend';

function filterSendable(recipients, eventsByTeam) {
  return (recipients || []).map((r) => {
    const seen = new Set();
    const evs = [];
    for (const tid of r.team_ids || []) {
      for (const ev of eventsByTeam.get(tid) || []) {
        if (!seen.has(ev.id)) { seen.add(ev.id); evs.push(ev); }
      }
    }
    return { ...r, events: evs };
  }).filter((f) => f.events.length > 0);
}

function buildEventsByTeam(events) {
  const m = new Map();
  for (const ev of events || []) {
    const arr = m.get(ev.team_id) || [];
    arr.push(ev); m.set(ev.team_id, arr);
  }
  return m;
}

export function mapWizardStateToDigestArgs({ state, orgId, period, recipients, events, tournaments, teams, coaches, rsvpCountsByEvent }) {
  if (!state) throw new Error('mapWizardStateToDigestArgs: missing state');
  if (state.kind !== 'weekly_digest') {
    throw new Error(`mapWizardStateToDigestArgs: expected kind=weekly_digest, got ${state.kind}`);
  }
  const sendable = filterSendable(recipients, buildEventsByTeam(events));
  return {
    orgId, period,
    bodyNotes: state.body?.body_notes || '',
    signoffMessage: state.signoff_message || '',
    opsNotes: state.body?.ops_notes || '',
    recipients: sendable, events, tournaments, teams, coaches,
    rsvpCountsByEvent,
    testOnly: !!state.test_only,
  };
}

export async function sendWeeklyDigestFromWizard(args) {
  const digestArgs = mapWizardStateToDigestArgs(args);
  return sendWeeklyDigest(digestArgs);
}
