import { useCallback, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MessageBubble({ message, isAnnouncement, onDelete }) {
  const { user } = useAuth();
  const isMine = message.sender_id === user?.id;
  const [showActions, setShowActions] = useState(false);
  const timerRef = useRef(null);

  const time = new Date(message.created_at).toLocaleString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
  });

  const startPress = useCallback(() => {
    if (!isMine || !onDelete) return;
    timerRef.current = setTimeout(() => { navigator.vibrate?.(20); setShowActions(true); }, 500);
  }, [isMine, onDelete]);

  const endPress = useCallback(() => { clearTimeout(timerRef.current); }, []);

  if (isAnnouncement) {
    return (
      <div style={{
        padding: '12px 16px', borderRadius: 10,
        backgroundColor: 'var(--as-accent-soft)',
        border: '1px solid var(--as-accent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--as-accent)' }}>{message.sender_name}</span>
          <span style={{ fontSize: 11, color: 'var(--as-text-tertiary)' }}>{time}</span>
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.5, whiteSpace: 'pre-wrap', color: 'var(--as-text-primary)' }}>{message.body}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
      {!isMine && (
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--as-text-secondary)', marginBottom: 2, paddingLeft: 4 }}>
          {message.sender_name}
        </span>
      )}
      <div
        onPointerDown={startPress} onPointerUp={endPress} onPointerLeave={endPress}
        style={{
          maxWidth: '80%', padding: '10px 14px', borderRadius: 14, position: 'relative',
          backgroundColor: isMine ? 'var(--as-accent)' : 'var(--as-bg-card)',
          border: isMine ? 'none' : '1px solid var(--as-border-default)',
          boxShadow: 'var(--as-shadow-sm)', userSelect: 'none',
        }}
      >
        <div style={{
          fontSize: 15, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          color: isMine ? 'var(--as-text-inverse)' : 'var(--as-text-primary)',
        }}>{message.body}</div>
        {showActions && isMine && (
          <button
            type="button"
            onClick={() => { onDelete(message.id); setShowActions(false); }}
            className="as-press" aria-label="Delete message"
            style={{
              position: 'absolute', top: -12, right: -12,
              width: 28, height: 28, borderRadius: '50%',
              backgroundColor: 'var(--as-danger)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: 'var(--as-shadow-md)',
            }}
          >
            <Trash2 size={14} strokeWidth={2} color="var(--as-text-inverse)" />
          </button>
        )}
      </div>
      <span style={{ fontSize: 11, color: 'var(--as-text-tertiary)', marginTop: 2, paddingLeft: 4, paddingRight: 4 }}>{time}</span>
    </div>
  );
}
