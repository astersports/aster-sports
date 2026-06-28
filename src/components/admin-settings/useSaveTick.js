import { useCallback, useMemo, useState } from 'react';

// Wraps the settings hooks' `save` functions so a successful save bumps a
// monotonic tick that drives SettingsSavedBanner. Each hook's contract is
// `save(patch) -> { ok }` (or a thrown error); we preserve the return value and
// only increment on `ok !== false`. The wrap is memoized per-hook so identities
// stay stable across renders. No Date.now()/Math.random() — a plain counter.
export function useSaveTick(hooks) {
  const [tick, setTick] = useState(0);

  const wrap = useCallback((save) => {
    if (typeof save !== 'function') return save;
    return async (...args) => {
      const res = await save(...args);
      if (!res || res.ok !== false) setTick((n) => n + 1);
      return res;
    };
  }, []);

  // Return new hook objects with wrapped `save`, recomputed only when the
  // set of save-bearing hooks changes. `saveSig` collapses the per-hook save
  // presence into a stable string so the dep list stays an array literal
  // (react-hooks/use-memo); the settings hooks' `save` identities are stable
  // across renders, so presence is a sufficient recompute trigger.
  const saveSig = hooks.map((h) => (h && h.save ? '1' : '0')).join('');
  const wrapped = useMemo(
    () => hooks.map((h) => (h && h.save ? { ...h, save: wrap(h.save) } : h)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wrap, saveSig],
  );

  return { tick, wrapped };
}
