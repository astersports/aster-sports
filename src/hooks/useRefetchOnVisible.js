import { useEffect } from 'react';

// Refetches whenever the tab regains visibility — cheap stand-in for
// pull-to-refresh on pages where stale data is most visible.
export function useRefetchOnVisible(refetch) {
  useEffect(() => {
    const handler = () => { if (document.visibilityState === 'visible') refetch?.(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [refetch]);
}
