import { MessageCircle, SearchX } from 'lucide-react';

// L99 enhancement: warm, brand-voice empty states (kindness microcopy §16.3).
// `mode` = 'no-results' (search returned nothing) | 'empty' (no channels/DMs at all).
export default function MessagesEmptyState({ mode = 'empty', query = '' }) {
  const isSearch = mode === 'no-results';
  const Icon = isSearch ? SearchX : MessageCircle;
  const title = isSearch ? 'Nothing matches that' : 'No conversations yet';
  const body = isSearch
    ? `We couldn't find anyone or anything for "${query}". Try a different name.`
    : 'Once your teams and coaches start chatting, it all shows up here.';

  return (
    <div
      role="status"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', padding: '40px 24px', gap: 10,
      }}
    >
      <div
        style={{
          width: 56, height: 56, borderRadius: '50%',
          backgroundColor: 'var(--as-bg-secondary)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon size={24} strokeWidth={1.75} color="var(--as-text-tertiary)" aria-hidden="true" />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)' }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', lineHeight: 1.5, maxWidth: 280 }}>
        {body}
      </div>
    </div>
  );
}
