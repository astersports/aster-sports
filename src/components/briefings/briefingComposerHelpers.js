// Wave 4.3-K — helpers extracted from BriefingComposer.jsx to keep the
// component module under the 150-line cap (CLAUDE.md §6).

import { INITIAL_STATE } from './composerReducer';
import { KIND_METADATA } from '../../lib/briefings/kindMetadata';

// Wave 4.4-B Session 1: audience pre-fill from anchor. When the deep-link
// supplies anchor=team&id=<uuid>, default audience to {type:'team',
// filter:{team_ids:[id]}}. anchor=event / anchor=tournament land here
// too (param taxonomy scaffolded now; audience pre-fill for those kinds
// ships in Sessions 5+ — for now they pass through and let the composer
// derive from KIND_METADATA).
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
  // One-screen composer: pre-fill kind + anchor + audience from the deep-link;
  // no step to skip to. The admin lands on the single compose scroll with these
  // pre-filled (or empty for a cold start).
  return {
    ...base,
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
