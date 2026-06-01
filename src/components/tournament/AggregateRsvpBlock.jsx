// Wave 3.15 — aggregate RSVP block on TournamentDetailPage. Mirrors
// RsvpSummaryBlock from PR #45 but data shape differs (per-team
// breakdown instead of per-family roster join).

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useTournamentAggregateRsvp } from '../../hooks/useTournamentAggregateRsvp';

const wrap = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, padding: '14px 16px', margin: '12px 16px', boxShadow: 'var(--as-shadow-sm)' };
const headerRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', minHeight: 32, fontFamily: 'inherit', background: 'transparent', border: 'none', width: '100%', padding: 0, color: 'var(--as-text-primary)' };
const countsLine = { display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 16, fontWeight: 600 };
const sep = { color: 'var(--as-text-tertiary)', fontWeight: 400 };
const subtitleStyle = { fontSize: 12, color: 'var(--as-text-secondary)', marginTop: 4 };
const drawer = { marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 };
const teamRow = { display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 0', borderTop: '1px solid var(--as-border-subtle)' };
const teamLabel = { fontSize: 13, fontWeight: 600, color: 'var(--as-text-primary)' };
const teamCounts = { fontSize: 12, color: 'var(--as-text-secondary)' };

const TONE = { going: 'var(--as-success)', maybe: 'var(--as-warning)', not_going: 'var(--as-danger)' };

function CountSegment({ counts }) {
  const total = counts.going + counts.maybe + counts.not_going;
  if (!total) return <span style={{ color: 'var(--as-text-tertiary)' }}>no RSVPs</span>;
  return (
    <>
      <span style={{ color: TONE.going }}>{counts.going} going</span>
      {counts.maybe > 0 && (<><span style={sep}>·</span><span style={{ color: TONE.maybe }}>{counts.maybe} maybe</span></>)}
      {counts.not_going > 0 && (<><span style={sep}>·</span><span style={{ color: TONE.not_going }}>{counts.not_going} out</span></>)}
    </>
  );
}

export default function AggregateRsvpBlock({ tournamentId }) {
  const { totals, familyCount, teams, loading } = useTournamentAggregateRsvp({ tournamentId });
  const [expanded, setExpanded] = useState(false);
  const total = totals.going + totals.maybe + totals.not_going;

  if (loading && !total) return null;
  if (total === 0) {
    return <div style={wrap}><span style={{ fontSize: 14, color: 'var(--as-text-tertiary)' }}>no RSVPs yet</span></div>;
  }

  const teamCount = teams.length;
  return (
    <div style={wrap}>
      <button type="button" style={headerRow} className="as-press" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
        <span style={countsLine}><CountSegment counts={totals} /></span>
        {expanded ? <ChevronDown size={16} strokeWidth={1.75} color="var(--as-text-tertiary)" /> : <ChevronRight size={16} strokeWidth={1.75} color="var(--as-text-tertiary)" />}
      </button>
      <div style={subtitleStyle}>across {familyCount} {familyCount === 1 ? 'family' : 'families'} on {teamCount} {teamCount === 1 ? 'team' : 'teams'}</div>
      {expanded && (
        <div style={drawer}>
          {teams.map((t) => (
            <div key={t.team_id} style={teamRow}>
              <span style={teamLabel}>{t.team_name || 'Team'}</span>
              <span style={teamCounts}><CountSegment counts={t.counts} /> <span style={sep}>·</span> <span>{t.familyCount} {t.familyCount === 1 ? 'family' : 'families'}</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
