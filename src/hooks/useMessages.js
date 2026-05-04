import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';

export function useMessages(channel, channelId) {
  const { user, guardianFirstName, orgId } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const didInit = useRef(false);

  const fetch = useCallback(async () => {
    if (!orgId || !channel) { setLoading(false); return; }
    if (!didInit.current) setLoading(true);
    let q = supabase.from('messages').select('*').eq('org_id', orgId).eq('channel', channel);
    if (channel === 'team' && channelId) q = q.eq('team_id', channelId);
    q = q.order('created_at', { ascending: true }).limit(200);
    const { data, error } = await q;
    if (error) console.error('useMessages:', error.message);
    setMessages(data || []);
    didInit.current = true;
    setLoading(false);
  }, [orgId, channel, channelId]);

  useEffect(() => { Promise.resolve().then(fetch); }, [fetch]);

  useEffect(() => {
    if (!channel) return;
    const filter = channel === 'team' && channelId
      ? `team_id=eq.${channelId}`
      : `channel=eq.${channel}`;
    const ch = supabase.channel(`messages-${channel}-${channelId || 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [channel, channelId, fetch]);

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
    const { error } = await supabase.from('messages').insert(row);
    if (error) {
      console.error('send message:', error.message);
      showToast("Couldn't send message. Try again?", 'error');
      return false;
    }
    return true;
  };

  return { messages, loading, send, refetch: fetch };
}
