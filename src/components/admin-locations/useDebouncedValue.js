import { useEffect, useState } from 'react';

// Returns `value` debounced by `delay` ms. Used to throttle the live-search
// term feeding useLocations so we refetch on a pause, not on every keystroke
// (perf — long venue lists). The effect only schedules a timer + sets state on
// timeout; no synchronous setState-in-effect (eslint purity).
export function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
