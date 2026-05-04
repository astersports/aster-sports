import { useEffect, useRef } from 'react';
import { useMessages } from '../../hooks/useMessages';
import MessageBubble from './MessageBubble';
import ComposeBar from './ComposeBar';
import { useAuth } from '../../context/AuthContext';
import { isStaff } from '../../lib/permissions';

export default function MessageThread({ channel, onBack }) {
  const { role } = useAuth();
  const { messages, loading, send } = useMessages(channel.channel, channel.teamId);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const canPost = channel.channel === 'team' || (channel.channel === 'announcement' && isStaff(role));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
        borderBottom: '1px solid var(--em-border-default)',
      }}>
        <button
          type="button" onClick={onBack} className="sf-press" aria-label="Back to channels"
          style={{
            width: 36, height: 36, borderRadius: 10, border: 'none',
            backgroundColor: 'var(--em-bg-secondary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            fontSize: 18, color: 'var(--em-text-primary)',
          }}
        >←</button>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          backgroundColor: channel.color || 'var(--em-accent)',
        }} />
        <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)' }}>
          {channel.label}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && <div style={{ color: 'var(--em-text-tertiary)', fontSize: 14, padding: 12 }}>Loading messages…</div>}
        {!loading && messages.length === 0 && (
          <div style={{ color: 'var(--em-text-tertiary)', fontSize: 14, padding: 32, textAlign: 'center' }}>
            No messages yet. Start the conversation.
          </div>
        )}
        {messages.map((m) => <MessageBubble key={m.id} message={m} />)}
        <div ref={bottomRef} />
      </div>

      {canPost && <ComposeBar onSend={send} placeholder={channel.channel === 'announcement' ? 'Broadcast to all families…' : 'Message…'} />}
      {!canPost && (
        <div style={{
          padding: '12px 16px', textAlign: 'center', fontSize: 13,
          color: 'var(--em-text-tertiary)', borderTop: '1px solid var(--em-border-default)',
        }}>Announcements are posted by staff.</div>
      )}
    </div>
  );
}
