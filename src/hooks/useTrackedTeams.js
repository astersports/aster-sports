import { useEffect, useState } from 'react';
import { getTrackedTeams, TRACKED_CHANGE_EVENT } from '../lib/aau/trackingStore';

/**
 * Subscribe to the anon tracked-teams store (R1·PR-A). Re-reads whenever the
 * store changes in this tab (TRACKED_CHANGE_EVENT) or another tab ('storage').
 * Returns the array of { teamKey, name } entries.
 */
export function useTrackedTeams() {
  const [teams, setTeams] = useState(getTrackedTeams);

  useEffect(() => {
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
