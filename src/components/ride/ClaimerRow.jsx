import { MapPin } from 'lucide-react';
import ClaimStatusPill from './ClaimStatusPill';
import Button from '../shared/Button';

export default function ClaimerRow({ claim, riderName, childName, isDriver, onConfirm, onDecline }) {
  const showPickup = claim.pickup_address || claim.pickup_notes;
  const showActions = isDriver && claim.status === 'pending';
  return (
    <div style={{ padding: '6px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--em-text-primary)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {riderName}
        </span>
        {childName && (
          <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)', whiteSpace: 'nowrap' }}>
            for {childName}
          </span>
        )}
        <span style={{ flex: 1 }} />
        <ClaimStatusPill claim={claim} />
      </div>
      {showPickup && (
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'flex-start', gap: 4, fontSize: 13, color: 'var(--em-text-secondary)' }}>
          <MapPin size={11} strokeWidth={1.75} color="var(--em-text-tertiary)" aria-hidden="true" style={{ marginTop: 2, flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            {claim.pickup_address}
            {claim.pickup_address && claim.pickup_notes && ' — '}
            {claim.pickup_notes && <span style={{ color: 'var(--em-text-tertiary)', fontStyle: 'italic' }}>{claim.pickup_notes}</span>}
          </span>
        </div>
      )}
      {showActions && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button size="sm" onClick={() => onConfirm?.(claim.id)} style={{ flex: 1 }}>Confirm</Button>
          <Button size="sm" variant="ghost" onClick={() => onDecline?.(claim.id)} style={{ flex: 1, color: 'var(--em-danger)' }}>Decline</Button>
        </div>
      )}
    </div>
  );
}
