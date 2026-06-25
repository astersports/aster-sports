import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// May 16 audit P2 item 10 (PR #319): the realtime channel name and
// postgres_changes filter were both global pre-fix — `unread-badge`
// shared across every connected user, and the INSERT subscription
// fired for ALL message rows regardless of org. Refactored to scope
// both the channel name and the row filter by orgId so multi-tenant
// installations don't burn channel slots or refetch on cross-org
// inserts. Single-tenant LH today: same behavior, less server work.

export function useHasUnread() {
  const { user, orgId } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  const check = useCallback(async () => {
    if (!user || !orgId) return;
    const { data: reads, error: readsErr } = await supabase
      .from('message_reads').select('channel_key, last_read_at')
      .eq('user_id', user.id);
    if (readsErr) { console.error('[useHasUnread] reads:', readsErr.message); return; }
    // markRead (useUnreadCounts) writes one last_read_at per channel_key
    // (announcements / team-<id> / dm-<id>). Compare each channel's NEWEST
    // non-self message against THAT channel's last_read_at — a MAX-across-
    // channels high-water mark misses unread in a channel read less recently
    // and disagrees with ChannelList's per-channel dot. Fallback '2020-01-01'
    // for a channel with no read row. RLS scopes messages to channels this
    // user can see; limit covers normal volume (a long-dormant channel beyond
    // it is, by definition, already read).
    const readMap = {};
    (reads || []).forEach((r) => { readMap[r.channel_key] = r.last_read_at; });

    const { data: msgs, error: msgErr } = await supabase.from('messages')
      .select('channel, team_id, dm_thread_id, created_at')
      .eq('org_id', orgId)
      .neq('sender_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (msgErr) { console.error('[useHasUnread] messages:', msgErr.message); return; }

    const channelKeyOf = (m) => (
      m.channel === 'announcement' ? 'announcements'
        : m.channel === 'dm' ? `dm-${m.dm_thread_id}`
          : `team-${m.team_id}`
    );

    const seen = new Set();
    let unread = false;
    for (const m of msgs || []) {
      const key = channelKeyOf(m);
      if (seen.has(key)) continue; // desc order → first per key is the newest
      seen.add(key);
      if (m.created_at > (readMap[key] || '2020-01-01')) { unread = true; break; }
    }
    setHasUnread(unread);
  }, [user, orgId]);

  useEffect(() => { Promise.resolve().then(check); }, [check]);

  useEffect(() => {
    if (!orgId) return;
    const safeCheck = () => {
      try { check(); }
      catch (err) { console.error('[useHasUnread] realtime callback:', err); }
    };
    // L99 TIER 3 PATTERN C: per-instance suffix prevents topic collisions.
    const ch = supabase.channel(`unread-badge-${orgId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `org_id=eq.${orgId}`,
      }, safeCheck)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orgId, check]);

  return hasUnread;
}
