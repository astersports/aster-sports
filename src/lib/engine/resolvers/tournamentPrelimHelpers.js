// Wave 4.2-A-3 — pure helpers for tournamentPrelim resolver pair.

const NY_TZ = 'America/New_York';
const dayLabelFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, weekday: 'short', month: 'short', day: 'numeric' });
const monthDayFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, month: 'short', day: 'numeric' });
const dayOnlyFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, day: 'numeric' });
const monthFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, month: 'short' });
const yearFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, hour: 'numeric', minute: '2-digit', hour12: true });

export function trim(s) { return (s || '').trim(); }

export function formatDayLabel(iso) {
  return dayLabelFmt.format(new Date(iso)).toUpperCase().replace(',', ' ·');
}

export function formatTime(iso) { return timeFmt.format(new Date(iso)); }

export function formatDateRange(start, end) {
  if (!start) return '';
  // Anchor at noon UTC so NY-tz formatting doesn't shift the date
  // backward across the day boundary.
  const startDate = new Date(`${start}T12:00:00Z`);
  const endDate = end ? new Date(`${end}T12:00:00Z`) : startDate;
  const sM = monthFmt.format(startDate); const eM = monthFmt.format(endDate);
  const sY = yearFmt.format(startDate); const eY = yearFmt.format(endDate);
  if (sY !== eY) return `${monthDayFmt.format(startDate)}, ${sY}–${monthDayFmt.format(endDate)}, ${eY}`;
  if (sM !== eM) return `${monthDayFmt.format(startDate)}–${monthDayFmt.format(endDate)}`;
  if (monthDayFmt.format(startDate) === monthDayFmt.format(endDate)) return monthDayFmt.format(startDate);
  return `${monthDayFmt.format(startDate)}–${dayOnlyFmt.format(endDate)}`;
}

export function buildSubject(team, tournament) { return `${team.team_name} — ${tournament.name} Weekend`; }

export function buildSubContext(tournament) {
  const range = formatDateRange(tournament.start_date, tournament.end_date);
  const parts = [tournament.name, range, tournament.primary_venue].filter((p) => p && String(p).trim());
  return parts.join(' · ');
}

export async function fetchKidNames(supabase, guardianIds) {
  if (!guardianIds.length) return new Map();
  const { data: rows = [], error } = await supabase
    .from('player_guardians').select('guardian_id, players ( first_name )').in('guardian_id', guardianIds);
  if (error) throw error;
  const m = new Map();
  for (const row of rows || []) {
    const fn = row.players?.first_name || row.first_name;
    if (!fn) continue;
    const arr = m.get(row.guardian_id) || [];
    arr.push(fn); m.set(row.guardian_id, arr);
  }
  return m;
}

// Wave 4.3-I: pilotOnly plumbed through to RPC. Server-side filter is the
// canonical pilot gate (matches get_digest_recipients(..., p_pilot_only)
// semantics in all sibling resolvers). Prior code hardcoded
// p_pilot_only=false and applied a client-side r.is_pilot_family filter at
// slice-build time — but is_pilot_family is not in the RPC return shape, so
// the client filter always wiped to 0 in pilot mode. Server-side filter +
// the 4.3-I synthetic-row override both flow through this single path.
export async function fetchRecipientGuardians(supabase, orgId, teamIds, pilotOnly = false) {
  const { data: rpcRows = [], error } = await supabase.rpc('get_digest_recipients', { p_org_id: orgId, p_pilot_only: !!pilotOnly });
  if (error) throw error;
  const teamSet = new Set(teamIds);
  const onTeams = (rpcRows || []).filter((r) => (r.team_ids || []).some((t) => teamSet.has(t)));
  const kidsByGuardian = await fetchKidNames(supabase, onTeams.map((r) => r.guardian_id).filter(Boolean));
  return onTeams.map((r) => ({
    guardian_id: r.guardian_id, email: r.email,
    kid_first_names: r.guardian_id ? (kidsByGuardian.get(r.guardian_id) || []).slice().sort() : [],
    team_ids: (r.team_ids || []).slice(),
  }));
}

// Q3 (2026-06-04): participant scoping source for tournament_prelim. Returns
// Map<team_id, Set<guardian_id>> of guardians whose kids are on each team's
// active tournament_roster — or null when the tournament has NO roster rows,
// in which case the caller keeps the whole-team audience (league play, or a
// roster not yet entered). This is prelim-only; tournament_recap stays
// whole-team per Frank's call.
export async function fetchParticipantGuardiansByTeam(supabase, tournamentId) {
  const { data: rosterRows, error } = await supabase
    .from('tournament_rosters').select('team_id, player_id')
    .eq('tournament_id', tournamentId).eq('roster_status', 'active');
  if (error) throw error;
  if (!rosterRows || rosterRows.length === 0) return null;
  const playerIds = [...new Set(rosterRows.map((r) => r.player_id).filter(Boolean))];
  const { data: pgRows = [], error: pgErr } = await supabase
    .from('player_guardians').select('player_id, guardian_id').in('player_id', playerIds);
  if (pgErr) throw pgErr;
  const guardiansByPlayer = new Map();
  for (const r of pgRows || []) {
    if (!r.player_id || !r.guardian_id) continue;
    const arr = guardiansByPlayer.get(r.player_id) || [];
    arr.push(r.guardian_id);
    guardiansByPlayer.set(r.player_id, arr);
  }
  const byTeam = new Map();
  for (const r of rosterRows) {
    if (!r.team_id || !r.player_id) continue;
    const set = byTeam.get(r.team_id) || new Set();
    for (const gid of guardiansByPlayer.get(r.player_id) || []) set.add(gid);
    byTeam.set(r.team_id, set);
  }
  return byTeam;
}

export function buildTeamSlices(tournamentTeams, allRecipients, participantsByTeam = null) {
  return (tournamentTeams || [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.team_id < b.team_id ? -1 : a.team_id > b.team_id ? 1 : 0))
    .map((t) => {
      // Q3 (2026-06-04): when a tournament roster exists, prelim scopes to
      // PARTICIPANTS — guardians of players on this team's active
      // tournament_roster (Frank: prelim = traveler logistics; recap stays
      // whole-team). Synthetic pilot-redirect rows (no guardian_id) always
      // pass so the pilot test still sends. No roster -> participantsByTeam
      // null -> whole-team audience (unchanged).
      const participants = participantsByTeam ? (participantsByTeam.get(t.team_id) || new Set()) : null;
      const recip = allRecipients.filter((r) => (r.team_ids || []).includes(t.team_id)
        && (!participants || !r.guardian_id || participants.has(r.guardian_id)));
      const dedupe = new Map();
      for (const r of recip) {
        const key = r.guardian_id || r.email;
        if (dedupe.has(key)) continue;
        dedupe.set(key, { guardian_id: r.guardian_id, email: r.email, kid_first_names: r.kid_first_names });
      }
      const recipient_guardians = Array.from(dedupe.values()).sort((a, b) => {
        const ka = a.guardian_id || a.email; const kb = b.guardian_id || b.email;
        return ka < kb ? -1 : ka > kb ? 1 : 0;
      });
      return { kind: 'team', team_id: t.team_id, team_name: t.team_name, team_color: t.team_color, sort_order: t.sort_order, recipient_guardians };
    });
}
