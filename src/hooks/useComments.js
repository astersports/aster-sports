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
  const didInitialLoad = useRef(false);

  const fetch = useCallback(async () => {
    if (!eventId) { setLoading(false); return; }
    if (!didInitialLoad.current) setLoading(true);
    const { data, error } = await supabase
      .from('event_comments').select('*').eq('event_id', eventId)
      .order('pinned', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: true });
    if (error) console.error('useComments:', error.message);
    setComments(data || []);
    didInitialLoad.current = true;
    setLoading(false);
  }, [eventId]);

  // Microtask wrap pushes the synchronous setLoading(true) at the top of
  // fetch() out of the effect body, satisfying react-hooks/set-state-in-effect.
  useEffect(() => { Promise.resolve().then(fetch); }, [fetch]);

  const post = async (body) => {
    const trimmed = body.trim();
    if (!trimmed) return false;
    const emailLocal = (user?.email || '').split('@')[0];
    const fallbackName = emailLocal ? emailLocal.charAt(0).toUpperCase() + emailLocal.slice(1) : 'User';
    const authorName = guardianFirstName
      || user?.user_metadata?.full_name
      || user?.user_metadata?.name
      || fallbackName;
    const { error } = await supabase.from('event_comments').insert({
      event_id: eventId,
      body: trimmed,
      author_user_id: user.id,
      author_name: authorName,
    });
    if (error) {
      console.error('post comment:', error.message);
      showToast('Could not post comment. Try again.', 'error');
      return false;
    }
    await fetch();
    return true;
  };

  return { comments, loading, post, refetch: fetch };
}
