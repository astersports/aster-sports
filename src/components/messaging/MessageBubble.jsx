import { useAuth } from '../../context/AuthContext';

export default function MessageBubble({ message }) {
  const { user } = useAuth();
  const isMine = message.sender_id === user?.id;

  const time = new Date(message.created_at).toLocaleString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: isMine ? 'flex-end' : 'flex-start',
    }}>
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
      <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)', marginTop: 2, paddingLeft: 4, paddingRight: 4 }}>
        {time}
      </span>
    </div>
  );
}
