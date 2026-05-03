import { useAuth } from '../../context/AuthContext';

export default function EventNotes({ notes, coachNotes }) {
  const { role } = useAuth();
  return (
    <div style={{ padding: '0 16px' }}>
      {notes && (
        <div style={{ fontSize: 15, color: 'var(--em-text-secondary)', marginBottom: 12 }}>
          <div style={{ fontWeight: 500, color: 'var(--em-text-primary)', marginBottom: 4, fontSize: 13 }}>Parent instructions</div>
          {notes}
        </div>
      )}
      {coachNotes && role !== 'parent' && (
        <div style={{ fontSize: 15, color: 'var(--em-text-secondary)' }}>
          <div style={{ fontWeight: 500, color: 'var(--em-warning)', marginBottom: 4, fontSize: 13 }}>Coach notes (not visible to parents)</div>
          {coachNotes}
        </div>
      )}
    </div>
  );
}
