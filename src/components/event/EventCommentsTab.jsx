import { useState } from 'react';
import { Pin, Send } from 'lucide-react';
import Input from '../shared/Input';
import { useComments } from '../../hooks/useComments';
import LoadingSkeleton from '../shared/LoadingSkeleton';

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
      {loading && <LoadingSkeleton variant="text" count={3} />}
      {!loading && comments.length === 0 && (
        <div style={{ color: 'var(--em-text-tertiary)', fontSize: 15 }}>No comments yet. Start the conversation.</div>
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
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-primary)' }}>
              {c.author_name || 'User'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)' }}>
              {new Date(c.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })}
            </span>
          </div>
          <div style={{ fontSize: 15, color: 'var(--em-text-primary)', whiteSpace: 'pre-wrap' }}>{c.body}</div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <Input type="text" value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Write a comment..." />
        </div>
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
