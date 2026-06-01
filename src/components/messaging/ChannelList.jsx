import { Megaphone, Users } from 'lucide-react';
import { formatRelativeTime } from '../../lib/formatters';

export default function ChannelList({ channels, activeKey, onSelect, previews, reads }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {channels.map((ch) => {
        const active = ch.key === activeKey;
        const Icon = ch.channel === 'announcement' ? Megaphone : Users;
        const preview = previews?.[ch.key];
        const hasUnread = preview?.time && (!reads?.[ch.key] || preview.time > reads[ch.key]);
        return (
          <button
            key={ch.key}
            type="button"
            onClick={() => { navigator.vibrate?.(10); onSelect(ch); }}
            className="as-press"
            aria-label={ch.label}
            aria-current={active ? 'page' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              borderRadius: 10, border: 'none', width: '100%', textAlign: 'left',
              fontFamily: 'inherit', cursor: 'pointer',
              backgroundColor: active ? 'var(--as-accent-soft)' : 'transparent',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              backgroundColor: ch.color || 'var(--as-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={18} strokeWidth={1.75} color="var(--as-text-inverse)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 15, fontWeight: active ? 600 : (hasUnread ? 600 : 500),
                    color: active ? 'var(--as-accent)' : 'var(--as-text-primary)',
                  }}>{ch.label}</span>
                  {hasUnread && !active && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--as-accent)', flexShrink: 0 }} />}
                </div>
                {preview && (
                  <span style={{ fontSize: 11, color: 'var(--as-text-tertiary)', flexShrink: 0 }}>
                    {formatRelativeTime(preview.time)}
                  </span>
                )}
              </div>
              {preview && (
                <div style={{
                  fontSize: 13, color: 'var(--as-text-tertiary)', marginTop: 2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
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
