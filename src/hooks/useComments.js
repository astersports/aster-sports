import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';

// Fetches event_comments for an event and exposes post(body). Sorted
// by pinned first, then created_at ascending (oldest first) so the
// thread reads top-down like a chat.
export function useComments(eventId) {
  const { user, guardianFirstName } = useAuth();
  const { showToast } = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const didInitialLoad = useRef(false);
  const cancelledRef = useRef(false);

  const fetch = useCallback(async () => {
    if (!eventId) { setLoading(false); return; }
    if (!didInitialLoad.current) setLoading(true);
    const { data, error: fetchErr } = await supabase
      .from('event_comments').select('*').eq('event_id', eventId)
      .order('pinned', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: true });
    if (cancelledRef.current) return;
    if (fetchErr) {
      console.error('useComments:', fetchErr.message);
      setError(fetchErr);
      setLoading(false);
      return;
    }
    setComments(data || []);
    didInitialLoad.current = true;
    setLoading(false);
  }, [eventId]);

  useEffect(() => { cancelledRef.current = false; Promise.resolve().then(fetch); return () => { cancelledRef.current = true; }; }, [fetch]);

  const post = async (body) => {
    const trimmed = body.trim();
    if (!trimmed) return false;
    if (!user?.id) { showToast('Sign in to post a comment.', 'error'); return false; }
    const authorName = guardianFirstName
      || user?.user_metadata?.full_name
      || user?.user_metadata?.name
      || 'Anonymous';
    const optimistic = { id: `temp-${Date.now()}`, event_id: eventId, body: trimmed, author_user_id: user.id, author_name: authorName, created_at: new Date().toISOString(), pinned: false };
    const prev = comments;
    setComments([...comments, optimistic]);
    const { error } = await supabase.from('event_comments').insert({
      event_id: eventId,
      body: trimmed,
      author_user_id: user.id,
      author_name: authorName,
    });
    if (error) {
      setComments(prev);
      showToast("Looks like that didn't go through. Try again?", 'error');
      return false;
    }
    await fetch();
    return true;
  };

  return { comments, loading, error, post, refetch: fetch };
}
