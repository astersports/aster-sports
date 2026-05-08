import { Car } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ChildRsvp from '../schedule/ChildRsvp';

export default function MyActionsSection({ event, myRideClaim, onRsvpChange }) {
  const { myChildren } = useAuth();
  const childrenOnTeam = (myChildren || []).filter((c) => c.teamIds?.includes(event.team_id) || c.teamId === event.team_id);
  const isPast = event.end_at ? new Date(event.end_at) < new Date() : false;
  if (childrenOnTeam.length === 0) return null;

  return (
    <div style={{ padding: '12px 16px', backgroundColor: 'var(--em-bg-card)', borderBottom: '1px solid var(--em-border-default)' }}>
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--em-text-tertiary)', marginBottom: 8 }}>
        MY RSVP
      </div>
      {childrenOnTeam.map((child) => (
        <ChildRsvp key={child.playerId} child={child} eventId={event.id} eventType={event.event_type} disabled={isPast} onSave={onRsvpChange} />
      ))}
      {myRideClaim && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--em-text-secondary)' }}>
          <Car size={13} strokeWidth={1.75} color="var(--em-text-tertiary)" />
          <span>Ride: <strong style={{ color: myRideClaim.status === 'confirmed' ? 'var(--em-success)' : myRideClaim.status === 'pending' ? 'var(--em-warning)' : 'var(--em-text-primary)' }}>{myRideClaim.status}</strong></span>
        </div>
      )}
      {!myRideClaim && (
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--em-text-tertiary)' }}>
          <a href="#rides" onClick={(e) => { e.preventDefault(); document.querySelector('[data-section="rides"]')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ color: 'var(--em-accent)', textDecoration: 'none' }}>
            Need a ride? Check available rides below
          </a>
        </div>
      )}
    </div>
  );
}
