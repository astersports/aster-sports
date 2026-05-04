import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
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

export default function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { channels, loading } = useChannels();
  const { markRead } = useUnreadCounts();
  const previews = useChannelPreviews(channels);
  const { threads: dmThreads, loading: dmsLoading, refetch: refetchDms } = useDmThreads();
  const getOrCreate = useGetOrCreateDm();
  const [active, setActive] = useState(null);
  const [showNewDm, setShowNewDm] = useState(false);

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
    const thread = await getOrCreate(otherUserId);
    if (!thread) return;
    await refetchDms();
    const updated = dmThreads.find((t) => t.id === thread.id);
    openDm({ ...thread, otherName: updated?.otherName || 'Chat' });
  };

  if (loading || dmsLoading) return <div style={{ padding: 24 }}><LoadingSkeleton variant="card" rows={3} /></div>;

  if (active) {
    return (
      <div style={{ position: 'fixed', inset: 0, bottom: 80, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--em-bg-page)' }}>
        <MessageThread channel={active} onBack={() => setActive(null)} />
      </div>
    );
  }

  if (showNewDm) return <NewDmPicker onSelect={startNewDm} onClose={() => setShowNewDm(false)} />;

  return (
    <div className="px-4 py-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h1 className="font-bold" style={{ color: 'var(--em-text-primary)', fontSize: 20 }}>Messages</h1>
        <button type="button" onClick={() => setShowNewDm(true)} className="sf-press" aria-label="New message"
          style={{ width: 44, height: 44, borderRadius: 10, border: 'none', backgroundColor: 'var(--em-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Plus size={18} strokeWidth={2} color="var(--em-text-inverse)" />
        </button>
      </div>
      <div style={{ width: 32, height: 3, backgroundColor: 'var(--em-accent)', borderRadius: 2, marginBottom: 16 }} />
      <Label>Channels</Label>
      <ChannelList channels={channels} activeKey={active?.key} onSelect={setActive} previews={previews} />
      {dmThreads.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Label>Direct Messages</Label>
          <DmList threads={dmThreads} onSelect={openDm} />
        </div>
      )}
    </div>
  );
}
