// Wave 4.4-B Session 1 — deep-link param parser for the briefing portal.
//
// Reads URL search params + path to decide whether the composer should
// auto-open on mount, and with what initial state. Supports two param
// taxonomies for backwards compatibility:
//
//   New (Wave 4.4-B):
//     ?anchor=team|event|tournament   anchor_kind
//     ?id=<uuid>                      anchor_id
//     ?kind=<kind>                    composer kind
//     ?draft=<message_id>             open existing draft row
//
//   Legacy (pre-B, BriefingsInboxPage onAction):
//     ?anchor_kind=...                old anchor name
//     ?anchor_id=...                  old id name
//     ?draft_id=...                   old draft name
//     ?kind=...                       (same as new)
//
// New names win when both are set. consume() strips both taxonomies in
// one pass so a refresh after close doesn't re-open the composer.
//
// Path semantics:
//   /admin/briefings/compose — auto-open composer even without params
//                              (cold-start entry from home Quick Action)
//   /admin/briefings         — open only if params present (deep-link
//                              from team/event card)

import { useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

// Deep-link params consumed once on mount so a refresh/back after close
// doesn't re-pop the composer. `draft` / `draft_id` are intentionally
// EXCLUDED — they're the resume signal (BriefingComposer writes the
// autosave id back to the URL as ?draft=<id> so a PWA cold-launch via
// useRouteMemory can rehydrate the in-progress draft).
const PARAM_KEYS = ['anchor', 'id', 'kind', 'anchor_kind', 'anchor_id'];

// Pure parser — exported for unit-test coverage without React. Pass a
// pathname string and a URLSearchParams instance.
export function parseBriefingDeepLink(pathname, searchParams) {
  const isComposeRoute = !!pathname && pathname.endsWith('/compose');
  const draftId = searchParams.get('draft') || searchParams.get('draft_id');
  const anchorKind = searchParams.get('anchor') || searchParams.get('anchor_kind');
  const anchorId = searchParams.get('id') || searchParams.get('anchor_id');
  const kind = searchParams.get('kind');
  const hasParams = !!(draftId || kind || anchorId);
  const shouldOpenComposer = isComposeRoute || hasParams;
  const composerInit = shouldOpenComposer
    ? { draft_id: draftId || null, kind: kind || null, anchor_kind: anchorKind || null, anchor_id: anchorId || null }
    : null;
  return { isComposeRoute, shouldOpenComposer, composerInit };
}

export function useBriefingDeepLink() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const parsed = parseBriefingDeepLink(location.pathname, searchParams);
  const consume = useCallback(() => {
    const sp = new URLSearchParams(searchParams);
    let changed = false;
    for (const key of PARAM_KEYS) { if (sp.has(key)) { sp.delete(key); changed = true; } }
    if (changed) setSearchParams(sp, { replace: true });
  }, [searchParams, setSearchParams]);
  return { ...parsed, consume };
}
