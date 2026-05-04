import { useState, useEffect } from 'react';
import { useChannels } from '../hooks/useChannels';
import { useUnreadCounts } from '../hooks/useUnreadCounts';
import ChannelList from '../components/messaging/ChannelList';
import MessageThread from '../components/messaging/MessageThread';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import Label from '../components/shared/Label';

export default function MessagesPage() {
  const { channels, loading } = useChannels();
  const { markRead } = useUnreadCounts();
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (active) markRead(active.key);
  }, [active, markRead]);

  if (loading) return <div style={{ padding: 24 }}><LoadingSkeleton variant="card" rows={3} /></div>;

  if (active) {
    return (
      <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
        <MessageThread channel={active} onBack={() => setActive(null)} />
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <h1 className="font-bold" style={{ color: 'var(--em-text-primary)', fontSize: 20, marginBottom: 4 }}>
        Messages
      </h1>
      <div style={{ width: 32, height: 3, backgroundColor: 'var(--em-accent)', borderRadius: 2, marginBottom: 16 }} />
      <Label>Channels</Label>
      <ChannelList channels={channels} activeKey={active?.key} onSelect={setActive} />
    </div>
  );
}
