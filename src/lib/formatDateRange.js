// Renders a tournament date span as "May 30 – June 1" in the
// America/New_York time zone. Pure helper; no React or Supabase coupling.
const fmtOpts = { month: 'long', day: 'numeric', timeZone: 'America/New_York' };

export function formatDateRange(start, end) {
  if (!start) return '';
  const s = new Date(`${start}T12:00:00`).toLocaleDateString('en-US', fmtOpts);
  if (!end || end === start) return s;
  const e = new Date(`${end}T12:00:00`).toLocaleDateString('en-US', fmtOpts);
  return `${s} – ${e}`;
}
