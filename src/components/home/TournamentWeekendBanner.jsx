// §4.C Sprint C — Upcoming tournament weekend banner per
// HOME_DESIGN_SPEC §1.1.10. Renders a single banner (not a list)
// for the soonest tournament starting within 72h on any of the
// parent's kids' teams.
//
// V1 ships the medium-default visual abbreviated to the essentials:
// trophy icon eyebrow, tournament name, dates · venue, link to
// tournament detail page. Per-day schedule + hotel block + weather +
// driving directions ship in a follow-up alongside the full
// HOME_DESIGN_SPEC §1.1.10 maximum-density variant.
//
// Visibility: hidden when tournament is null (no tournament in 72h).

import { Link } from 'react-router-dom';

function formatDateRange(startIso, endIso) {
  if (!startIso) return '';
  const parse = (s) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (!m) return null;
    return new Date(Date.UTC(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10), 12, 0, 0));
  };
  const fmt = (d) => d?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const start = parse(startIso);
  const end = parse(endIso);
  if (!start) return '';
  if (!end || end.getTime() === start.getTime()) return fmt(start);
  // Same month: "Apr 26–27". Different month: "Apr 30 – May 1".
  if (start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear()) {
    const startMonth = start.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    return `${startMonth} ${start.getUTCDate()}–${end.getUTCDate()}`;
  }
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function TournamentWeekendBanner({ tournament }) {
  if (!tournament) return null;

  const dates = formatDateRange(tournament.start_date, tournament.end_date);
  const venue = tournament.primary_venue || '';
  const meta = [dates, venue].filter(Boolean).join(' · ');

  return (
    <Link
      to={`/tournaments/${tournament.id}`}
      aria-label={`Upcoming tournament: ${tournament.name}`}
      className="em-press"
      style={{
        display: 'block',
        padding: '14px 16px',
        backgroundColor: 'var(--em-accent-soft)',
        border: '1px solid var(--em-accent)',
        borderLeft: '4px solid var(--em-accent)',
        borderRadius: 10,
        color: 'var(--em-text-primary)',
        textDecoration: 'none',
        boxShadow: 'var(--em-shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span aria-hidden="true" style={{ fontSize: 14 }}>🏆</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--em-accent)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Tournament weekend
        </span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--em-text-primary)', lineHeight: 1.3 }}>
        {tournament.name}
      </div>
      {meta && (
        <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginTop: 4 }}>
          {meta}
        </div>
      )}
    </Link>
  );
}
