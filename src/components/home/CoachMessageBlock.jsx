// §4.C Sprint C — Coach message block per HOME_DESIGN_SPEC §1.1.7.
// Renders the latest announcement per team (within 24h window). Each
// card shows sender name + relative time + truncated body + tap →
// /messages for the team.
//
// V1 ships the medium-default visual abbreviated. NOT in scope:
// thread preview with replies, density variants, dismiss button,
// per-message read/unread tracking.
//
// Visibility: hidden when messages is empty.

import { Link } from 'react-router-dom';

function relativeTime(iso, nowMs) {
  if (!iso || !nowMs) return '';
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return '';
  const diff = nowMs - ms;
  if (diff < 60 * 1000) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function CoachMessageBlock({ messages, nowMs }) {
  if (!messages?.length) return null;

  return (
    <div aria-label="Coach messages">
      {messages.map((m) => {
        const teamColor = m.teams?.team_color || 'var(--em-accent)';
        const teamName = m.teams?.name || 'Team';
        const when = relativeTime(m.created_at, nowMs);
        const sender = m.sender_name || 'Coach';
        return (
          <Link
            key={m.id}
            to={`/messages?team=${m.team_id}`}
            aria-label={`Coach message: ${sender} ${when}`}
            className="sf-press"
            style={{
              display: 'block',
              padding: 14,
              marginBottom: 12,
              backgroundColor: 'var(--em-bg-card)',
              border: '1px solid var(--em-border-default)',
              borderLeft: `4px solid ${teamColor}`,
              borderRadius: 10,
              color: 'var(--em-text-primary)',
              textDecoration: 'none',
              boxShadow: 'var(--em-shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-primary)' }}>
                {sender} · {teamName}
              </span>
              {when && (
                <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)', whiteSpace: 'nowrap' }}>
                  {when}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 14,
                color: 'var(--em-text-secondary)',
                lineHeight: 1.45,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                whiteSpace: 'pre-line',
              }}
            >
              {m.body || ''}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
