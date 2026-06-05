import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import InboxList from '../components/inbox/InboxList';
import InboxDetail from '../components/inbox/InboxDetail';
import { useInboxList } from '../hooks/useInboxList';

// Phase 3 D-6(a) parent inbox — orchestration page.
// Minimal-viable per docs/REDESIGN_BRIEFINGS_2026-06-03.md §2.D-6(a):
//   - list view (recency-grouped)
//   - detail view (renders body_html_rendered from recipient row)
//   - no filter, no mark-as-read affordance, no in-app unsubscribe
// All deferred to a follow-up wave once parent usage data exists.

const errBox = { padding: 16, borderRadius: 10, backgroundColor: 'var(--as-danger-soft)', color: 'var(--as-danger)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 };
const retryBtn = { minHeight: 36, padding: '0 14px', borderRadius: 8, border: 'none', backgroundColor: 'var(--as-danger)', color: 'var(--as-text-inverse)', fontSize: 13, fontWeight: 600, cursor: 'pointer' };

export default function InboxPage() {
  const { items, loading, error, refetch, markOpened } = useInboxList();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeId, setActiveId] = useState(() => searchParams.get('r') || null);

  const openDetail = (item) => {
    setActiveId(item.id);
    // Optimistically clear the unread dot in the list the instant the row
    // is opened (§16.1) — no refetch needed when we return from detail.
    markOpened(item.id);
    const next = new URLSearchParams(searchParams);
    next.set('r', String(item.id));
    setSearchParams(next, { replace: false });
  };
  const closeDetail = () => {
    setActiveId(null);
    const next = new URLSearchParams(searchParams);
    next.delete('r');
    setSearchParams(next, { replace: true });
  };

  if (loading) {
    return <div style={{ padding: 24 }} role="status" aria-live="polite"><LoadingSkeleton variant="card" count={3} /></div>;
  }

  if (activeId) {
    return <InboxDetail recipientId={activeId} onBack={closeDetail} />;
  }

  return (
    <div className="px-4 py-4">
      <h1 className="font-bold" style={{ color: 'var(--as-text-primary)', fontSize: 20, marginBottom: 4 }}>Inbox</h1>
      <div style={{ width: 32, height: 3, backgroundColor: 'var(--as-accent)', borderRadius: 2, marginBottom: 12 }} />
      {error ? (
        <div role="alert" style={errBox}>
          <span>Couldn’t load your inbox. Try again in a moment.</span>
          <button type="button" className="as-press" style={retryBtn} onClick={refetch}>Retry</button>
        </div>
      ) : (
        <InboxList items={items} onSelect={openDetail} />
      )}
    </div>
  );
}
