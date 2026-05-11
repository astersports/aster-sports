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

// Wave 4.3-K: resolve audience anchor to team_ids list. Mirrors
// recipientFilter.js's resolveAudienceTeamIds but kept inline + sync —
// audience.js dynamic-imports supabase, which we don't want in this hot
// path. weekly_digest only supports synchronous audience types
// (org_all/team/multi_team); event_attendees + tournament_attendees aren't
// composer kinds for weekly_digest so they don't appear here.
function resolveWeeklyDigestAudienceTeamIds({ audienceType, audienceFilter, anchorId }) {
  if (!audienceType || audienceType === 'org_all') return null;
  if (audienceType === 'team') {
    const id = audienceFilter?.team_id || anchorId;
    return id ? [id] : [];
  }
  if (audienceType === 'multi_team') {
    const ids = audienceFilter?.team_ids;
    if (Array.isArray(ids) && ids.length) return ids.filter(Boolean);
    return anchorId ? [anchorId] : [];
  }
  return null;
}

function filterSendable(recipients, eventsByTeam, audienceTeamIds = null, pilotTestScopeTeamId = null) {
  const audienceSet = Array.isArray(audienceTeamIds) && audienceTeamIds.length ? new Set(audienceTeamIds) : null;
  return (recipients || [])
    // Wave 4.3-K Item 3: pilot test scope picker. Synthetic rows have
    // guardian_id=null and team_ids=[single team]; the wizard picker
    // narrows the test send to just the selected team. Real guardians
    // are untouched by this filter.
    .filter((r) => {
      if (!pilotTestScopeTeamId) return true;
      if (r.guardian_id != null) return true; // never filter real guardians
      return (r.team_ids || []).includes(pilotTestScopeTeamId);
    })
    .map((r) => {
      const seen = new Set();
      const evs = [];
      for (const tid of r.team_ids || []) {
        // Wave 4.3-K Item 2: audience anchor enforcement. When the message
        // is anchored to specific team(s), skip events for teams outside
        // the anchor — even if the recipient's team_ids array includes them.
        if (audienceSet && !audienceSet.has(tid)) continue;
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
  const audienceTeamIds = resolveWeeklyDigestAudienceTeamIds({
    audienceType: state.audience_type,
    audienceFilter: state.audience_filter,
    anchorId: state.anchor_id,
  });
  const sendable = filterSendable(recipients, buildEventsByTeam(events), audienceTeamIds, state.pilot_test_scope_team_id || null);
  return {
    orgId, period,
    bodyNotes: state.body?.body_notes || '',
    signoffMessage: state.signoff_message || '',
    opsNotes: state.body?.ops_notes || '',
    recipients: sendable, events, tournaments, teams, coaches,
    rsvpCountsByEvent,
    testOnly: !!state.test_only,
    audienceTeamIds,
    // Wave 4.4-C2: forward audience metadata + anchor so digestSend can
    // persist them on the comms_messages row (matches the wizard-flow
    // pattern composerSubmit.js already uses for the 6 other kinds).
    audienceType: state.audience_type || null,
    audienceFilter: state.audience_filter || null,
    anchorKind: state.anchor_kind || null,
    anchorId: state.anchor_id || null,
  };
}

export const __test = { resolveWeeklyDigestAudienceTeamIds, filterSendable, buildEventsByTeam };

export async function sendWeeklyDigestFromWizard(args) {
  const digestArgs = mapWizardStateToDigestArgs(args);
  return sendWeeklyDigest(digestArgs);
}
