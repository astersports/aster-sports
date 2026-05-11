// Wave 3.11 follow-up — reducer for BriefingComposer wizard state.
// Pure module, no React. Easy to unit-test.
//
// Wave 4.1b §1 + §3 — Bug A: anchor_id is required when anchor_kind
// is event/tournament/team (not for org). Bug C: HYDRATE_DRAFT
// targets the earliest invalid step so admins can recover broken
// drafts (e.g. anchor_id NULL surfaces inline on Step 2).

export const ANCHOR_KINDS_REQUIRING_ID = new Set(['event', 'tournament', 'team']);

export function step2Valid(state) {
  if (!state.anchor_kind || !state.audience_type) return false;
  if (ANCHOR_KINDS_REQUIRING_ID.has(state.anchor_kind) && !state.anchor_id) return false;
  return true;
}

export const INITIAL_STATE = {
  step: 1,
  kind: null,
  kindFilter: null,         // string[]|null — when non-null, picker shows only these
  anchor_kind: null,
  anchor_id: null,
  audience_type: null,
  audience_filter: null,
  body: {},
  signoff_message: '',
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

export function canAdvance(state) {
  if (state.step === 1) return !!state.kind;
  if (state.step === 2) return step2Valid(state);
  return false;
}

export function hydrateTargetStep(payload = {}) {
  if (!payload.kind) return 1;
  if (!step2Valid(payload)) return 2;
  return 3;
}

export function composerReducer(state, action) {
  switch (action.type) {
    case 'SET_KIND':
      return { ...state, kind: action.kind, body: action.defaultBody || {}, anchor_kind: action.anchor_kind || state.anchor_kind, anchor_id: action.anchor_id || state.anchor_id, audience_type: action.audience_type || state.audience_type };
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
    case 'GO_BACK':
      return { ...state, step: Math.max(1, state.step - 1) };
    case 'GO_FORWARD':
      return canAdvance(state) ? { ...state, step: Math.min(3, state.step + 1) } : state;
    case 'JUMP_TO':
      return { ...state, step: action.step };
    case 'HYDRATE_DRAFT':
      return { ...state, ...action.payload, step: hydrateTargetStep({ ...state, ...action.payload }) };
    case 'RESET':
      return { ...INITIAL_STATE };
    default:
      return state;
  }
}
