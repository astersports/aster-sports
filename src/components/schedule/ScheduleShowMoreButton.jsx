import { ChevronDown } from 'lucide-react';

// "See full schedule" footer button rendered below the filtered event
// list. Hidden when no remaining events to show.

export default function ScheduleShowMoreButton({ remaining, onClick }) {
  if (!remaining || remaining === 0) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="sf-press"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        width: '100%',
        minHeight: 44,
        marginTop: 16,
        borderRadius: 10,
        border: '1px solid var(--em-border-default)',
        backgroundColor: 'var(--em-bg-card)',
        color: 'var(--em-text-secondary)',
        fontSize: 15,
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      See full schedule ({remaining} more)
      <ChevronDown size={16} strokeWidth={1.75} />
    </button>
  );
}
