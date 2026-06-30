// One division on a tournament's public Hub detail page (R1·PR-A). Pure
// presentational — receives one element of get_public_tournament_teams().divisions.
// Renders the division's structure only (name + team count + advance cutoff);
// the ranked standings inside are PR-B (held). --as-* tokens, no hardcoded hex.

export default function AauDivisionCard({ division }) {
  const d = division || {};
  const teamCount = Array.isArray(d.teams) ? d.teams.length : (d.team_count || 0);
  const meta = [
    teamCount ? `${teamCount} team${teamCount !== 1 ? 's' : ''}` : null,
    d.advance_count ? `Top ${d.advance_count} advance` : null,
  ].filter(Boolean).join(' · ');

  return (
    <article
      style={{
        backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
        borderRadius: 10, boxShadow: 'var(--as-shadow-sm)', padding: 16, minHeight: 44,
      }}
    >
      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.3, color: 'var(--as-text-primary)' }}>
        {d.name || 'Division'}
      </p>
      {meta && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--as-text-tertiary)' }}>{meta}</p>}
    </article>
  );
}
