// RideIndicator — icon + count label for ride board state on event cards.
//
// Extracted from EventCard inline patterns per L99 platform audit P2.5 D4.
// The component covers two adjacent states:
//   - kind='requests' (warning color, "X ride(s) needed") — the unmet ask.
//   - kind='offers'   (secondary color, "X seat(s)")     — supply on hand.
//
// `urgent` flips the requests color from warning to danger when the lock
// deadline is close. `compact` shrinks padding + font for dense list rows.

import { Car } from 'lucide-react';

export default function RideIndicator({ count, kind = 'requests', urgent = false, compact = false }) {
  if (!count || count <= 0) return null;

  const isRequests = kind === 'requests';
  const label = isRequests
    ? `${count} ride${count !== 1 ? 's' : ''} needed`
    : `${count} seat${count !== 1 ? 's' : ''}`;

  const color = isRequests
    ? (urgent ? 'var(--em-danger)' : 'var(--em-warning)')
    : 'var(--em-text-secondary)';

  const iconSize = compact ? 11 : 12;
  const fontSize = compact ? 12 : 13;
  const fontWeight = isRequests ? 500 : 400;
  const gap = compact ? 4 : 6;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap, fontSize }}>
      <Car size={iconSize} strokeWidth={1.75} color={color} aria-hidden="true" />
      <span style={{ color, fontWeight }}>{label}</span>
    </span>
  );
}
