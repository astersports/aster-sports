import { useEffect, useState } from 'react';
import { ensureTrackingInit, getTrackedTeams, TRACKED_CHANGE_EVENT } from '../lib/aau/trackingStore';

/**
 * Subscribe to the tracked-teams store (R1·PR-A). Re-reads whenever the store
 * changes in this tab (TRACKED_CHANGE_EVENT) or another tab ('storage'). Returns
 * the array of { teamKey, name } entries. `ensureTrackingInit()` lazily wires the
 * signed-in sync (DB-backed) on first mount; anon stays on localStorage.
 */
export function useTrackedTeams() {
  const [teams, setTeams] = useState(getTrackedTeams);

  useEffect(() => {
    ensureTrackingInit();
    const sync = () => setTeams(getTrackedTeams());
    window.addEventListener(TRACKED_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(TRACKED_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return teams;
}
