import { MapPin, User } from 'lucide-react';
import Button from '../shared/Button';

export default function RideRequestCard({ request, requesterName, childName, isMine, onCancel }) {
  if (request.status !== 'open') return null;
  const label = childName
    ? `${requesterName} — ${childName}`
    : requesterName;
  return (
    <div style={{
      padding: '12px 16px', backgroundColor: 'var(--em-bg-card)',
      border: '1px solid var(--em-border-default)', borderRadius: 10, marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <User size={15} strokeWidth={1.75} color="var(--em-warning)" />
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)' }}>
          {label} needs a ride
        </span>
        <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)', marginLeft: 'auto' }}>
          {request.seats_needed} seat{request.seats_needed !== 1 ? 's' : ''}
        </span>
      </div>
      {request.pickup_address && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--em-text-secondary)' }}>
          <MapPin size={11} strokeWidth={1.75} color="var(--em-text-tertiary)" />
          {request.pickup_address}
        </div>
      )}
      {request.notes && <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)', fontStyle: 'italic', marginTop: 4 }}>{request.notes}</div>}
      {isMine && (
        <div style={{ marginTop: 8 }}>
          <Button size="sm" variant="ghost" onClick={() => onCancel?.(request.id)} style={{ color: 'var(--em-danger)' }}>Cancel request</Button>
        </div>
      )}
    </div>
  );
}
