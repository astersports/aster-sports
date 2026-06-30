// Anon "tracked teams" store for the no-login Hub (R1·PR-A, DR-P).
//
// A logged-out parent's followed teams live in localStorage keyed by the team's
// qkey (the same `teamKey` a search result carries and the schedule route uses).
// A later increment syncs this to the `tracked_teams` table for signed-in users;
// for now it is purely client-side. Changes broadcast a window event so every
// mounted consumer (track button, Home list) re-reads in sync, including across
// tabs via the native 'storage' event.

const STORAGE_KEY = 'aau:tracked-teams:v1';
export const TRACKED_CHANGE_EVENT = 'aau-tracked-change';

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((t) => t && t.teamKey) : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(TRACKED_CHANGE_EVENT));
  } catch {
    // Private-mode / storage-disabled: tracking silently no-ops rather than crashing.
  }
}

export function getTrackedTeams() {
  return read();
}

export function isTeamTracked(teamKey) {
  return read().some((t) => t.teamKey === teamKey);
}

// Adds or removes the team. Returns true if the team is now tracked, false if it
// was just untracked. `entry` = { teamKey, name }.
export function toggleTrackedTeam(entry) {
  if (!entry || !entry.teamKey) return false;
  const list = read();
  const idx = list.findIndex((t) => t.teamKey === entry.teamKey);
  if (idx >= 0) {
    list.splice(idx, 1);
    write(list);
    return false;
  }
  list.push({ teamKey: entry.teamKey, name: entry.name || entry.teamKey });
  write(list);
  return true;
}

export function untrackTeam(teamKey) {
  write(read().filter((t) => t.teamKey !== teamKey));
}
