// Wave 3.12 — sent-briefing history list. Light-bordered rows with
// View action linking to BriefingHistoryDetail.

import { useNavigate } from 'react-router-dom';
import { Bell, CalendarClock, CalendarDays, Flag, Medal, Megaphone, MessageSquare, Trophy } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useInboxHistory } from '../../../hooks/useInboxHistory';
import { KIND_METADATA } from '../../../lib/briefings/kindMetadata';
import EmptyState from './EmptyState';

const ICON_MAP = { Bell, CalendarClock, CalendarDays, Flag, Medal, Megaphone, MessageSquare, Trophy };

const rowStyle = { display: 'flex', gap: 12, padding: 14, borderRadius: 10, backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-subtle)', borderLeft: '4px solid var(--em-border-default)' };
const iconWrap = { width: 36, height: 36, borderRadius: 8, backgroundColor: 'var(--em-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const titleStyle = { fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)' };
const subStyle = { fontSize: 13, color: 'var(--em-text-tertiary)', marginTop: 2 };
const viewBtn = { minHeight: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' };
const moreBtn = { ...viewBtn, width: '100%', minHeight: 44, marginTop: 8 };

function relTime(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.round(ms / 86400000);
  const hours = Math.round(ms / 3600000);
  if (ms < 3600000) return 'just now';
  if (ms < 86400000) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
}

export default function HistoryView({ filters, search, onCompose }) {
  const { orgId } = useAuth();
  const navigate = useNavigate();
  const { rows, hasMore, loadMore, loading } = useInboxHistory({ orgId, filters, search });

  if (!loading && !rows.length) {
    const filterActive = !!(filters?.kind || filters?.teams?.length || search?.trim() || filters?.dateRange !== 'all');
    if (filterActive) return <EmptyState kind="filtered" onClearFilters={() => navigate('/admin/briefings?tab=history')} />;
    return <EmptyState kind="history" onCompose={onCompose} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map((r) => {
        const m = KIND_METADATA[r.kind] || {};
        const Icon = ICON_MAP[m.icon] || MessageSquare;
        const label = m.label || r.kind;
        return (
          <div key={r.id} style={rowStyle}>
            <span style={iconWrap}><Icon size={20} strokeWidth={1.75} color="var(--em-text-tertiary)" /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={titleStyle}>{label}{r.subject ? ` · ${r.subject}` : ''}</div>
              <div style={subStyle}>Sent {relTime(r.sent_at)} · {r.audience_type || '—'}</div>
            </div>
            <button type="button" onClick={() => navigate(`/admin/briefings/history/${r.id}`)} className="sf-press" style={viewBtn}>View</button>
          </div>
        );
      })}
      {hasMore && <button type="button" onClick={loadMore} disabled={loading} className="sf-press" style={moreBtn}>{loading ? 'Loading…' : 'Load more'}</button>}
    </div>
  );
}
