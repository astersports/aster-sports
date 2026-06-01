import { useState } from 'react';
import { Send } from 'lucide-react';

export default function ComposeBar({ onSend, placeholder, disabled }) {
  const [draft, setDraft] = useState('');
  const canSend = draft.trim().length > 0 && !disabled;

  const send = async () => {
    if (!canSend) return;
    const text = draft;
    setDraft('');
    const ok = await onSend(text);
    if (!ok) setDraft(text);
  };

  return (
    <div style={{
      display: 'flex', gap: 8, padding: '8px 16px',
      borderTop: '1px solid var(--as-border-default)',
      backgroundColor: 'var(--as-bg-card)',
    }}>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
        placeholder={placeholder || 'Write a message...'}
        disabled={disabled}
        style={{
          flex: 1, minHeight: 44, padding: '0 14px', borderRadius: 10,
          border: '1px solid var(--as-border-default)',
          backgroundColor: 'var(--as-bg-card)', fontSize: 15,
          color: 'var(--as-text-primary)', fontFamily: 'inherit',
        }}
      />
      <button
        type="button"
        onClick={send}
        disabled={!canSend}
        className="as-press"
        aria-label="Send message"
        style={{
          width: 44, height: 44, borderRadius: 10, border: 'none',
          backgroundColor: canSend ? 'var(--as-accent)' : 'var(--as-bg-tertiary)',
          color: canSend ? 'var(--as-text-inverse)' : 'var(--as-text-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: canSend ? 'pointer' : 'default',
        }}
      >
        <Send size={18} strokeWidth={1.75} />
      </button>
    </div>
  );
}
