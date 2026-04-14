import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Fetches event_duties for an event and exposes claim/unclaim.
// Schema: one row per claimable slot (duty_name + guardian_id nullable).
// A "Scorekeeper x 2" duty is inserted as 2 rows with the same duty_name,
// each independently claimable (see useCreateActivity).
export function useDuties(eventId) {
  const { user } = useAuth();
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!eventId) { setLoading(false); return; }
    if (duties.length === 0) setLoading(true);
    const { data, error } = await supabase
      .from('event_duties').select('*').eq('event_id', eventId)
      .order('duty_name', { ascending: true });
    if (error) console.error('useDuties:', error.message);
    setDuties(data || []);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  useEffect(() => { fetch(); }, [fetch]);

  const claim = async (dutyId) => {
    const authorName = user?.user_metadata?.full_name || user?.email || 'User';
    const { error } = await supabase.from('event_duties')
      .update({ guardian_id: user.id, claimed_by_name: authorName, claimed_at: new Date().toISOString() })
      .eq('id', dutyId).is('guardian_id', null);
    if (error) { console.error('claim duty:', error.message); return; }
    await fetch();
  };

  const unclaim = async (dutyId) => {
    const { error } = await supabase.from('event_duties')
      .update({ guardian_id: null, claimed_by_name: null, claimed_at: null })
      .eq('id', dutyId).eq('guardian_id', user.id);
    if (error) { console.error('unclaim duty:', error.message); return; }
    await fetch();
  };

  return { duties, loading, claim, unclaim, refetch: fetch };
}
