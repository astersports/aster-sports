import { Car, Check, Lock, Users } from 'lucide-react';

// §10.1 glanceable chip row (SCHEDULE_L99_BUILD_SPEC §10, operator
// directive 2026-06-12). Renders below the location line at EVERY
// density. Chips are display-only (not tap targets, may sit under 44px;
// the RSVP control keeps the 44px floor). Data rides the useScheduleData
// batch — this component adds zero requests.
const chipBase = { fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' };
const amber = { backgroundColor: 'var(--as-warning-soft)', color: 'var(--as-warning)' };
const green = { backgroundColor: 'var(--as-success-soft)', color: 'var(--as-success)' };
const quiet = { backgroundColor: 'var(--as-neutral-soft)', color: 'var(--as-text-tertiary)' };

export default function EventCardChips({ isStaffView, suppressCount, count, rideCount, dutyCount, commitment }) {
  const going = count?.going ?? null;
  const requests = rideCount?.requests || 0;
  const offers = rideCount?.offers || 0;
  const dutiesUnfilled = dutyCount ? Math.max(0, dutyCount.total - dutyCount.claimed) : 0;
  const showLock = suppressCount && !isStaffView;
  const chips = [];

  // §10.1(2): aggregate counts are allowed where names are not — EXCEPT
  // Hidden-roster contexts (tryout/eval), where even a headcount is
  // sensitive. Staff counts are never suppressed (§10.4).
  if (showLock) {
    chips.push(
      <span key="lock" style={{ ...chipBase, ...quiet, fontWeight: 600 }}>
        <Lock size={12} strokeWidth={1.75} aria-hidden="true" />Counts hidden for evaluations
      </span>
    );
  } else if (going !== null) {
    chips.push(
      <span key="going" style={{ ...chipBase, ...green }}>
        <Users size={12} strokeWidth={1.75} aria-hidden="true" />
        {isStaffView && count.denominator > 0 ? `${going} going / ${count.denominator} rostered` : `${going} going`}
      </span>
    );
  }

  if (requests > 0) {
    chips.push(
      <span key="rides" style={{ ...chipBase, ...amber }}>
        <Car size={12} strokeWidth={1.75} aria-hidden="true" />{requests} ride{requests === 1 ? '' : 's'} needed
      </span>
    );
  } else if (offers > 0) {
    chips.push(
      <span key="rides-ok" style={{ ...chipBase, ...quiet, fontWeight: 600 }}>
        <Check size={12} strokeWidth={1.75} aria-hidden="true" />Rides covered
      </span>
    );
  }

  if (dutiesUnfilled > 0) {
    chips.push(
      <span key="duties" style={{ ...chipBase, ...amber }}>
        {dutiesUnfilled} volunteer{dutiesUnfilled === 1 ? '' : 's'} needed
      </span>
    );
  }

  if (chips.length === 0 && !commitment) return null;
  return (
    <>
      {chips.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>{chips}</div>}
      {commitment && (
        <div style={{ marginTop: 7, fontSize: 12, fontWeight: 600, color: 'var(--as-accent)', display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'var(--as-accent-soft)', padding: '4px 9px', borderRadius: 6 }}>
          <Check size={12} strokeWidth={1.75} aria-hidden="true" />{commitment}
        </div>
      )}
    </>
  );
}
