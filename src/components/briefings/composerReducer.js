// Wave 3.11 follow-up — reducer for BriefingComposer wizard state.
// Pure module, no React. Easy to unit-test.

export const INITIAL_STATE = {
  step: 1,
  kind: null,
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
};

export function canAdvance(state) {
  if (state.step === 1) return !!state.kind;
  if (state.step === 2) return !!state.anchor_kind && !!state.audience_type;
  return false;
}

export function composerReducer(state, action) {
  switch (action.type) {
    case 'SET_KIND':
      return { ...state, kind: action.kind, body: action.defaultBody || {}, anchor_kind: action.anchor_kind || state.anchor_kind, anchor_id: action.anchor_id || state.anchor_id, audience_type: action.audience_type || state.audience_type };
    case 'SET_ANCHOR':
      return { ...state, anchor_kind: action.anchor_kind, anchor_id: action.anchor_id };
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
    case 'SET_PREVIEW_FAMILY':
      return { ...state, preview_family_id: action.id };
    case 'GO_BACK':
      return { ...state, step: Math.max(1, state.step - 1) };
    case 'GO_FORWARD':
      return canAdvance(state) ? { ...state, step: Math.min(3, state.step + 1) } : state;
    case 'JUMP_TO':
      return { ...state, step: action.step };
    case 'HYDRATE_DRAFT':
      return { ...state, ...action.payload, step: 3 };
    case 'RESET':
      return { ...INITIAL_STATE };
    default:
      return state;
  }
}
