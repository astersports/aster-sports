import { useAuth } from '../../context/AuthContext';

export default function EventNotes({ notes, coachNotes }) {
  const { role } = useAuth();
  return (
    <div style={{ padding: '0 16px' }}>
      {notes && (
        <div style={{ fontSize: 14, color: 'var(--sf-text-secondary)', marginBottom: 12 }}>
          <div style={{ fontWeight: 500, color: 'var(--sf-text-primary)', marginBottom: 4, fontSize: 13 }}>Parent instructions</div>
          {notes}
        </div>
      )}
      {coachNotes && role !== 'parent' && (
        <div style={{ fontSize: 14, color: 'var(--sf-text-secondary)' }}>
          <div style={{ fontWeight: 500, color: 'var(--sf-warning)', marginBottom: 4, fontSize: 13 }}>Coach notes (not visible to parents)</div>
          {coachNotes}
        </div>
      )}
    </div>
  );
}
