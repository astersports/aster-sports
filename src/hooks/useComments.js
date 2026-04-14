import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Fetches event_comments for an event and exposes post(body). Sorted
// by pinned first, then created_at ascending (oldest first) so the
// thread reads top-down like a chat.
export function useComments(eventId) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!eventId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('event_comments').select('*').eq('event_id', eventId)
      .order('pinned', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: true });
    if (error) console.error('useComments:', error.message);
    setComments(data || []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetch(); }, [fetch]);

  const post = async (body) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    const authorName = user?.user_metadata?.full_name || user?.email || 'User';
    const { error } = await supabase.from('event_comments').insert({
      event_id: eventId,
      body: trimmed,
      author_user_id: user.id,
      author_name: authorName,
    });
    if (error) { console.error('post comment:', error.message); return; }
    await fetch();
  };

  return { comments, loading, post, refetch: fetch };
}
