import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import InboxList from '../components/inbox/InboxList';
import InboxDetail from '../components/inbox/InboxDetail';
import InboxHeader from '../components/inbox/InboxHeader';
import InboxToolbar from '../components/inbox/InboxToolbar';
import InboxErrorState from '../components/inbox/InboxErrorState';
import InboxFilterEmpty from '../components/inbox/InboxFilterEmpty';
import { useMarkAllRead } from '../components/inbox/useMarkAllRead';
import { useToast } from '../context/useToast';
import { useInboxList } from '../hooks/useInboxList';

// Phase 3 D-6(a) parent inbox — orchestration page.
// L99 enhancement pass (additive): unread-count header, All/Unread filter,
// optimistic "mark all read", icon error state + filtered-empty state,
// responsive max-width container. The core list/detail contract is
// unchanged — InboxList / InboxDetail own their own render.

export default function InboxPage() {
  const { items, loading, error, refetch, markOpened } = useInboxList();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeId, setActiveId] = useState(() => searchParams.get('r') || null);
  // All / Unread filter (persisted to the URL so back/refresh keeps it).
  const [filter, setFilter] = useState(() => (searchParams.get('f') === 'unread' ? 'unread' : 'all'));
  const { showToast } = useToast();
  const { busy, status, run, clearStatus } = useMarkAllRead({ items, markOpened, refetch });

  const unreadCount = useMemo(() => items.filter((it) => !it.opened_at).length, [items]);
  const visibleItems = useMemo(
    () => (filter === 'unread' ? items.filter((it) => !it.opened_at) : items),
    [items, filter],
  );

  // Map the mark-all-read result to a kindness toast (§16.3), then clear.
  useEffect(() => {
    if (!status) return;
    if (status === 'done') showToast('All briefings marked read', 'success');
    else showToast('Looks like that didn’t go through. Try again?', 'error');
    clearStatus();
  }, [status, showToast, clearStatus]);

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
  const changeFilter = (next) => {
    setFilter(next);
    const params = new URLSearchParams(searchParams);
    if (next === 'unread') params.set('f', 'unread'); else params.delete('f');
    setSearchParams(params, { replace: true });
  };

  if (loading) {
    return <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }} role="status" aria-live="polite"><LoadingSkeleton variant="card" count={3} /></div>;
  }

  if (activeId) {
    return <InboxDetail recipientId={activeId} onBack={closeDetail} />;
  }

  return (
    <div className="px-4 py-4 as-fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
      <InboxHeader unreadCount={unreadCount} total={items.length} />
      {error ? (
        <InboxErrorState onRetry={refetch} />
      ) : (
        <>
          {items.length > 0 && (
            <InboxToolbar
              filter={filter}
              onFilterChange={changeFilter}
              unreadCount={unreadCount}
              onMarkAllRead={run}
              busy={busy}
            />
          )}
          {filter === 'unread' && visibleItems.length === 0 && items.length > 0 ? (
            <InboxFilterEmpty />
          ) : (
            <InboxList items={visibleItems} onSelect={openDetail} />
          )}
        </>
      )}
    </div>
  );
}
