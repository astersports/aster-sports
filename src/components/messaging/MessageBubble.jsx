import { useAuth } from '../../context/AuthContext';

export default function MessageBubble({ message, isAnnouncement }) {
  const { user } = useAuth();
  const isMine = message.sender_id === user?.id;

  const time = new Date(message.created_at).toLocaleString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });

  if (isAnnouncement) {
    return (
      <div style={{
        padding: '12px 16px', borderRadius: 10,
        backgroundColor: 'var(--em-accent-soft)',
        border: '1px solid var(--em-accent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--em-accent)' }}>{message.sender_name}</span>
          <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)' }}>{time}</span>
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.5, whiteSpace: 'pre-wrap', color: 'var(--em-text-primary)' }}>{message.body}</div>
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
      <div style={{
        maxWidth: '80%', padding: '10px 14px', borderRadius: 14,
        backgroundColor: isMine ? 'var(--em-accent)' : 'var(--em-bg-card)',
        border: isMine ? 'none' : '1px solid var(--em-border-default)',
        boxShadow: 'var(--em-shadow-sm)',
      }}>
        <div style={{
          fontSize: 15, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          color: isMine ? 'var(--em-text-inverse)' : 'var(--em-text-primary)',
        }}>{message.body}</div>
      </div>
      <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)', marginTop: 2, paddingLeft: 4, paddingRight: 4 }}>{time}</span>
    </div>
  );
}
