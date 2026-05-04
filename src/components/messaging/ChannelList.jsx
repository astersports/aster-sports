import { Megaphone, Users } from 'lucide-react';

export default function ChannelList({ channels, activeKey, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {channels.map((ch) => {
        const active = ch.key === activeKey;
        const Icon = ch.channel === 'announcement' ? Megaphone : Users;
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
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              backgroundColor: ch.color || 'var(--em-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={18} strokeWidth={1.75} color="var(--em-text-inverse)" />
            </div>
            <span style={{
              fontSize: 15, fontWeight: active ? 600 : 400,
              color: active ? 'var(--em-accent)' : 'var(--em-text-primary)',
            }}>{ch.label}</span>
          </button>
        );
      })}
    </div>
  );
}
