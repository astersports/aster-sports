// Wave 3.14 — past briefings about this event. Renders only when
// briefings exist (no header / no empty state when zero). Click a
// row to navigate to BriefingHistoryDetail.
//
// Wave 4.8 6b Session 3: prop contract changed from {eventId} to {event}
// so the component can infer kind for the new "Compose new" footer.
// Renders the footer inside the existing briefings-exist gate — admins
// with zero past briefings on an anchor land in the same null-render path
// as before. Surfacing zero-history "Compose new" is deferred to a future
// session (would require parent-mount changes per the audit).

import { useNavigate } from 'react-router-dom';
import { Bell, CalendarClock, CalendarDays, Flag, Medal, Megaphone, MessageSquare, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEventBriefings } from '../../hooks/useEventBriefings';
import { KIND_METADATA } from '../../lib/briefings/kindMetadata';
import ComposeAnchorCta from '../briefings/ComposeAnchorCta';

const ICON_MAP = { Bell, CalendarClock, CalendarDays, Flag, Medal, Megaphone, MessageSquare, Trophy };

const wrap = { margin: '16px' };
const headerStyle = { fontSize: 16, fontWeight: 600, color: 'var(--em-text-primary)', margin: '0 0 8px 0' };
const rowStyle = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-subtle)', minHeight: 56, width: '100%', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', color: 'var(--em-text-primary)' };
const iconWrap = { width: 32, height: 32, borderRadius: 8, backgroundColor: 'var(--em-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const titleStyle = { fontSize: 14, fontWeight: 500, color: 'var(--em-text-primary)' };
const subStyle = { fontSize: 12, color: 'var(--em-text-tertiary)', marginTop: 2 };

function relTime(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor(ms / 3600000);
  if (ms < 3600000) return 'just now';
  if (ms < 86400000) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function deliverySubtitle(recipientCount, deliveredCount) {
  if (!recipientCount) return '';
  if (deliveredCount === recipientCount) return `${recipientCount} families · all delivered`;
  const pct = Math.round((deliveredCount / recipientCount) * 100);
  return `${recipientCount} families · ${pct}% delivered`;
}

// Mirrors the past-game predicate at EventDetailHeader.jsx:73-75.
function pastGameKind(event) {
  if (!event) return null;
  const isPastGame = event.event_type === 'game'
    && !!event.start_at && new Date(event.start_at) < new Date()
    && event.status !== 'cancelled';
  return isPastGame ? 'game_recap' : null;
}

export default function EventBriefingHistory({ event }) {
  const { orgId } = useAuth();
  const navigate = useNavigate();
  const { briefings } = useEventBriefings({ orgId, eventId: event?.id });
  const ctaKind = pastGameKind(event);

  if (!briefings.length) return null;

  return (
    <div style={wrap}>
      <h3 style={headerStyle}>Past briefings</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {briefings.map((b) => {
          const meta = KIND_METADATA[b.kind] || {};
          const Icon = ICON_MAP[meta.icon] || MessageSquare;
          return (
            <button key={b.id} type="button" className="sf-press" style={rowStyle} onClick={() => navigate(`/admin/briefings/history/${b.id}`)}>
              <span style={iconWrap}><Icon size={16} strokeWidth={1.75} color="var(--em-text-secondary)" /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={titleStyle}>{meta.label || b.kind} · sent {relTime(b.sent_at)}</div>
                <div style={subStyle}>{deliverySubtitle(b.recipientCount, b.deliveredCount)}</div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--em-accent)' }}>View →</span>
            </button>
          );
        })}
      </div>
      {ctaKind && <ComposeAnchorCta anchorKind="event" anchor={event} kind={ctaKind} />}
    </div>
  );
}
