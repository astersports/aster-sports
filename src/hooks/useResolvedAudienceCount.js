// COMPOSE-FRONT P1 — async recipient count for the audience types that
// countByAudienceType can't derive from the guardian list alone
// (event_attendees, tournament_attendees, multi_event_attendees,
// player_specific). Reuses the SAME resolveAudience the send pipeline uses
// (recipientFilter.js) so the preview count and the actual send agree —
// no second source of truth (AP #63).
//
// Returns { count, resolving, error }:
//   count     — resolved recipient count (number), or null until resolved
//   resolving — true while the anchor/player lookup is in flight
//   error     — the lookup error if it threw
//
// Non-async types short-circuit to { count: null, resolving: false } so the
// caller falls back to the synchronous countByAudienceType path.

import { useEffect, useState } from 'react';
import { resolveAudience } from '../lib/briefings/recipientFilter';
import { ASYNC_RESOLVED_AUDIENCE_TYPES } from '../lib/briefings/audience';

export function useResolvedAudienceCount({ recipients, audienceType, audienceFilter, anchorId }) {
  const [out, setOut] = useState({ count: null, resolving: false, error: null });
  // Serialize the filter so an unchanged object identity doesn't re-fetch.
  const filterKey = JSON.stringify(audienceFilter ?? null);

  useEffect(() => {
    let cancelled = false;
    // Non-async types reset to the neutral state (deferred to a microtask so
    // the reset isn't a synchronous in-effect setState — see react-hooks
    // set-state-in-effect; mirrors useDigestRecipients' Promise.resolve pattern).
    if (!audienceType || !ASYNC_RESOLVED_AUDIENCE_TYPES.has(audienceType)) {
      Promise.resolve().then(() => { if (!cancelled) setOut({ count: null, resolving: false, error: null }); });
      return () => { cancelled = true; };
    }
    Promise.resolve()
      .then(() => { if (!cancelled) setOut((s) => ({ ...s, resolving: true, error: null })); })
      .then(() => resolveAudience({ recipients, audienceType, audienceFilter, anchorId }))
      .then(({ audience }) => {
        if (cancelled) return;
        setOut({ count: Array.isArray(audience) ? audience.length : null, resolving: false, error: null });
      })
      .catch((e) => { if (!cancelled) setOut({ count: null, resolving: false, error: e }); });
    return () => { cancelled = true; };
    // recipients is stable across a compose session (loaded once); excluding
    // it from deps avoids a re-resolve on every render. filterKey + anchorId +
    // type are the inputs that actually change the resolved set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceType, filterKey, anchorId]);

  return out;
}
