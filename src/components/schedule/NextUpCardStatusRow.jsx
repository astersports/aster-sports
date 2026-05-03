// src/components/schedule/NextUpCardStatusRow.jsx
// Inline status pills for ride + duty visibility on NextUpCard.
// Replaces the previous separate-row footers with a single horizontal
// row of color-tinted pills. Returns null when there's nothing to show.

import { Car, Users } from 'lucide-react';

const PILL = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  fontSize: 13, fontWeight: 500,
  padding: '2px 6px', borderRadius: 8,
};
const WARN = { ...PILL, backgroundColor: 'var(--em-warning-soft)', color: 'var(--em-warning)' };
const OK   = { ...PILL, backgroundColor: 'var(--em-success-soft)', color: 'var(--em-success)' };

export default function NextUpCardStatusRow({ rideCount, dutyCount }) {
  const ridePill = rideCount?.requests > 0 ? (
    <span style={WARN}><Car size={12} strokeWidth={1.75} />
      {rideCount.requests} ride{rideCount.requests !== 1 ? 's' : ''} needed</span>
  ) : rideCount?.offers > 0 ? (
    <span style={OK}><Car size={12} strokeWidth={1.75} />
      {rideCount.offers} seat{rideCount.offers !== 1 ? 's' : ''} offered</span>
  ) : null;

  const open = (dutyCount?.total ?? 0) - (dutyCount?.claimed ?? 0);
  const dutyPill = dutyCount?.total > 0 && open > 0 ? (
    <span style={WARN}><Users size={12} strokeWidth={1.75} />
      {open} volunteer{open !== 1 ? 's' : ''} needed</span>
  ) : dutyCount?.total > 0 ? (
    <span style={OK}><Users size={12} strokeWidth={1.75} /> volunteers ready</span>
  ) : null;

  if (!ridePill && !dutyPill) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {ridePill}
      {dutyPill}
    </div>
  );
}
