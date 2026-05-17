// Tier 3 v1 PR 6 — per-team roster snapshot for coach home.
//
// Renders one team's roster with attendance trend + missing-RSVP
// highlight for the next event. Uses useAttendanceData(teamId) for
// the trend grid + finds the next upcoming event from the grid's
// events list to detect missing RSVPs.
//
// Per Q3 lock (PR 6 pre-flight): per-team useAttendanceData call.
// Coach with N teams = N lookback queries on mount. Acceptable at
// Legacy scale (Kenny = 5 teams). v2 cost concern pinned in
// docs/TIER_3_V1_RETROSPECTIVE_NOTES.md.
//
// Visual treatments per Q4 lock (all three highlights):
//   - Section accent stripe by team color (left edge of header)
//   - Per-player highlight strip when RSVP missing for next event
//   - (Pulse/glow on NextEventCard is applied in CoachHomePage,
//     not here)

import { useMemo } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useAttendanceData } from '../../hooks/useAttendanceData';
import { useNow } from '../../hooks/useNow';

function trendArrow(pct) {
  if (pct == null) return null;
  if (pct >= 80) return { Icon: TrendingUp, color: 'var(--em-success)' };
  if (pct < 60) return { Icon: TrendingDown, color: 'var(--em-warning)' };
  return null;
}

export default function CoachRosterSnapshotTeam({ team }) {
  const { grid, events, loading } = useAttendanceData(team.id);
  const now = useNow();

  const nextEventId = useMemo(() => (events || [])
    .filter((e) => e.start_at && new Date(e.start_at).getTime() >= now)
    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))[0]?.id || null,
    [events, now]);

  if (loading && !grid?.length) return null;
  if (!grid?.length) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', borderRadius: 10, overflow: 'hidden',
      border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)',
    }}>
      <div style={{ width: 3, flexShrink: 0, backgroundColor: team.team_color || 'var(--em-neutral)' }} aria-hidden="true" />
      <div style={{ flex: 1, padding: 12, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 8 }}>{team.name}</div>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 4, listStyle: 'none', padding: 0, margin: 0 }}>
          {grid.slice(0, 6).map((row) => {
            const nextCell = nextEventId ? row.cells.find((c) => c.eventId === nextEventId) : null;
            const isMissingRsvp = nextCell?.state === 'no_response';
            const arrow = trendArrow(row.pct);
            return (
              <li key={row.player.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px',
                borderRadius: 6,
                backgroundColor: isMissingRsvp ? 'var(--em-warning-soft)' : 'transparent',
              }}>
                <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)', minWidth: 22, fontVariantNumeric: 'tabular-nums' }}>
                  {row.player.jersey_number || '—'}
                </span>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--em-text-primary)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.player.first_name} {row.player.last_name?.[0] || ''}
                </span>
                {arrow && <arrow.Icon size={12} strokeWidth={1.75} color={arrow.color} aria-hidden="true" />}
                <span style={{ fontSize: 12, color: 'var(--em-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                  {row.pct != null ? `${row.pct}%` : '—'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
