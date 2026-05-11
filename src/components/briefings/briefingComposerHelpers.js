// Wave 4.3-K — helpers extracted from BriefingComposer.jsx to keep the
// component module under the 150-line cap (CLAUDE.md §6).

import { INITIAL_STATE } from './composerReducer';
import { KIND_METADATA } from '../../lib/briefings/kindMetadata';

export const STEPS = ['Kind', 'Audience', 'Body'];

export function buildInitial({ initialKind, initialAnchorKind, initialAnchorId, initialKindFilter }) {
  const base = { ...INITIAL_STATE, kindFilter: initialKindFilter?.length ? initialKindFilter : null };
  if (!initialKind && !initialAnchorId) return base;
  const meta = KIND_METADATA[initialKind] || {};
  return {
    ...base,
    step: initialAnchorId ? 2 : 1,
    kind: initialKind || null,
    anchor_kind: initialAnchorKind || meta.defaultAnchorKind || null,
    anchor_id: initialAnchorId || null,
    audience_type: meta.defaultAudienceType || null,
  };
}

export function fmtSchedule(iso) {
  return new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
