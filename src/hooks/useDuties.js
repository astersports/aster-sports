import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';

// Fetches event_duties for an event and exposes claim/unclaim.
// Schema: one row per claimable slot (duty_name + guardian_id nullable).
// A "Scorekeeper x 2" duty is inserted as 2 rows with the same duty_name,
// each independently claimable (see useCreateActivity).
export function useDuties(eventId) {
  const { user, guardianId, guardianFirstName } = useAuth();
  const { showToast } = useToast();
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const didInitialLoad = useRef(false);

  const fetch = useCallback(async () => {
    if (!eventId) { setLoading(false); return; }
    if (!didInitialLoad.current) setLoading(true);
    const { data, error } = await supabase
      .from('event_duties').select('*').eq('event_id', eventId)
      .order('duty_name', { ascending: true });
    if (error) console.error('useDuties:', error.message);
    setDuties(data || []);
    didInitialLoad.current = true;
    setLoading(false);
  }, [eventId]);

  // Microtask wrap pushes the synchronous setLoading(true) at the top of
  // fetch() out of the effect body, satisfying react-hooks/set-state-in-effect.
  useEffect(() => { Promise.resolve().then(fetch); }, [fetch]);

  const claim = async (dutyId) => {
    const authorName = guardianFirstName || user?.user_metadata?.full_name || 'Volunteer';
    const { error } = await supabase.from('event_duties')
      .update({ guardian_id: guardianId ?? null, claimed_by_name: authorName, claimed_at: new Date().toISOString() })
      .eq('id', dutyId).is('guardian_id', null);
    if (error) {
      console.error('claim duty:', error.message);
      showToast('Could not save assignment. Try again.', 'error');
      return false;
    }
    await fetch();
    return true;
  };

  const unclaim = async (dutyId) => {
    const q = supabase.from('event_duties')
      .update({ guardian_id: null, claimed_by_name: null, claimed_at: null })
      .eq('id', dutyId);
    const { error } = await (guardianId ? q.eq('guardian_id', guardianId) : q);
    if (error) {
      console.error('unclaim duty:', error.message);
      showToast('Could not unassign. Try again.', 'error');
      return false;
    }
    await fetch();
    return true;
  };

  return { duties, loading, claim, unclaim, refetch: fetch };
}
