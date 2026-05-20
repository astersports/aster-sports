import { useEffect, useRef } from 'react';

// Dispatches a `RESET` action on the given reducer dispatch whenever
// orgId transitions from one non-null value to another non-null
// value. Skips the initial mount (orgId starting from null) and
// skips logout (orgId → null), so consumers only reset on a real
// cross-org transition.
//
// Origin: May 16 audit P2 item 9 — `BriefingComposer` reducer state
// (anchor, kind, audience selection, signoff) was persisting across
// org switches, a multi-tenant bleed-through risk. Generalized here
// so any future reducer-based wizard can opt in with one line.
//
// Reducers using this hook must implement `case 'RESET'` returning
// a fresh initial state. `composerReducer` already does (PR #317
// audit catch).

export function useResetOnOrgChange(orgId, dispatch) {
  const prevOrgIdRef = useRef(orgId);
  useEffect(() => {
    const prev = prevOrgIdRef.current;
    if (prev !== orgId && prev !== null && orgId !== null) {
      dispatch({ type: 'RESET' });
    }
    prevOrgIdRef.current = orgId;
  }, [orgId, dispatch]);
}
