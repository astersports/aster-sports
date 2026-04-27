// src/components/ride/ClaimerRow.jsx
// Phase D.2 Ship 4 — one claimer row, rendered inside OfferCard for driver's view.
// Shows: rider name + child (if present) + status pill + pickup address/notes.
// Pure display — no actions in v1 (Phase D.3 adds confirm/decline buttons).

import { MapPin } from 'lucide-react';
import ClaimStatusPill from './ClaimStatusPill';

export default function ClaimerRow({ claim, riderName, childName }) {
  const showPickup = claim.pickup_address || claim.pickup_notes;
  return (
    <div style={{ padding: '6px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--em-text-primary)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {riderName}
        </span>
        {childName && (
          <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)', whiteSpace: 'nowrap' }}>
            for {childName}
          </span>
        )}
        <span style={{ flex: 1 }} />
        <ClaimStatusPill claim={claim} />
      </div>
      {showPickup && (
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'flex-start', gap: 4, fontSize: 12, color: 'var(--em-text-secondary)' }}>
          <MapPin size={11} strokeWidth={1.75} color="var(--em-text-tertiary)" aria-hidden="true" style={{ marginTop: 2, flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            {claim.pickup_address}
            {claim.pickup_address && claim.pickup_notes && ' — '}
            {claim.pickup_notes && <span style={{ color: 'var(--em-text-tertiary)', fontStyle: 'italic' }}>{claim.pickup_notes}</span>}
          </span>
        </div>
      )}
    </div>
  );
}
