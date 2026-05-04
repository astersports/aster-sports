import { Megaphone, Users } from 'lucide-react';
import { formatRelativeTime } from '../../lib/formatters';

export default function ChannelList({ channels, activeKey, onSelect, previews, reads }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {channels.map((ch) => {
        const active = ch.key === activeKey;
        const Icon = ch.channel === 'announcement' ? Megaphone : Users;
        const preview = previews?.[ch.key];
        const lastRead = reads?.[ch.key];
        const hasUnread = preview?.time && (!lastRead || preview.time > lastRead);
        return (
          <button
            key={ch.key}
            type="button"
            onClick={() => { navigator.vibrate?.(10); onSelect(ch); }}
            className="sf-press"
            aria-label={ch.label}
            aria-current={active ? 'page' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              borderRadius: 10, border: 'none', width: '100%', textAlign: 'left',
              fontFamily: 'inherit', cursor: 'pointer',
              backgroundColor: active ? 'var(--em-accent-soft)' : 'transparent',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0, position: 'relative',
              backgroundColor: ch.color || 'var(--em-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={18} strokeWidth={1.75} color="var(--em-text-inverse)" />
              {hasUnread && (
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  width: 10, height: 10, borderRadius: '50%',
                  backgroundColor: 'var(--em-danger)',
                  border: '2px solid var(--em-bg-page)',
                }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: 15, fontWeight: hasUnread ? 700 : active ? 600 : 500,
                  color: active ? 'var(--em-accent)' : 'var(--em-text-primary)',
                }}>{ch.label}</span>
                {preview && (
                  <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)', flexShrink: 0 }}>
                    {formatRelativeTime(preview.time)}
                  </span>
                )}
              </div>
              {preview && (
                <div style={{
                  fontSize: 13, color: hasUnread ? 'var(--em-text-secondary)' : 'var(--em-text-tertiary)', marginTop: 2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontWeight: hasUnread ? 600 : 400,
                }}>
                  <span style={{ fontWeight: 500 }}>{preview.sender}:</span> {preview.body}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
