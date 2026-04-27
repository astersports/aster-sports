// src/components/ride/ClaimStatusPill.jsx
// Phase 1.5 rides Phase B — colored chip showing claim status.
// Used inside OfferCard when current user has a claim on the offer,
// and inside ClaimCard list views in Phase D.

import { Check, Clock, AlertCircle, X, Ban } from 'lucide-react';

const STATUS_VARIANTS = {
  confirmed: { label: 'Confirmed', icon: Check, fg: 'var(--em-success)', bg: 'color-mix(in srgb, var(--em-success) 12%, transparent)' },
  pending: { label: 'Pending', icon: Clock, fg: 'var(--em-warning)', bg: 'color-mix(in srgb, var(--em-warning) 12%, transparent)' },
  waitlisted: { label: 'Waitlist', icon: AlertCircle, fg: 'var(--em-accent)', bg: 'color-mix(in srgb, var(--em-accent) 12%, transparent)' },
  declined: { label: 'Declined', icon: X, fg: 'var(--em-danger)', bg: 'color-mix(in srgb, var(--em-danger) 12%, transparent)' },
  cancelled: { label: 'Cancelled', icon: Ban, fg: 'var(--em-text-tertiary)', bg: 'var(--em-bg-secondary)' },
};

export default function ClaimStatusPill({ claim }) {
  if (!claim || !claim.status) return null;
  const variant = STATUS_VARIANTS[claim.status] ?? STATUS_VARIANTS.pending;
  const { label, icon: Icon, fg, bg } = variant;
  const labelText = claim.status === 'waitlisted' && claim.waitlist_position
    ? `${label} #${claim.waitlist_position}`
    : label;

  return (
    <span
      role="status"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        minHeight: 22,
        borderRadius: 999,
        backgroundColor: bg,
        color: fg,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      <Icon size={11} strokeWidth={1.75} aria-hidden="true" />
      {labelText}
    </span>
  );
}
