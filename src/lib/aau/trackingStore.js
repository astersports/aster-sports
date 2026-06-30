// "Tracked teams" store for the no-login Hub (R1·PR-A, DR-P sync).
//
// Two backends behind one API:
//  - ANON (default): localStorage, keyed by qkey. Instant, no account.
//  - SIGNED IN: the `tracked_aau_teams` table (RLS: own rows). Set once the
//    parent signs in via the Hub magic link; their list then follows their id
//    across devices. On sign-in we MERGE the local list into their account.
//
// Sync reads (getTrackedTeams / isTeamTracked) stay synchronous off an in-memory
// view; writes are optimistic (update view + emit immediately, persist in the
// background). Supabase is imported DYNAMICALLY inside the signed-in paths only,
// so this module — and the component tests that import it transitively — load
// without the supabase client init (AP #27 / AP #36 apply to the DB calls).

const STORAGE_KEY = 'aau:tracked-teams:v1';
export const TRACKED_CHANGE_EVENT = 'aau-tracked-change';

let userId = null;   // auth user id when signed in; null = anon/local
let cache = [];      // in-memory list when signed in (DB is source of truth)
let initStarted = false;

function readLocal() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((t) => t && t.teamKey) : [];
  } catch { return []; }
}
function writeLocal(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* storage off */ }
}
function emit() { try { window.dispatchEvent(new Event(TRACKED_CHANGE_EVENT)); } catch { /* no window */ } }
function entryFor(e) { return { teamKey: e.teamKey, name: e.name || e.teamKey }; }

// Current list: cache when signed in, fresh localStorage read when anon (so the
// anon path stays stateless — same behavior as before the sync layer).
function current() { return userId ? cache : readLocal(); }

export function getTrackedTeams() { return current(); }
export function isTeamTracked(teamKey) { return current().some((t) => t.teamKey === teamKey); }
export function isHubSignedIn() { return !!userId; }

// Adds/removes the team and returns true if it is now tracked. Synchronous +
// optimistic; the signed-in branch persists to the DB in the background.
export function toggleTrackedTeam(entry) {
  if (!entry || !entry.teamKey) return false;
  const list = current();
  const wasTracked = list.some((t) => t.teamKey === entry.teamKey);
  const next = wasTracked
    ? list.filter((t) => t.teamKey !== entry.teamKey)
    : [...list, entryFor(entry)];
  if (userId) { cache = next; void persistDb(wasTracked ? 'delete' : 'insert', entry); }
  else { writeLocal(next); }
  emit();
  return !wasTracked;
}

export function untrackTeam(teamKey) {
  if (userId) { cache = cache.filter((t) => t.teamKey !== teamKey); void persistDb('delete', { teamKey }); }
  else { writeLocal(readLocal().filter((t) => t.teamKey !== teamKey)); }
  emit();
}

async function persistDb(op, entry) {
  try {
    const { supabase } = await import('../supabase');
    if (op === 'insert') {
      await supabase.from('tracked_aau_teams').upsert(
        { user_id: userId, team_key: entry.teamKey, team_name: entry.name || entry.teamKey },
        { onConflict: 'user_id,team_key', ignoreDuplicates: true });
    } else {
      await supabase.from('tracked_aau_teams').delete().eq('user_id', userId).eq('team_key', entry.teamKey);
    }
  } catch { /* offline / transient — the optimistic view already reflects intent */ }
}

async function loadFromDb(supabase) {
  const { data, error } = await supabase.from('tracked_aau_teams').select('team_key, team_name').eq('user_id', userId);
  if (error) return;                       // AP #36: keep the prior view on error
  cache = (data || []).map((r) => ({ teamKey: r.team_key, name: r.team_name || r.team_key }));
}

async function mergeLocalIntoDb(supabase) {
  const local = readLocal();
  if (!local.length) return;
  await supabase.from('tracked_aau_teams').upsert(
    local.map((t) => ({ user_id: userId, team_key: t.teamKey, team_name: t.name || t.teamKey })),
    { onConflict: 'user_id,team_key', ignoreDuplicates: true });
}

async function applySession(supabase, u) {
  if (u && u.id !== userId) {           // signed in (or switched user)
    userId = u.id;
    await mergeLocalIntoDb(supabase);   // push the anon list onto their account
    await loadFromDb(supabase);         // DB becomes source of truth
    emit();
  } else if (!u && userId) {            // signed out → fall back to localStorage
    userId = null; cache = []; emit();
  }
}

// Lazy one-time wiring: detect an existing session, then track auth changes.
// Called by useTrackedTeams on mount (never at import — keeps tests supabase-free).
export function ensureTrackingInit() {
  if (initStarted) return;
  initStarted = true;
  import('../supabase').then(async ({ supabase }) => {
    const { data } = await supabase.auth.getSession();
    await applySession(supabase, data?.session?.user || null);
    supabase.auth.onAuthStateChange((_event, session) => { void applySession(supabase, session?.user || null); });
  }).catch(() => { /* no supabase / offline → stay on localStorage */ });
}
