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
  const cancelledRef = useRef(false);

  const fetch = useCallback(async () => {
    if (!eventId) { setLoading(false); return; }
    if (!didInitialLoad.current) setLoading(true);
    const { data, error } = await supabase
      .from('event_duties').select('*').eq('event_id', eventId)
      .order('duty_name', { ascending: true });
    if (cancelledRef.current) return;
    if (error) console.error('useDuties:', error.message);
    setDuties(data || []);
    didInitialLoad.current = true;
    setLoading(false);
  }, [eventId]);

  useEffect(() => { cancelledRef.current = false; Promise.resolve().then(fetch); return () => { cancelledRef.current = true; }; }, [fetch]);

  const claim = async (dutyId) => {
    const prev = duties;
    const authorName = guardianFirstName || user?.user_metadata?.full_name || 'Volunteer';
    setDuties(duties.map((d) => d.id === dutyId ? { ...d, guardian_id: guardianId || null, claimed_by_name: authorName, claimed_at: new Date().toISOString() } : d));
    const { error } = await supabase.from('event_duties')
      .update({ guardian_id: guardianId || null, claimed_by_name: authorName, claimed_at: new Date().toISOString() })
      .eq('id', dutyId).is('claimed_at', null);
    if (error) {
      setDuties(prev);
      showToast("Looks like that didn't go through. Try again?", 'error');
      return false;
    }
    return true;
  };

  const unclaim = async (dutyId) => {
    const prev = duties;
    setDuties(duties.map((d) => d.id === dutyId ? { ...d, guardian_id: null, claimed_by_name: null, claimed_at: null } : d));
    const q = supabase.from('event_duties')
      .update({ guardian_id: null, claimed_by_name: null, claimed_at: null })
      .eq('id', dutyId);
    const { error } = await (guardianId ? q.eq('guardian_id', guardianId) : q);
    if (error) {
      setDuties(prev);
      showToast("Looks like that didn't go through. Try again?", 'error');
      return false;
    }
    return true;
  };

  return { duties, loading, claim, unclaim, refetch: fetch };
}
