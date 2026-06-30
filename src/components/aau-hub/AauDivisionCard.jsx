// One division on a tournament's public Hub detail (R1·PR-A). Presentational —
// the tournament page wraps it in a Link to the division detail page (Standings /
// Schedule / Bracket tabs). Renders the division name + team count + advance
// cutoff. --as-* tokens, no hardcoded hex.

export default function AauDivisionCard({ division }) {
  const d = division || {};
  const teamCount = (Array.isArray(d.teams) ? d.teams.length : 0) || d.team_count || 0;
  const meta = [
    teamCount ? `${teamCount} team${teamCount !== 1 ? 's' : ''}` : null,
    d.advance_count ? `Top ${d.advance_count} advance` : null,
  ].filter(Boolean).join(' · ');

  return (
    <article style={{ backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, boxShadow: 'var(--as-shadow-sm)', padding: 16, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 600, lineHeight: 1.3, color: 'var(--as-text-primary)' }}>{d.name || 'Division'}</span>
        {meta && <span style={{ display: 'block', margin: '4px 0 0', fontSize: 13, color: 'var(--as-text-secondary)' }}>{meta}</span>}
      </span>
      <span aria-hidden="true" style={{ flexShrink: 0, fontSize: 18, color: 'var(--as-text-tertiary)' }}>›</span>
    </article>
  );
}
