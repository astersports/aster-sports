import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';

export function useMessages(channel, channelId, dmThreadId) {
  const { user, guardianFirstName, orgId } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const didInit = useRef(false);

  const fetch = useCallback(async () => {
    if (!orgId || !channel) { setLoading(false); return; }
    if (!didInit.current) setLoading(true);
    let q = supabase.from('messages').select('*').eq('org_id', orgId).eq('channel', channel);
    if (channel === 'team' && channelId) q = q.eq('team_id', channelId);
    if (channel === 'dm' && dmThreadId) q = q.eq('dm_thread_id', dmThreadId);
    q = q.order('created_at', { ascending: true }).limit(200);
    const { data, error: fetchErr } = await q;
    if (fetchErr) {
      console.error('useMessages:', fetchErr.message);
      setError(fetchErr);
      setLoading(false);
      return;
    }
    setMessages(data || []);
    didInit.current = true;
    setLoading(false);
  }, [orgId, channel, channelId, dmThreadId]);

  useEffect(() => { Promise.resolve().then(fetch); }, [fetch]);

  useEffect(() => {
    if (!channel) return;
    let filter;
    if (channel === 'dm' && dmThreadId) filter = `dm_thread_id=eq.${dmThreadId}`;
    else if (channel === 'team' && channelId) filter = `team_id=eq.${channelId}`;
    else filter = `channel=eq.${channel}`;
    // L99 TIER 3 PATTERN C: per-instance suffix so two hook instances on
    // the same channel/id don't open two realtime channels with an
    // identical topic name — that collision errors the second subscribe.
    const ch = supabase.channel(`messages-${channel}-${channelId || dmThreadId || 'all'}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [channel, channelId, dmThreadId, fetch]);

  const send = async (body) => {
    const trimmed = body.trim();
    if (!trimmed || !user) return false;
    const senderName = guardianFirstName
      || user.user_metadata?.full_name
      || user.user_metadata?.name
      || 'User';
    const row = {
      org_id: orgId,
      channel,
      sender_id: user.id,
      sender_name: senderName,
      body: trimmed,
    };
    if (channel === 'team' && channelId) row.team_id = channelId;
    if (channel === 'dm' && dmThreadId) row.dm_thread_id = dmThreadId;
    const { error } = await supabase.from('messages').insert(row);
    if (error) {
      console.error('send message:', error.message);
      showToast("Couldn't send message. Try again?", 'error');
      return false;
    }
    return true;
  };

  const deleteMessage = async (messageId) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (error) {
      console.error('delete message:', error.message);
      showToast("Couldn't delete message. Try again?", 'error');
      await fetch();
      return false;
    }
    return true;
  };

  return { messages, loading, error, send, deleteMessage, refetch: fetch };
}
