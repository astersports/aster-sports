import { useState } from 'react';
import { Send, Pin } from 'lucide-react';
import { useComments } from '../../hooks/useComments';

// Comments thread for an event. Pinned comments float to the top with
// a pin icon, then chronological oldest-first like a chat transcript.
// Text input at the bottom posts a new comment.
export default function EventCommentsTab({ eventId }) {
  const { comments, loading, post } = useComments(eventId);
  const [draft, setDraft] = useState('');

  const send = async () => {
    if (!draft.trim()) return;
    await post(draft);
    setDraft('');
  };

  return (
    <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {loading && <div style={{ color: 'var(--em-text-tertiary)', fontSize: 14 }}>Loading comments...</div>}
      {!loading && comments.length === 0 && (
        <div style={{ color: 'var(--em-text-tertiary)', fontSize: 14 }}>No comments yet. Start the conversation.</div>
      )}
      {comments.map((c) => (
        <div key={c.id} style={{
          backgroundColor: c.pinned ? 'var(--em-warning-soft)' : 'var(--em-bg-card)',
          borderRadius: 10,
          border: '1px solid ' + (c.pinned ? 'var(--em-warning)' : 'var(--em-border-default)'),
          padding: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            {c.pinned && <Pin size={12} strokeWidth={2} color="var(--em-warning)" />}
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--em-text-primary)' }}>
              {c.author_name || 'User'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)' }}>
              {new Date(c.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--em-text-primary)', whiteSpace: 'pre-wrap' }}>{c.body}</div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Write a comment..."
          style={{
            flex: 1, minHeight: 44, padding: '0 14px', borderRadius: 10,
            border: '1px solid var(--em-border-default)',
            backgroundColor: 'var(--em-bg-card)', fontSize: 15,
            color: 'var(--em-text-primary)',
          }} />
        <button type="button" onClick={send} disabled={!draft.trim()} className="sf-press"
          aria-label="Send comment"
          style={{
            width: 44, height: 44, borderRadius: 10, border: 'none',
            backgroundColor: draft.trim() ? 'var(--em-accent)' : 'var(--em-bg-tertiary)',
            color: draft.trim() ? 'var(--em-text-inverse)' : 'var(--em-text-tertiary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <Send size={18} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
