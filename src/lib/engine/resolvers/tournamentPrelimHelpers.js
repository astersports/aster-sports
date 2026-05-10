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

export async function fetchRecipientGuardians(supabase, orgId, teamIds) {
  const { data: rpcRows = [], error } = await supabase.rpc('get_digest_recipients', { p_org_id: orgId, p_pilot_only: false });
  if (error) throw error;
  const teamSet = new Set(teamIds);
  const onTeams = (rpcRows || []).filter((r) => (r.team_ids || []).some((t) => teamSet.has(t)));
  const kidsByGuardian = await fetchKidNames(supabase, onTeams.map((r) => r.guardian_id));
  return onTeams.map((r) => ({
    guardian_id: r.guardian_id, email: r.email,
    is_pilot_family: !!r.is_pilot_family,
    kid_first_names: (kidsByGuardian.get(r.guardian_id) || []).slice().sort(),
    team_ids: (r.team_ids || []).slice(),
  }));
}

export function buildTeamSlices(tournamentTeams, allRecipients, pilotOnly) {
  return (tournamentTeams || [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.team_id < b.team_id ? -1 : a.team_id > b.team_id ? 1 : 0))
    .map((t) => {
      let recip = allRecipients.filter((r) => (r.team_ids || []).includes(t.team_id));
      if (pilotOnly) recip = recip.filter((r) => r.is_pilot_family);
      const dedupe = new Map();
      for (const r of recip) {
        if (dedupe.has(r.guardian_id)) continue;
        dedupe.set(r.guardian_id, { guardian_id: r.guardian_id, email: r.email, kid_first_names: r.kid_first_names, is_pilot_family: r.is_pilot_family });
      }
      const recipient_guardians = Array.from(dedupe.values()).sort((a, b) => (a.guardian_id < b.guardian_id ? -1 : a.guardian_id > b.guardian_id ? 1 : 0));
      return { kind: 'team', team_id: t.team_id, team_name: t.team_name, team_color: t.team_color, sort_order: t.sort_order, recipient_guardians };
    });
}
