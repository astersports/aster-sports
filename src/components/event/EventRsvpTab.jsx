import RsvpSummary from '../rsvp/RsvpSummary';
import RsvpPlayerRow from '../rsvp/RsvpPlayerRow';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import { isGameType } from '../../lib/rsvpEligibility';

// RSVP tab — summary bar + one row per roster player with 3-button
// going/maybe/not-going selector. Thin wrapper around the existing
// RSVP components; kept as a tab so the page-level state can own
// the useRsvps hook and pass in the resulting data.
// 2026-05-20 — readOnly freezes the RSVP picker for past events. The
// academy-activation trio (canActivateAcademy / activatedSet /
// onToggleActivation) was added when the dedicated Academy Players
// panel was removed and the toggle moved inline onto academy RSVP rows.
// SD-11 (PR-B'): `overrideActive` = staff editing after start_at — shows
// the logged-edits hint; `auditMap` (playerId -> latest event_rsvp_audit
// row) renders the §16.8 "[Override · name · time]" marker per row.
// `summaryRoster` (PR-V1): the SD-6 ELIGIBLE set for the summary
// counts; the full roster keeps rendering rows (academy activation
// management lives there). Defaults to roster for legacy callers.
export default function EventRsvpTab({
  roster, summaryRoster, rsvps, rsvpMap, teamColor, onSetRsvp, onSaveNote, loading,
  readOnly = false, overrideActive = false, auditMap = {},
  canActivateAcademy = false, activatedSet, onToggleActivation, eventType,
}) {
  // D4 / SD-6 (operator-caught 2026-06-13): rows render for the FULL
  // roster (activation management lives here), but the RSVP control is
  // eligibility-gated — unactivated academy kids on game types get the
  // violet "Not activated" state, same as every other surface.
  const gameGated = isGameType(eventType);
  if (loading) {
    return <div style={{ padding: 16 }}><LoadingSkeleton variant="list" count={5} /></div>;
  }
  if (roster.length === 0) {
    return <div style={{ padding: 16, color: 'var(--as-text-tertiary)', fontSize: 15 }}>No players on this team yet.</div>;
  }
  const overrideMarker = (playerId) => {
    const a = auditMap[playerId];
    if (!a) return null;
    const at = new Date(a.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
    return `Override · ${a.actor_name || 'Staff'} · ${at}`;
  };

  const statusOrder = { going: 0, maybe: 1, not_going: 2 };
  const sorted = [...roster].sort((a, b) => {
    const aStatus = rsvpMap[a.id] || 'none';
    const bStatus = rsvpMap[b.id] || 'none';
    const aOrder = statusOrder[aStatus] ?? 3;
    const bOrder = statusOrder[bStatus] ?? 3;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.last_name.localeCompare(b.last_name);
  });

  const headerLabels = { going: 'Going', maybe: 'Maybe', not_going: 'Not Going', none: 'No Response' };

  return (
    <div style={{ padding: '16px 16px 32px' }}>
      <RsvpSummary roster={summaryRoster ?? roster} rsvps={rsvps} />
      {overrideActive && (
        <div role="status" style={{ fontSize: 12, fontWeight: 500, color: 'var(--as-warning)', backgroundColor: 'var(--as-warning-soft)', padding: '8px 10px', borderRadius: 6, marginBottom: 8 }}>
          RSVPs closed at start — staff edits are logged to the audit trail.
        </div>
      )}
      {sorted.map((player, i) => {
        const status = rsvpMap[player.id] || 'none';
        const prevStatus = i > 0 ? (rsvpMap[sorted[i - 1].id] || 'none') : null;
        const showHeader = i === 0 || status !== prevStatus;
        return (
          <div key={player.id}>
            {showHeader && (
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--as-text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: i > 0 ? 12 : 0, marginBottom: 4 }}>
                {headerLabels[status]}
              </div>
            )}
            <RsvpPlayerRow
              player={player}
              response={rsvpMap[player.id] || null}
              existingNote={rsvps.find((r) => r.player_id === player.id)?.comment || ''}
              teamColor={teamColor}
              onSetRsvp={onSetRsvp}
              onSaveNote={onSaveNote}
              forceReadOnly={readOnly}
              canActivateAcademy={canActivateAcademy}
              isActivated={activatedSet?.has(player.id) || false}
              onToggleActivation={onToggleActivation}
              rsvpEligible={player.member_type !== 'futures_academy' || !gameGated || (activatedSet?.has(player.id) || false)}
            />
            {overrideMarker(player.id) && (
              <div style={{ fontSize: 11, color: 'var(--as-text-tertiary)', padding: '0 0 6px 2px' }}>
                [{overrideMarker(player.id)}]
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
