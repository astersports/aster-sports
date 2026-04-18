import { Calendar } from 'lucide-react';
import { downloadIcs } from '../../lib/icalHelpers';

export default function AddToCalendarButton({ event }) {
  if (!(new Date(event.start_at) > new Date())) return null;
  return (
    <button type="button" onClick={() => downloadIcs(event)} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      width: 'calc(100% - 32px)', margin: '0 16px 16px', minHeight: 44,
      borderRadius: 10, border: '1px solid var(--sf-border-default)',
      backgroundColor: 'var(--sf-bg-card)', color: 'var(--sf-accent)',
      fontSize: 14, fontWeight: 500,
    }}>
      <Calendar size={16} strokeWidth={1.75} />
      Add to Calendar
    </button>
  );
}
