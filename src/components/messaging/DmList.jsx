import { User } from 'lucide-react';
import { formatRelativeTime } from '../../lib/formatters';

export default function DmList({ threads, onSelect }) {
  if (threads.length === 0) {
    return (
      <div style={{ color: 'var(--em-text-tertiary)', fontSize: 14, padding: '16px 0', textAlign: 'center' }}>
        No conversations yet. Tap + to start one.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {threads.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => { navigator.vibrate?.(10); onSelect(t); }}
          className="sf-press"
          aria-label={`Message ${t.otherName}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
            borderRadius: 10, border: 'none', width: '100%', textAlign: 'left',
            fontFamily: 'inherit', cursor: 'pointer', backgroundColor: 'transparent',
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            backgroundColor: 'var(--em-bg-tertiary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={18} strokeWidth={1.75} color="var(--em-text-tertiary)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--em-text-primary)' }}>{t.otherName}</span>
              {t.lastMessage && (
                <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)', flexShrink: 0 }}>
                  {formatRelativeTime(t.lastMessage.time || t.lastMessage.created_at)}
                </span>
              )}
            </div>
            {t.lastMessage && (
              <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.lastMessage.body}
              </div>
            )}
            <span style={{
              fontSize: 11, fontWeight: 500, color: 'var(--em-text-tertiary)',
              textTransform: 'capitalize', marginTop: 2, display: 'inline-block',
            }}>{t.otherRole}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
