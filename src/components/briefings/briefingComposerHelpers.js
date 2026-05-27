// Wave 4.3-K — helpers extracted from BriefingComposer.jsx to keep the
// component module under the 150-line cap (CLAUDE.md §6).

import { INITIAL_STATE } from './composerReducer';
import { KIND_METADATA } from '../../lib/briefings/kindMetadata';

// Wave 4.4-B housekeeping — STEPS sourced from composerSteps.js (a leaf
// module) so composerReducer.js can import it without creating a cycle
// through this file's INITIAL_STATE import above. Re-exported here so
// existing consumers (BriefingComposer.jsx) keep importing from helpers
// without breakage. STEPS literal: ['Kind', 'Audience', 'Body', 'Send'].
export { STEPS } from './composerSteps';

// Wave 4.4-B Session 1: audience pre-fill from anchor. When the deep-link
// supplies anchor=team&id=<uuid>, default audience to {type:'team',
// filter:{team_ids:[id]}}. anchor=event / anchor=tournament land here
// too (param taxonomy scaffolded now; audience pre-fill for those kinds
// ships in Sessions 5+ — for now they pass through and let the wizard
// derive from KIND_METADATA at Step 1).
function audienceFromAnchor(anchorKind, anchorId) {
  if (anchorKind === 'team' && anchorId) {
    return { audience_type: 'team', audience_filter: { team_ids: [anchorId] } };
  }
  return {};
}

export function buildInitial({ initialKind, initialAnchorKind, initialAnchorId, initialKindFilter }) {
  const base = { ...INITIAL_STATE, kindFilter: initialKindFilter?.length ? initialKindFilter : null };
  if (!initialKind && !initialAnchorId) return base;
  const meta = KIND_METADATA[initialKind] || {};
  const anchorAudience = audienceFromAnchor(initialAnchorKind, initialAnchorId);
  // Wave 4.4-B Session 1 step-skipping rules:
  //   anchor + id + kind → step 3 (Body) — everything pre-filled
  //   anchor + id only   → step 1 (Kind) — pick kind first, audience already set
  //   cold start         → step 1 (Kind)
  // Draft hydration lands at step 3 via HYDRATE_DRAFT action in
  // BriefingComposer's useEffect — not this function's concern.
  const hasKindAndAnchor = !!(initialKind && initialAnchorId);
  return {
    ...base,
    step: hasKindAndAnchor ? 3 : 1,
    kind: initialKind || null,
    anchor_kind: initialAnchorKind || meta.defaultAnchorKind || null,
    anchor_id: initialAnchorId || null,
    audience_type: anchorAudience.audience_type || meta.defaultAudienceType || null,
    audience_filter: anchorAudience.audience_filter || null,
  };
}

// A draft is only worth persisting once the admin has authored something
// (a body field or a sign-off). Advancing to the Audience/Body step and
// backing out must NOT leave an empty scratch draft cluttering the
// "Resume a draft?" list. body starts as {} and gains keys only on user
// edits (UPDATE_BODY) or a date-range pick, so an empty body + empty
// sign-off means nothing has been authored yet.
export function hasAuthoredContent({ body, signoff_message } = {}) {
  if (signoff_message && signoff_message.trim()) return true;
  if (body && typeof body === 'object') {
    return Object.values(body).some((v) => {
      if (v == null) return false;
      if (typeof v === 'string') return v.trim().length > 0;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object') return Object.keys(v).length > 0;
      return true;
    });
  }
  return false;
}

export function fmtSchedule(iso) {
  return new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
}
