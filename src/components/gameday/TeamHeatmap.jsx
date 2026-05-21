import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAttendanceData } from '../../hooks/useAttendanceData';
import { sortPlayersByOrder } from '../../lib/playerSort';
import CollapsibleSection from '../shared/CollapsibleSection';
import FilterSelect from '../shared/FilterSelect';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import TeamPulseScrollFade from './TeamPulseScrollFade';

const CELL_COLORS = {
  attended: { bg: 'var(--em-success)', border: 'none' },
  no_show: { bg: 'transparent', border: '2px solid var(--em-danger)', icon: '✕' },
  declined: { bg: 'var(--em-bg-tertiary)', border: 'none' },
  rsvp_yes: { bg: 'transparent', border: '2px solid var(--em-success)' },
  rsvp_maybe: { bg: 'transparent', border: '2px solid var(--em-warning)' },
  rsvp_no: { bg: 'var(--em-bg-tertiary)', border: 'none' },
  no_response: { bg: 'transparent', border: '1px solid var(--em-border-default)' },
  no_response_past: { bg: 'transparent', border: '1px dashed var(--em-border-default)' },
  not_applicable: { bg: 'var(--em-bg-secondary)', border: 'none', icon: '—' },
};

// 2026-05-21 (Teams audit A3) — readable status strings for SR aria-labels
// on Pulse grid cells (otherwise rendered as opaque colored squares).
const CELL_STATUS_LABELS = {
  attended: 'attended', no_show: 'did not attend', declined: 'declined',
  rsvp_yes: 'going', rsvp_maybe: 'maybe', rsvp_no: 'out',
  no_response: 'no response', no_response_past: 'no response', not_applicable: 'not applicable',
};

export default function TeamHeatmap({ teamId, range = 'season', onRangeToggle, sortOrder }) {
  const { role, myChildren } = useAuth();
  const [filter, setFilter] = useState('all');
  const { grid, events, loading } = useAttendanceData(teamId, filter, range);

  const myPlayerIds = role === 'parent' ? (myChildren || []).map((c) => c.playerId) : null;
  const filteredGrid = myPlayerIds ? grid.filter((r) => myPlayerIds.includes(r.player.id)) : grid;
  // 2026-05-21 (Teams PR C / Q10) — shared sort order with Roster. Default
  // "jersey" matches the Roster default; admin chip changes propagate via
  // the parent-supplied sortOrder prop. Sort impl is the canonical helper
  // in src/lib/playerSort.js (shared with useFilteredRoster).
  const visibleGrid = useMemo(
    () => sortPlayersByOrder(filteredGrid, sortOrder || 'jersey', {
      getPlayer: (row) => row.player,
      getAttendancePct: (row) => row.pct ?? -1,
    }),
    [filteredGrid, sortOrder],
  );

  if (loading) return <div style={{ padding: 16 }}><LoadingSkeleton variant="card" count={1} /></div>;

  const totalGoing = visibleGrid.reduce((s, r) => s + (r.goingCount || 0), 0);
  const totalResponses = visibleGrid.reduce((s, r) =>
    s + (r.goingCount || 0) + (r.maybeCount || 0) + (r.declinedCount || 0), 0);
  const totalPast = visibleGrid.reduce((s, r) => s + (r.totalPast || 0), 0);
  const teamPct = totalPast > 0 ? Math.round((totalGoing / totalPast) * 100) : 0;
  const responseRate = totalPast > 0 ? (totalResponses / totalPast) * 100 : 0;
  const rangeLabel = range === '4weeks' ? 'last 4 weeks' : 'season';

  // 2026-05-20 — was "Team Pulse · 3%" which reads ambiguously (% of what?).
  // Suffix makes the metric explicit: percent of past RSVPs that were
  // "Going" responses. Parent view filters to their own kid only, so the
  // "Team" prefix doesn't apply.
  // 2026-05-21 (Teams PR A / B1) — gate the % on enough signal. With sparse
  // data ("3% Going · 97% NR" with 1 of 13 families responding) the metric
  // misleads. Below threshold render "Not enough data yet" — chips stay.
  const enoughData = responseRate >= 50 && totalPast >= 2;
  const pulseLabel = role === 'parent' ? 'RSVP Pulse' : 'Team Pulse';
  const pulseTitle = enoughData
    ? `${pulseLabel} · ${teamPct}% Going`
    : `${pulseLabel} · Not enough data yet`;
  return (
    <CollapsibleSection title={pulseTitle} sectionKey="heatmap" defaultOpen={false}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 8px' }}>
        <button type="button" onClick={onRangeToggle} className="sf-press" style={{
          fontSize: 12, fontWeight: 500, color: 'var(--em-accent)', background: 'var(--em-accent-soft)',
          border: 'none', borderRadius: 6, padding: '4px 10px', minHeight: 28,
        }}>
          {rangeLabel}
        </button>
        {role !== 'parent' && (
          <FilterSelect
            value={filter}
            onChange={(v) => setFilter(v || 'all')}
            options={[{ value: 'all', label: 'All' }, { value: 'practices', label: 'Practice' }, { value: 'games', label: 'Games' }]}
            ariaLabel="Filter event type"
          />
        )}
      </div>

      <TeamPulseScrollFade>
        <div role="grid" aria-label={`${pulseLabel} attendance grid — ${rangeLabel}, ${visibleGrid.length} ${visibleGrid.length === 1 ? 'player' : 'players'} across ${events.length} ${events.length === 1 ? 'event' : 'events'}`} style={{ display: 'grid', gridTemplateColumns: `140px repeat(${events.length}, 32px) 80px`, gap: 3, alignItems: 'center' }}>
          <div role="columnheader" style={{ fontSize: 10, fontWeight: 600, color: 'var(--em-text-tertiary)' }}>Player</div>
          {events.map((e) => (
            <div key={e.id} role="columnheader" style={{ fontSize: 9, color: 'var(--em-text-tertiary)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {new Date(e.start_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', timeZone: 'America/New_York' })}
            </div>
          ))}
          <div role="columnheader" style={{ fontSize: 10, fontWeight: 600, color: 'var(--em-text-tertiary)', textAlign: 'right' }}>ATT%</div>

          {visibleGrid.map((row) => (
            <div key={row.player.id} role="row" style={{ display: 'contents' }}>
              <div role="rowheader" style={{ fontSize: 13, fontWeight: 500, color: 'var(--em-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)', marginRight: 4 }}>#{row.player.jersey_number || '—'}</span>
                {row.player.first_name}
              </div>
              {row.cells.map((c, i) => {
                const s = CELL_COLORS[c.state] || CELL_COLORS.no_response;
                const evt = events[i];
                const evtLabel = evt ? `${evt.title || 'Event'} — ${new Date(evt.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })}` : 'Event';
                return (
                  <div key={evt?.id || i} role="gridcell" aria-label={`${row.player.first_name} — ${evtLabel} — ${CELL_STATUS_LABELS[c.state] || 'no response'}`} style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: s.bg, border: s.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--em-danger)' }}>
                    {s.icon || ''}
                  </div>
                );
              })}
              <div role="gridcell" aria-label={`${row.player.first_name} attendance ${row.pct != null ? `${row.pct} percent` : 'no data'}${row.streak >= 3 ? `, ${row.streak} event streak` : ''}`} style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: row.pct !== null && row.pct < 60 ? 'var(--em-danger)' : row.pct !== null && row.pct >= 80 ? 'var(--em-success)' : 'var(--em-text-primary)' }}>{row.pct != null ? `${row.pct}%` : '—'}</span>
                {row.streak >= 3 && <div style={{ fontSize: 11, color: 'var(--em-warning)' }}>🔥 {row.streak}</div>}
              </div>
            </div>
          ))}
        </div>
      </TeamPulseScrollFade>
    </CollapsibleSection>
  );
}
