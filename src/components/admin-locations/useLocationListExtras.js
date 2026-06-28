import { useMemo, useState } from 'react';
import { isMapIncomplete } from './locationMapStatus';

// Page-side glue for the Locations L99 enhancements: client-side sort, an
// optimistic-archive helper (hides the row immediately, rolls back + toasts on
// failure per §16.1/§16.3), and the aria-live announcement string. Kept out of
// the page file so the page stays thin and additive.

export function useLocationListExtras({ locations, archive, unarchive }) {
  const [sort, setSort] = useState('name');
  const [toast, setToast] = useState(null); // { message, variant }
  const [pendingIds, setPendingIds] = useState([]); // optimistically hidden rows

  // Client-side sort layered on the hook's name-ordered fetch. 'needs_map'
  // surfaces venues missing a §15 map link first (pairs with the completeness
  // banner — actionable). Operates only on fetched fields (no created_at in the
  // hook select), so no silent no-op. Default 'name' keeps the hook's order.
  const sorted = useMemo(() => {
    const rows = (locations || []).filter((l) => !pendingIds.includes(l.id));
    if (sort === 'needs_map') {
      return [...rows].sort((a, b) => Number(isMapIncomplete(b)) - Number(isMapIncomplete(a)));
    }
    return rows; // already name-ascending from the hook
  }, [locations, sort, pendingIds]);

  const visibleCount = sorted.length;

  const runOptimistic = async (id, fn, okMsg, failMsg) => {
    setPendingIds((p) => [...p, id]);
    const res = await fn(id);
    setPendingIds((p) => p.filter((x) => x !== id));
    if (res?.error) {
      setToast({ message: failMsg, variant: 'error' });
      return false;
    }
    setToast({ message: okMsg, variant: 'success' });
    return true;
  };

  const optimisticArchive = (location) =>
    runOptimistic(location.id, archive, `"${location.name}" archived`, 'Looks like that didn’t go through. Try again?');

  const optimisticUnarchive = (location) =>
    runOptimistic(location.id, unarchive, `"${location.name}" restored`, 'Looks like that didn’t go through. Try again?');

  return { sort, setSort, sorted, visibleCount, toast, setToast, optimisticArchive, optimisticUnarchive };
}
