import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHomeRole } from '../../hooks/useHomeRole';
import { isSparseRsvp } from '../../hooks/useSparseRsvp';
import GuardianRow from './GuardianRow';
import PlayerRowActions from './PlayerRowActions';
import { paymentSignal } from '../../lib/roster/paymentSignal';

const NOW = Date.now();

export default function PlayerRow({ player, teamColor, isLast, isMyChild }) {
  const [expanded, setExpanded] = useState(isMyChild);
  const { role } = useAuth();
  // Money signal gates on the PREVIEW role (activeRole), not the real role, so
  // "view as coach" faithfully hides it (Frank 2026-06-19). Real coaches/parents
  // never have activeRole='admin'. Row ACTIONS (InviteButton) still use realRole.
  const { activeRole } = useHomeRole();
  const initial = (player.last_name || player.first_name || '?').charAt(0).toUpperCase();
  // §11.5: academy status is per-team (team_players.roster_type), falling back
  // to the global members flag only when roster_type is absent (Cat#30 ROSTER-3).
  const isAcademy = player.roster_type ? player.roster_type === 'futures' : player.member_type === 'futures_academy';
  const guardians = player.guardians || [];
  // Admin-only payment signal from family_balances (A.4: coach has no money
  // RLS; A.6: never roster_members.amount_paid). pastDue=false until PR-3.
  const sig = paymentSignal(player.balance_cents);
  const age = useMemo(() => player.dob ? Math.floor((NOW - new Date(player.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null, [player.dob]);
  const PILL = { fontSize: 11, fontWeight: 500, padding: '1px 5px', borderRadius: 4, lineHeight: '16px' };
  const showRsvp = player.totalPast > 0 && (role !== 'parent' || isMyChild);
  const useCount = player.totalPast < 5;
  // Frank-reported 2026-05-20 L99 v6 §5.1 B4: roster row showed
  // "3% Going · 97% NR" with sparse RSVP data. The %s are misleading
  // when the family has only submitted 0-1 responses across all past
  // events. Render "No RSVPs yet" empty state instead so the row
  // reads honestly until real signal accumulates.
  // Teams PR B / C1: detector extracted to isSparseRsvp shared helper
  // (pure function) so PlayerRow + MyChildSpotlight + TeamDetailHero
  // stay in sync.
  const sparseRsvp = isSparseRsvp(player);

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--as-border-subtle)', borderLeft: isMyChild ? '3px solid var(--as-accent)' : 'none', backgroundColor: isMyChild ? 'var(--as-accent-soft)' : undefined }}>
      <div
        role="button" tabIndex={0} aria-expanded={expanded}
        className="flex items-center as-press"
        onClick={() => { navigator.vibrate?.(10); setExpanded((v) => !v); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((v) => !v); } }}
        onTouchStart={(e) => { e.currentTarget.style.backgroundColor = `${teamColor}08`; }}
        onTouchEnd={(e) => { e.currentTarget.style.backgroundColor = isMyChild ? '' : 'transparent'; }}
        style={{ padding: '10px 16px', minHeight: 56, transition: 'background-color 150ms ease-out' }}
      >
        {/* 2026-05-21 (Teams PR C / V6 / Q11(a)) — futures-academy rows
            get a dashed purple border on the avatar. Minimal visual,
            non-academy rows render identically (no extra border) so the
            treatment doesn't add noise to the common case. */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%', backgroundColor: teamColor || 'var(--as-neutral)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--as-text-inverse)', fontSize: 15, fontWeight: 700, flexShrink: 0,
          border: isAcademy ? '2px dashed var(--as-academy)' : undefined,
          boxSizing: 'border-box',
        }}>{initial}</div>
        <div style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
          <div className="flex items-center gap-2">
            <div className="font-semibold truncate" style={{ color: 'var(--as-text-primary)', fontSize: 15 }}>
              {player.first_name} {player.last_name}
            </div>
            {activeRole === 'admin' && (
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: sig.dot, flexShrink: 0 }}
                title={sig.label} aria-label={`Payment: ${sig.label}`} />
            )}
          </div>
          <div className="flex items-center gap-1" style={{ marginTop: 2 }}>
            {isAcademy && <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, backgroundColor: 'var(--as-academy-soft)', color: 'var(--as-academy)' }}>Academy</span>}
            {(role === 'admin' || role === 'coach') && player.grade && <span style={{ fontSize: 11, fontWeight: 500, padding: '1px 6px', borderRadius: 4, backgroundColor: 'var(--as-bg-secondary)', color: 'var(--as-text-secondary)' }}>{ordinalGrade(player.grade)}</span>}
            {(role === 'admin' || role === 'coach') && age != null && <span style={{ fontSize: 11, fontWeight: 500, padding: '1px 6px', borderRadius: 4, backgroundColor: 'var(--as-bg-secondary)', color: 'var(--as-text-secondary)' }}>{age}y</span>}
          </div>
          {/* 2026-05-21 (Teams PR A / C3) — sparse-RSVP diagnostic was a
              full pill (~same weight as Going/Maybe/No counts). Lowered to
              a tertiary-color asterisk so the row reads as "no signal yet"
              rather than as one more pill competing for attention. */}
          {showRsvp && sparseRsvp && (
            <div className="flex items-center gap-1" style={{ marginTop: 3 }}>
              <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--as-text-tertiary)' }} title="No RSVPs yet">* No RSVPs yet</span>
            </div>
          )}
          {showRsvp && !sparseRsvp && (
            <div className="flex items-center gap-1" style={{ marginTop: 3, flexWrap: 'wrap' }}>
              {player.goingCount > 0 && <span style={{ ...PILL, backgroundColor: 'var(--as-success-soft)', color: 'var(--as-success)' }}>{useCount ? player.goingCount : Math.round((player.goingCount / player.totalPast) * 100) + '%'} Going</span>}
              {player.maybeCount > 0 && <span style={{ ...PILL, backgroundColor: 'var(--as-warning-soft)', color: 'var(--as-warning)' }}>{useCount ? player.maybeCount : Math.round((player.maybeCount / player.totalPast) * 100) + '%'} Maybe</span>}
              {player.declinedCount > 0 && <span style={{ ...PILL, backgroundColor: 'var(--as-neutral-soft)', color: 'var(--as-text-secondary)' }}>{useCount ? player.declinedCount : Math.round((player.declinedCount / player.totalPast) * 100) + '%'} No</span>}
              {player.noResponseCount > 0 && <span style={{ ...PILL, backgroundColor: 'var(--as-bg-secondary)', color: 'var(--as-text-tertiary)' }}>{useCount ? player.noResponseCount : Math.round((player.noResponseCount / player.totalPast) * 100) + '%'} NR</span>}
              {player.streak >= 3 && <span style={{ fontSize: 11 }}>🔥 {player.streak}</span>}
            </div>
          )}
        </div>
        {activeRole === 'admin' && (Number(player.balance_cents) || 0) !== 0 && (
          <span style={{ fontSize: 13, fontWeight: 500, color: sig.labelColor, flexShrink: 0, marginLeft: 8, whiteSpace: 'nowrap' }}>{sig.label}</span>
        )}
        <PlayerRowActions jerseyNumber={player.jersey_number} teamColor={teamColor} expanded={expanded} />
      </div>
      {expanded && (guardians.length > 0 || role === 'admin') && (
        <div style={{ padding: '4px 16px 12px 68px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* 2026-05-20 — "No guardians linked" diagnostic copy is admin-only.
              Frank flagged on 11U Girls roster (parent view): Bianca's row
              showed the diagnostic to peer parents — privacy leak + reveals
              data-integrity state a non-admin can't act on. Admins still see
              it (and the invite affordance) since it's an actionable signal
              for them. */}
          {guardians.length === 0
            ? <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', fontStyle: 'italic' }}>No guardians linked</div>
            : guardians.map((g) => <GuardianRow key={g.id} guardian={g} role={role} />)}
        </div>
      )}
    </div>
  );
}

function ordinalGrade(g) {
  if (!g) return '';
  if (g === 1) return '1st';
  if (g === 2) return '2nd';
  if (g === 3) return '3rd';
  return `${g}th`;
}
