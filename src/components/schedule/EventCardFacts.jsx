import { Check, Lock } from 'lucide-react';

// R2-2 (visual pass round 2, PR-V2): ONE facts line — chip confetti is
// retired. Gray when life is fine, amber 600 only when something needs
// you, violet for academy activation notes, accent only on the personal
// commitment. Data rides the useScheduleData batch (zero requests here).
export default function EventCardFacts({ suppressCount, isStaffView, count, rideCount, dutyCount, commitment, academyNames = [], compact }) {
  const fs = compact ? 12 : 13;
  const going = count?.going;
  const denom = count?.denominator;
  const requests = rideCount?.requests || 0;
  const offers = rideCount?.offers || 0;
  const dutiesOpen = dutyCount ? Math.max(0, dutyCount.total - dutyCount.claimed) : 0;

  const needs = [];
  if (requests > 0) needs.push(`${requests} ride${requests === 1 ? '' : 's'} needed`);
  if (dutiesOpen > 0) needs.push(`${dutiesOpen} volunteer${dutiesOpen === 1 ? '' : 's'} needed`);

  const showCount = denom > 0 && !(suppressCount && !isStaffView);
  const countText = showCount ? `${going} of ${denom} going` : null;
  const lines = [];

  if (suppressCount && !isStaffView) {
    // §10.1(2) privacy guard — tryout/eval rosters hide even the headcount.
    lines.push(
      <div key="lock" style={{ fontSize: fs, color: 'var(--as-text-tertiary)', marginTop: compact ? 4 : 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Lock size={12} strokeWidth={1.75} aria-hidden="true" />Counts hidden for evaluations
      </div>
    );
  } else if (needs.length > 0) {
    lines.push(
      <div key="needs" style={{ fontSize: fs, fontWeight: 600, color: 'var(--as-warning)', marginTop: compact ? 4 : 6 }}>
        {[countText, ...needs].filter(Boolean).join(' · ')}
      </div>
    );
  } else if (countText) {
    const fine = [countText];
    if (offers > 0) fine.push('rides covered');
    if (compact && commitment) fine.push(commitment);
    lines.push(
      <div key="fine" style={{ fontSize: fs, color: 'var(--as-text-tertiary)', marginTop: compact ? 4 : 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Check size={12} strokeWidth={1.75} aria-hidden="true" style={{ flexShrink: 0 }} />
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: compact ? 'nowrap' : 'normal' }}>{fine.join(' · ')}</span>
      </div>
    );
  }

  if (academyNames.length > 0) {
    const txt = compact
      ? `${academyNames.join(', ')} not activated`
      : `${academyNames.join(' and ')} ${academyNames.length === 1 ? "isn't" : "aren't"} activated for this game`;
    lines.push(
      <div key="academy" style={{ fontSize: fs, fontWeight: 500, color: 'var(--as-academy)', marginTop: compact ? 3 : 4 }}>{txt}</div>
    );
  }

  if (!compact && commitment) {
    lines.push(
      <div key="commit" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--as-accent)', backgroundColor: 'var(--as-accent-soft)', padding: '3px 8px', borderRadius: 6, marginTop: 7, alignSelf: 'flex-start' }}>
        <Check size={11} strokeWidth={1.75} aria-hidden="true" />{commitment}
      </div>
    );
  }

  return lines.length > 0 ? <>{lines}</> : null;
}
