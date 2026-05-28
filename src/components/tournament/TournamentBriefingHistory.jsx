// Wave 3.15 — past briefings about this tournament. Mirrors
// EventBriefingHistory shape from PR #45; uses useAnchorBriefings
// with anchor_kind='tournament'. Renders only when briefings exist.
//
// Wave 4.8 6b Session 3: prop contract changed from {tournamentId} to
// {tournament} so the component can infer kind (prelim vs recap vs
// in-flight) for the new "Compose new" footer. Footer renders inside
// the existing briefings-exist gate — zero-history surfacing deferred.

import { useNavigate } from 'react-router-dom';
import { Bell, CalendarClock, CalendarDays, Flag, Medal, Megaphone, MessageSquare, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAnchorBriefings } from '../../hooks/useAnchorBriefings';
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
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
}

function deliverySubtitle(recipientCount, deliveredCount) {
  if (!recipientCount) return '';
  if (deliveredCount === recipientCount) return `${recipientCount} families · all delivered`;
  const pct = Math.round((deliveredCount / recipientCount) * 100);
  return `${recipientCount} families · ${pct}% delivered`;
}

// Mirrors the three-state predicate at TournamentHeader.jsx:36-39.
function tournamentCtaKind(t) {
  if (!t) return null;
  const now = new Date();
  if (t.start_date && new Date(t.start_date) > now) return 'tournament_prelim';
  if (t.end_date && new Date(t.end_date) < now) return 'tournament_recap';
  return null;
}

export default function TournamentBriefingHistory({ tournament }) {
  const { orgId } = useAuth();
  const navigate = useNavigate();
  const { briefings } = useAnchorBriefings({ orgId, anchorKind: 'tournament', anchorId: tournament?.id });
  const ctaKind = tournamentCtaKind(tournament);

  if (!briefings.length) return null;

  return (
    <div style={wrap}>
      <h3 style={headerStyle}>Past briefings</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {briefings.map((b) => {
          const meta = KIND_METADATA[b.kind] || {};
          const Icon = ICON_MAP[meta.icon] || MessageSquare;
          return (
            <button key={b.id} type="button" className="em-press" style={rowStyle} onClick={() => navigate(`/admin/briefings/history/${b.id}`)}>
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
      {ctaKind && <ComposeAnchorCta anchorKind="tournament" anchor={tournament} kind={ctaKind} />}
    </div>
  );
}
