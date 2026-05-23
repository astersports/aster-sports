import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { tokensForSeverity } from '../../lib/alerts/severityTokens';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import Label from '../shared/Label';

const TYPE_LABELS = {
  schedule_change: 'Schedule Change',
  rsvp_reminder: 'RSVP Reminder',
  volunteer_opportunity: 'Volunteer',
  ride_request: 'Ride Request',
  briefing: 'Briefing',
  score_published: 'Score Published',
  announcement: 'Announcement',
  chat_mention: 'Chat Mention',
  reminder_24h: '24h Reminder',
  reminder_gameday: 'Game Day',
  cancellation: 'Cancellation',
  rsvp_nudge: 'RSVP Nudge',
};

// pending/failed/read map to severity tokens (warning/critical/info).
// sent + delivered are success outcomes, not severity states — they
// keep direct --em-success refs (success is its own axis, not part
// of the severity domain per severityTokens.js).
const WARNING = tokensForSeverity('warning');
const CRITICAL = tokensForSeverity('critical');
const INFO = tokensForSeverity('info');
const STATUS_STYLE = {
  pending:   { bg: WARNING.bg,  color: WARNING.text },
  sent:      { bg: 'var(--em-success-soft)', color: 'var(--em-success)' },
  delivered: { bg: 'var(--em-success-soft)', color: 'var(--em-success)' },
  failed:    { bg: CRITICAL.bg, color: CRITICAL.text },
  read:      { bg: INFO.bg,     color: INFO.text },
};

export default function NotificationHistory({ orgId }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    supabase.from('event_notifications')
      // §4.AD BUG-C fix (2026-05-24): event_notifications has no title/body
      // columns — both live inside the payload JSONB. PostgREST `col->>key`
      // extracts text values; aliased to title/body so the JSX below
      // (n.title / n.body access) keeps working unchanged.
      .select('id, notification_type, title:payload->>title, body:payload->>body, status, created_at, delivered_at, recipient_type')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error('NotificationHistory:', error.message);
        setNotifications(data || []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [orgId]);

  if (loading) return <LoadingSkeleton variant="card" count={2} />;

  if (notifications.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: 'center', backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 4 }}>No notifications sent yet</div>
        <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', lineHeight: 1.5 }}>
          Event reminders, RSVP nudges, and schedule change alerts will appear here once the notification engine is configured.
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', overflow: 'hidden' }}>
      {notifications.map((n, i) => {
        const s = STATUS_STYLE[n.status] || STATUS_STYLE.pending;
        return (
          <div key={n.id} style={{ padding: '10px 14px', borderTop: i === 0 ? 'none' : '1px solid var(--em-border-subtle)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, backgroundColor: s.bg, color: s.color }}>{n.status}</span>
                <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)' }}>{TYPE_LABELS[n.notification_type] || n.notification_type}</span>
              </div>
              {n.title && <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--em-text-primary)' }}>{n.title}</div>}
              {n.body && <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginTop: 2, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', display: '-webkit-box', overflow: 'hidden' }}>{n.body}</div>}
            </div>
            <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)', flexShrink: 0 }}>
              {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
