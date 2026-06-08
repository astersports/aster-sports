// Wave 3.11 follow-up — reducer for BriefingComposer composer state.
// Pure module, no React. Easy to unit-test.
//
// The composer is ONE screen — no step gating (see ComposerSections). The
// vestigial wizard machinery (step / GO_FORWARD / GO_BACK / JUMP_TO /
// canAdvance / step{2,3}Valid / hydrateTargetStep / STEPS) was retired in
// Part A1 (2026-06-07, AP#51); only the live actions + reconcileAnchorForKind
// remain. reconcileAnchorForKind is live (SET_KIND uses it).

import { KIND_METADATA } from '../../lib/briefings/kindMetadata';

export const ANCHOR_KINDS_REQUIRING_ID = new Set(['event', 'tournament', 'team']);

// COMPOSE-FRONT P2: stale-anchor-on-kind-switch reconcile. Mirrors
// reconcileAudienceForKind. If the carried anchor_kind isn't valid for the
// new kind, fall back to the kind's default; org/null defaults drop the id so
// a stale event/tournament/team anchor never leaks into the draft.
export function reconcileAnchorForKind(kind, candidateAnchorKind, candidateAnchorId) {
  const meta = KIND_METADATA[kind] || {};
  const anchorKind = (meta.anchorKinds || []).includes(candidateAnchorKind) ? candidateAnchorKind : (meta.defaultAnchorKind || null);
  const anchorId = ANCHOR_KINDS_REQUIRING_ID.has(anchorKind) ? (candidateAnchorId || null) : null;
  return { anchor_kind: anchorKind, anchor_id: anchorId };
}

export const INITIAL_STATE = {
  kind: null,
  kindFilter: null,         // string[]|null — when non-null, picker shows only these
  anchor_kind: null,
  anchor_id: null,
  audience_type: null,
  audience_filter: null,
  body: {},
  signoff_message: '',
  // Per-message contact-info gate (OFF by default). signoff_coaches holds the
  // staff objects chosen in the compose-time "who to include" picker.
  signoff_enabled: false,
  signoff_coaches: [],
  test_only: true,
  send_mode: 'now',          // 'now' | 'scheduled'
  scheduled_for: null,
  draft_id: null,
  preview_family_id: null,
  activeTemplateId: null,   // wave 3.16: tracks which starter template is applied
  // Wave 4.3-H: pilot_only is org-level, not draft-level. Synced from
  // useOrgSettings.pilotModeEnabled via effect in BriefingComposer; read
  // by RESOLVER_REGISTRY.anchorFromState to scope preview recipients.
  pilot_only: false,
  // Wave 4.3-K Item 3: pilot test scope picker. When non-null, narrows
  // the per-team synthetic test recipients to a single team's row so the
  // admin@ inbox only gets one email instead of N. UI surface in
  // BriefingComposer gates on org.pilot_test_recipient_email !== null.
  pilot_test_scope_team_id: null,
};

export function composerReducer(state, action) {
  switch (action.type) {
    case 'SET_KIND': {
      // audience_filter: honored when the action carries the key at all
      // (entry-point #2 reconciliation passes null to DROP a now-invalid
      // team pre-fill). Absent key → preserve existing filter via spread.
      // COMPOSE-FRONT P2: reconcile the carried anchor against the new kind
      // so a stale event/tournament anchor_id doesn't persist when switching
      // to an org/null-anchored kind.
      const anchor = reconcileAnchorForKind(action.kind, action.anchor_kind || state.anchor_kind, action.anchor_id || state.anchor_id);
      return {
        ...state,
        kind: action.kind,
        body: action.defaultBody || {},
        anchor_kind: anchor.anchor_kind,
        anchor_id: anchor.anchor_id,
        audience_type: action.audience_type || state.audience_type,
        audience_filter: 'audience_filter' in action ? (action.audience_filter ?? null) : state.audience_filter,
      };
    }
    case 'SET_ANCHOR':
      return { ...state, anchor_kind: action.anchor_kind, anchor_id: action.anchor_id };
    case 'CLEAR_ANCHOR':
      return { ...state, anchor_kind: null, anchor_id: null };
    case 'SET_KIND_FILTER':
      return { ...state, kindFilter: action.payload || null };
    case 'SET_ACTIVE_TEMPLATE':
      return { ...state, activeTemplateId: action.payload?.templateId ?? null };
    case 'SET_SCHEDULE':
      // Wave 3.17: schedule mode + ISO timestamp. mode=='send_now' clears
      // scheduledFor so submit path stays consistent.
      return { ...state, send_mode: action.payload?.mode === 'schedule_for_later' ? 'scheduled' : 'now', scheduled_for: action.payload?.mode === 'schedule_for_later' ? (action.payload?.scheduledFor || null) : null };
    case 'SET_AUDIENCE':
      return { ...state, audience_type: action.audience_type, audience_filter: action.audience_filter ?? null };
    case 'UPDATE_BODY':
      return { ...state, body: { ...state.body, ...action.patch } };
    case 'UPDATE_SIGNOFF':
      return { ...state, signoff_message: action.value };
    case 'TOGGLE_SIGNOFF':
      return { ...state, signoff_enabled: action.value === true };
    case 'SET_SIGNOFF_COACHES':
      return { ...state, signoff_coaches: Array.isArray(action.value) ? action.value : [] };
    case 'TOGGLE_TEST':
      return { ...state, test_only: action.value };
    case 'SET_SEND_MODE':
      return { ...state, send_mode: action.mode };
    case 'SET_SCHEDULED':
      return { ...state, scheduled_for: action.value, send_mode: 'scheduled' };
    case 'SET_DRAFT_ID':
      return { ...state, draft_id: action.id };
    case 'SET_PILOT_ONLY':
      return { ...state, pilot_only: !!action.value };
    case 'SET_PILOT_TEST_SCOPE':
      return { ...state, pilot_test_scope_team_id: action.value || null };
    case 'SET_PREVIEW_FAMILY':
      return { ...state, preview_family_id: action.id };
    case 'HYDRATE_DRAFT':
      // One-screen: hydrate the draft fields; no step targeting. A broken
      // draft (e.g. anchor_id null) surfaces its missing field inline.
      return { ...state, ...action.payload };
    case 'RESET':
      return { ...INITIAL_STATE };
    default:
      return state;
  }
}
