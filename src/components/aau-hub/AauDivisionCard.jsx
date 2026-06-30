import { useState } from 'react';
import { Link } from 'react-router-dom';
import AauTrackButton from './AauTrackButton';

// One division on a tournament's public Hub detail (R1·PR-A). Tap the header to
// expand the division into its team list — each team links to that team's public
// schedule (the team_key the RPC carries IS the schedule route param + track key)
// with a Track star, so a parent can drill tournament -> division -> team and
// follow a team straight from here. Ranked standings styling stays PR-B (held);
// this is navigation + record meta only. --as-* tokens, no hardcoded hex.

const card = {
  backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
  borderRadius: 10, boxShadow: 'var(--as-shadow-sm)', overflow: 'hidden',
};
const headerBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  width: '100%', minHeight: 44, padding: 16, textAlign: 'left',
  background: 'none', border: 'none', cursor: 'pointer',
};
const rowWrap = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  padding: '10px 16px', borderTop: '1px solid var(--as-border-subtle)',
};
const teamName = { fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)' };

function TeamRow({ team }) {
  const record = `${team.wins ?? 0}–${team.losses ?? 0}`;
  const meta = [team.pool, record].filter(Boolean).join(' · ');
  const inner = (
    <>
      <span style={teamName}>{team.name || 'Team'}{team.isOurs ? ' ★' : ''}</span>
      {meta && <span style={{ display: 'block', marginTop: 2, fontSize: 13, color: 'var(--as-text-secondary)' }}>{meta}</span>}
    </>
  );
  return (
    <div style={rowWrap}>
      {team.team_key ? (
        <Link to={`/hub/team/${encodeURIComponent(team.team_key)}`}
          aria-label={`${team.name || 'Team'} schedule`}
          style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>{inner}</Link>
      ) : (
        <div style={{ flex: 1, minWidth: 0 }}>{inner}</div>
      )}
      {team.team_key && <AauTrackButton teamKey={team.team_key} name={team.name} />}
    </div>
  );
}

export default function AauDivisionCard({ division }) {
  const d = division || {};
  const teams = Array.isArray(d.teams) ? d.teams : [];
  const teamCount = teams.length || d.team_count || 0;
  const meta = [
    teamCount ? `${teamCount} team${teamCount !== 1 ? 's' : ''}` : null,
    d.advance_count ? `Top ${d.advance_count} advance` : null,
  ].filter(Boolean).join(' · ');
  const [open, setOpen] = useState(false);
  const canExpand = teams.length > 0;

  return (
    <article style={card}>
      <button
        type="button"
        onClick={() => canExpand && setOpen((o) => !o)}
        aria-expanded={canExpand ? open : undefined}
        disabled={!canExpand}
        style={{ ...headerBtn, cursor: canExpand ? 'pointer' : 'default' }}
      >
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 600, lineHeight: 1.3, color: 'var(--as-text-primary)' }}>
            {d.name || 'Division'}
          </span>
          {meta && <span style={{ display: 'block', marginTop: 4, fontSize: 13, color: 'var(--as-text-secondary)' }}>{meta}</span>}
        </span>
        {canExpand && (
          <span aria-hidden="true" style={{ flexShrink: 0, fontSize: 13, fontWeight: 600, color: 'var(--as-accent)' }}>
            {open ? 'Hide ▲' : 'Teams ▾'}
          </span>
        )}
      </button>
      {open && canExpand && (
        <div>
          {teams.map((tm, i) => <TeamRow key={tm.team_key || tm.id || i} team={tm} />)}
        </div>
      )}
    </article>
  );
}
