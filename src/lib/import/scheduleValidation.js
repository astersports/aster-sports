// Wave 5 PR 2 — pure validation rules for parsed TourneyMachine
// schedule rows. Per audit Q2 + spike — hybrid LLM + 8 validation
// rules. Tested in isolation; no DB calls, no LLM calls. Input is
// parser output + reference data (teams, venues, opponents); output
// is the same rows enriched with `status` (valid/warning/error) +
// `messages` (per-row diagnostic strings).

import { isEasternDST } from '../aau/parseTournament';

const SANITY_HOUR_MIN = 7;   // 7am
const SANITY_HOUR_MAX = 22;  // 10pm

function pad2(n) { return String(n).padStart(2, '0'); }

// Tournament year from the date-only `start_date` string's "YYYY-" prefix.
// Parsing through `new Date(...).getUTCFullYear()` rolls a Dec-31-ET date-only
// string back to the prior year (it's read as UTC midnight). Falls back to the
// current UTC year only when start_date is absent/unparseable.
function tournamentYearOf(tournament) {
  const sd = String(tournament?.start_date || '').trim();
  const ym = /^(\d{4})-/.exec(sd);
  return ym ? parseInt(ym[1], 10) : new Date().getUTCFullYear();
}

// "5/16" → "2026-05-16" anchored on tournament year
export function normalizeDate(mdString, tournamentYear) {
  const m = /^(\d{1,2})\/(\d{1,2})$/.exec(String(mdString || '').trim());
  if (!m) return null;
  const month = pad2(m[1]); const day = pad2(m[2]);
  return `${tournamentYear}-${month}-${day}`;
}

// "11:00 AM" → ISO timestamp at America/New_York for the given date
export function normalizeTimeToISO(timeString, dateISO) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(timeString || '').trim());
  if (!m || !dateISO) return null;
  let hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  // Anchor the ET offset to the actual date: -04:00 in EDT (DST), -05:00 in
  // EST (Nov–Mar). Derived via the shared isEasternDST helper so a Dec game
  // isn't shifted 1h. dateISO is YYYY-MM-DD; isEasternDST month is 1-indexed.
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);
  let offset = '-04:00';
  if (dm) {
    const isDst = isEasternDST(parseInt(dm[1], 10), parseInt(dm[2], 10), parseInt(dm[3], 10), hours);
    offset = isDst ? '-04:00' : '-05:00';
  }
  return `${dateISO}T${pad2(hours)}:${pad2(minutes)}:00${offset}`;
}

export function resolveTeamId(teamHeader, teams) {
  if (!teamHeader) return null;
  const norm = String(teamHeader).toLowerCase().replace(/[^a-z0-9]/g, '');
  const list = teams || [];
  // Prefer an exact normalized match (so "10U" never silently picks "10U Black").
  for (const t of list) {
    const tn = String(t.name).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (tn === norm) return t.id;
  }
  // Fall back to a bidirectional substring match ONLY when EXACTLY ONE team
  // matches; an ambiguous header (matches 2+) returns null → error row.
  const subMatches = list.filter((t) => {
    const tn = String(t.name).toLowerCase().replace(/[^a-z0-9]/g, '');
    return norm.includes(tn) || tn.includes(norm);
  });
  return subMatches.length === 1 ? subMatches[0].id : null;
}

export function resolveLocationId(venueString, locations) {
  if (!venueString) return null;
  const norm = String(venueString).trim().toLowerCase();
  for (const l of locations || []) {
    if (String(l.name).trim().toLowerCase() === norm) return l.id;
  }
  return null;
}

function timeWithinSanity(iso) {
  if (!iso) return false;
  // ISO timestamp from normalizeTimeToISO is already in ET (e.g.
  // "2026-05-17T10:00:00-04:00") — the hour portion IS the ET hour.
  // Earlier version subtracted 4 (treating hour as UTC) which flagged
  // legit 10am ET games as "outside 7am-10pm." Fixed: read hour as ET
  // directly.
  const m = /T(\d{2}):/.exec(iso);
  if (!m) return false;
  const etHour = parseInt(m[1], 10);
  return etHour >= SANITY_HOUR_MIN && etHour <= SANITY_HOUR_MAX;
}

function dateWithinTournament(dateISO, tournament) {
  if (!dateISO || !tournament) return true;
  return dateISO >= tournament.start_date && dateISO <= tournament.end_date;
}

// Apply all 8 validation rules to a single parsed row, returning
// an enriched row with .status ('valid'|'warning'|'error') and
// .messages (array of diagnostic strings).
export function validateParsedRow(row, { teams, locations, tournament }) {
  const messages = []; let severity = 'valid';
  const dateISO = normalizeDate(row.date, tournamentYearOf(tournament));
  const startISO = normalizeTimeToISO(row.time, dateISO);
  const teamId = resolveTeamId(row.team, teams);
  const locationId = resolveLocationId(row.venue, locations);

  if (!teamId) { severity = 'error'; messages.push(`Cannot resolve team identifier from "${row.team || '(missing)'}".`); }
  if (!dateISO) { severity = 'error'; messages.push(`Date "${row.date || '(missing)'}" is not a recognized M/D format.`); }
  if (!startISO) { severity = 'error'; messages.push(`Time "${row.time || '(missing)'}" is not a recognized H:MM AM/PM format.`); }
  if (dateISO && !dateWithinTournament(dateISO, tournament)) { severity = 'error'; messages.push(`Date ${dateISO} is outside tournament range ${tournament?.start_date} – ${tournament?.end_date}.`); }
  if (startISO && !timeWithinSanity(startISO)) { if (severity !== 'error') severity = 'warning'; messages.push(`Time appears outside ${SANITY_HOUR_MIN}am-${SANITY_HOUR_MAX === 22 ? '10pm' : SANITY_HOUR_MAX}.`); }
  if (!locationId && row.venue) { if (severity !== 'error') severity = 'warning'; messages.push(`Venue "${row.venue}" doesn't match a known location; will store text only.`); }

  return { ...row, status: severity, messages, resolved: { team_id: teamId, location_id: locationId, start_at: startISO, date_iso: dateISO } };
}

export function summarize(rows) {
  return rows.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, { valid: 0, warning: 0, error: 0 });
}
