import { ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RideCard({ ride, user, onRemove, onClaim, eventLocation, eventEndAt }) {
  const { guardianId } = useAuth();
  const viewerGuardianId = guardianId;
  const authorName = user?.user_metadata?.full_name || user?.email;
  const isAuthor = ride.guardian_id
    ? ride.guardian_id === viewerGuardianId
    : ride.name === authorName;
  const canRemove = isAuthor;
  const showClaim = onClaim && ride.ride_type === 'offering' && !isAuthor;
  const mapsUrl = ride.pickup_location ? `https://maps.google.com/maps?q=${encodeURIComponent(ride.pickup_location)}` : null;

  return (
    <div style={{ backgroundColor: 'var(--sf-bg-card)', border: '1px solid var(--sf-border-default)', borderRadius: 10, padding: 12, marginBottom: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--sf-text-primary)', marginBottom: 4 }}>
        {ride.name} {ride.ride_type === 'offering' ? `is offering ${ride.seats} seat${ride.seats > 1 ? 's' : ''}` : `needs a ride for ${ride.seats}`}
      </div>
      {ride.phone && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <a href={`tel:${ride.phone}`} className="sf-press" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 36, borderRadius: 8, border: '1px solid var(--sf-border-default)', fontSize: 13, color: 'var(--sf-text-primary)', textDecoration: 'none' }}>
            Call
          </a>
          <a href={`sms:${ride.phone}`} className="sf-press" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 36, borderRadius: 8, border: '1px solid var(--sf-border-default)', fontSize: 13, color: 'var(--sf-text-primary)', textDecoration: 'none' }}>
            Text
          </a>
        </div>
      )}
      <div style={{ fontSize: 13, color: 'var(--sf-text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {ride.pickup_location && (
          <div>
            Pickup:{' '}
            <a href={mapsUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--sf-accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              {ride.pickup_location}
              <ExternalLink size={12} strokeWidth={1.75} />
            </a>
            {ride.departure_time ? `, ${new Date(ride.departure_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}
          </div>
        )}
        {eventLocation && <div>Drop-off: {eventLocation}</div>}
        {eventEndAt && <div>Est. return: {new Date(new Date(eventEndAt).getTime() + 15 * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>}
        {ride.notes && <div style={{ fontStyle: 'italic', color: 'var(--sf-text-tertiary)' }}>&ldquo;{ride.notes}&rdquo;</div>}
      </div>
      {showClaim && (
        <button type="button" onClick={() => onClaim(ride)} className="sf-press"
          style={{ marginTop: 8, fontSize: 13, color: 'var(--sf-accent)', minHeight: 36, padding: '0 10px', backgroundColor: 'var(--sf-accent-soft)', border: '1px solid var(--sf-accent)', borderRadius: 8, fontWeight: 500 }}>
          Claim seat
        </button>
      )}
      {canRemove && (
        <button type="button" onClick={() => onRemove(ride.id)} className="sf-press"
          style={{ marginTop: 8, fontSize: 13, color: 'var(--sf-danger)', minHeight: 36, padding: '0 8px', background: 'none', border: 'none' }}>
          Remove
        </button>
      )}
    </div>
  );
}
