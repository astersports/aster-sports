import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChannels } from '../hooks/useChannels';
import { useUnreadCounts } from '../hooks/useUnreadCounts';
import { useChannelPreviews } from '../hooks/useChannelPreviews';
import { useDmThreads } from '../hooks/useDmThreads';
import { useGetOrCreateDm } from '../hooks/useGetOrCreateDm';
import ChannelList from '../components/messaging/ChannelList';
import DmList from '../components/messaging/DmList';
import MessageThread from '../components/messaging/MessageThread';
import NewDmPicker from '../components/messaging/NewDmPicker';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import Label from '../components/shared/Label';
import MessagesHeader from '../components/messages/MessagesHeader';
import MessagesSearchBar from '../components/messages/MessagesSearchBar';
import MessagesEmptyState from '../components/messages/MessagesEmptyState';
import MessagesErrorState from '../components/messages/MessagesErrorState';

export default function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { channels, loading } = useChannels();
  const { reads, markRead } = useUnreadCounts();
  const previews = useChannelPreviews(channels);
  const { threads: dmThreads, loading: dmsLoading, refetch: refetchDms } = useDmThreads();
  const getOrCreate = useGetOrCreateDm();
  const [active, setActive] = useState(null);
  const [showNewDm, setShowNewDm] = useState(false);
  const [query, setQuery] = useState('');
  const [startError, setStartError] = useState(false);
  const [starting, setStarting] = useState(false);

  // L99 enhancement: derive an unread-conversation count for the header summary,
  // grounded in the same `previews`/`reads` shape ChannelList already consumes.
  const unreadCount = useMemo(() => channels.reduce((n, ch) => {
    const p = previews?.[ch.key];
    const unread = p?.time && (!reads?.[ch.key] || p.time > reads[ch.key]);
    return unread ? n + 1 : n;
  }, 0), [channels, previews, reads]);

  // L99 enhancement: case-insensitive filtering of channels + DMs (iMessage search).
  const q = query.trim().toLowerCase();
  const filteredChannels = useMemo(
    () => (q ? channels.filter((ch) => ch.label?.toLowerCase().includes(q)) : channels),
    [channels, q],
  );
  const filteredDms = useMemo(
    () => (q ? dmThreads.filter((t) => t.otherName?.toLowerCase().includes(q)) : dmThreads),
    [dmThreads, q],
  );
  const noResults = q.length > 0 && filteredChannels.length === 0 && filteredDms.length === 0;

  useEffect(() => {
    if (loading || active) return;
    const teamParam = searchParams.get('team');
    const announce = searchParams.get('announce');
    let match = null;
    if (teamParam) match = channels.find((ch) => ch.teamId === teamParam);
    else if (announce) match = channels.find((ch) => ch.channel === 'announcement');
    if (match) Promise.resolve().then(() => { setActive(match); setSearchParams({}, { replace: true }); });
  }, [loading, channels, searchParams, active, setSearchParams]);

  useEffect(() => { if (active) markRead(active.key); }, [active, markRead]);

  const openDm = (thread) => {
    setActive({ key: `dm-${thread.id}`, label: thread.otherName, channel: 'dm', dmThreadId: thread.id });
  };

  const startNewDm = async (otherUserId) => {
    setShowNewDm(false);
    setStartError(false);
    setStarting(true);
    try {
      const thread = await getOrCreate(otherUserId);
      if (thread) { await refetchDms(); openDm({ ...thread, otherName: 'Loading…' }); }
      else setStartError(true);
    } catch {
      // Kindness microcopy (§16.3): surface a retryable error, never a stack trace.
      setStartError(true);
    } finally {
      setStarting(false);
    }
  };

  if (loading || dmsLoading) return <div style={{ padding: 24 }}><LoadingSkeleton variant="card" count={3} /></div>;

  if (active) {
    return (
      <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
        <MessageThread channel={active} onBack={() => setActive(null)} />
      </div>
    );
  }

  if (showNewDm) return <NewDmPicker onSelect={startNewDm} onClose={() => setShowNewDm(false)} />;

  if (startError) {
    return (
      <div className="px-4 py-4">
        <MessagesHeader unreadCount={unreadCount} onNewMessage={() => { setStartError(false); setShowNewDm(true); }} />
        <MessagesErrorState onRetry={() => { setStartError(false); setShowNewDm(true); }} />
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      {/* L99 enhancement: header with unread summary, fallback to legacy markup-equivalent. */}
      <MessagesHeader unreadCount={unreadCount} onNewMessage={() => setShowNewDm(true)} />
      {starting && (
        <div aria-live="polite" style={{ marginBottom: 12 }}>
          <LoadingSkeleton variant="text" count={1} />
        </div>
      )}
      <MessagesSearchBar value={query} onChange={setQuery} />
      {noResults ? (
        <MessagesEmptyState mode="no-results" query={query.trim()} />
      ) : (
        <>
          {filteredChannels.length > 0 && (
            <>
              <Label>Channels</Label>
              <ChannelList channels={filteredChannels} activeKey={active?.key} onSelect={setActive} previews={previews} reads={reads} />
            </>
          )}
          {filteredDms.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Label>Direct Messages</Label>
              <DmList threads={filteredDms} onSelect={openDm} />
            </div>
          )}
          {!q && channels.length === 0 && dmThreads.length === 0 && (
            <MessagesEmptyState mode="empty" />
          )}
        </>
      )}
    </div>
  );
}
