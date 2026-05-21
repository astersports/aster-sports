import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useChannelPreviews(channels) {
  const { orgId } = useAuth();
  const [previews, setPreviews] = useState({});

  const fetch = useCallback(async () => {
    if (!orgId || channels.length === 0) return;
    const teamIds = channels.filter((c) => c.teamId).map((c) => c.teamId);
    const queries = [];
    queries.push(
      supabase.from('messages').select('channel, team_id, sender_name, body, created_at')
        .eq('org_id', orgId).eq('channel', 'announcement')
        .order('created_at', { ascending: false }).limit(1)
    );
    if (teamIds.length > 0) {
      for (const tid of teamIds) {
        queries.push(
          supabase.from('messages').select('channel, team_id, sender_name, body, created_at')
            .eq('org_id', orgId).eq('channel', 'team').eq('team_id', tid)
            .order('created_at', { ascending: false }).limit(1)
        );
      }
    }
    const results = await Promise.all(queries);
    const map = {};
    results.forEach((r) => {
      if (r.error) { console.error('useChannelPreviews:', r.error.message); return; }
      const msg = r.data?.[0];
      if (!msg) return;
      const key = msg.channel === 'team' ? `team-${msg.team_id}` : 'announcements';
      map[key] = { sender: msg.sender_name, body: msg.body, time: msg.created_at };
    });
    setPreviews(map);
  }, [orgId, channels]);

  useEffect(() => { Promise.resolve().then(fetch); }, [fetch]);

  return previews;
}
