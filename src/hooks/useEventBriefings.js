// Wave 3.15 — thin wrapper around useAnchorBriefings preserving the
// PR #45 API. Keeps EventBriefingHistory unchanged; new tournament/
// team consumers call useAnchorBriefings directly.

import { useAnchorBriefings } from './useAnchorBriefings';

export function useEventBriefings({ orgId, eventId } = {}) {
  return useAnchorBriefings({ orgId, anchorKind: 'event', anchorId: eventId });
}
