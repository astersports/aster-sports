import { useState, useRef, useCallback, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MessageBubble({ message, isAnnouncement, onDelete }) {
  const { user, role } = useAuth();
  const isMine = message.sender_id === user?.id;
  const canDelete = isMine || role === 'admin';
  const [showActions, setShowActions] = useState(false);
  const timerRef = useRef(null);
  const movedRef = useRef(false);

  const time = new Date(message.created_at).toLocaleString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });

  const startPress = useCallback(() => {
    if (!canDelete || !onDelete) return;
    movedRef.current = false;
    timerRef.current = setTimeout(() => {
      if (!movedRef.current) { navigator.vibrate?.(20); setShowActions(true); }
    }, 500);
  }, [canDelete, onDelete]);

  const cancelPress = useCallback(() => { clearTimeout(timerRef.current); }, []);
  const onMove = useCallback(() => { movedRef.current = true; clearTimeout(timerRef.current); }, []);

  useEffect(() => {
    if (!showActions) return;
    const dismiss = () => setShowActions(false);
    const t = setTimeout(() => document.addEventListener('pointerdown', dismiss, { once: true }), 50);
    return () => { clearTimeout(t); document.removeEventListener('pointerdown', dismiss); };
  }, [showActions]);

  if (isAnnouncement) {
    return (
      <div
        onPointerDown={canDelete ? startPress : undefined}
        onPointerUp={cancelPress} onPointerLeave={cancelPress} onPointerMove={onMove}
        style={{
          padding: '12px 16px', borderRadius: 10, position: 'relative',
          backgroundColor: 'var(--em-accent-soft)',
          border: '1px solid var(--em-accent)', userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--em-accent)' }}>{message.sender_name}</span>
          <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)' }}>{time}</span>
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.5, whiteSpace: 'pre-wrap', color: 'var(--em-text-primary)' }}>{message.body}</div>
        {showActions && <DeleteBtn onDelete={() => { onDelete(message.id); setShowActions(false); }} />}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
      {!isMine && (
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--em-text-secondary)', marginBottom: 2, paddingLeft: 4 }}>
          {message.sender_name}
        </span>
      )}
      <div
        onPointerDown={startPress} onPointerUp={cancelPress} onPointerLeave={cancelPress} onPointerMove={onMove}
        style={{
          maxWidth: '80%', padding: '10px 14px', borderRadius: 14, position: 'relative',
          backgroundColor: isMine ? 'var(--em-accent)' : 'var(--em-bg-card)',
          border: isMine ? 'none' : '1px solid var(--em-border-default)',
          boxShadow: 'var(--em-shadow-sm)', userSelect: 'none',
        }}
      >
        <div style={{
          fontSize: 15, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          color: isMine ? 'var(--em-text-inverse)' : 'var(--em-text-primary)',
        }}>{message.body}</div>
        {showActions && canDelete && <DeleteBtn onDelete={() => { onDelete(message.id); setShowActions(false); }} />}
      </div>
      <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)', marginTop: 2, paddingLeft: 4, paddingRight: 4 }}>{time}</span>
    </div>
  );
}

function DeleteBtn({ onDelete }) {
  return (
    <button
      type="button" onClick={onDelete} className="sf-press" aria-label="Delete message"
      style={{
        position: 'absolute', top: -16, right: -16,
        width: 36, height: 36, borderRadius: '50%',
        backgroundColor: 'var(--em-danger)', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', boxShadow: 'var(--em-shadow-md)',
      }}
    >
      <Trash2 size={16} strokeWidth={2} color="var(--em-text-inverse)" />
    </button>
  );
}
