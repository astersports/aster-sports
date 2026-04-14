import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Fetches event_duties for an event and exposes claim/unclaim +
// createDuty. Duties are per-slot rows (3 slots = 3 rows) so the
// schema matches CLAUDE.md §5 and each can be claimed independently.
export function useDuties(eventId) {
  const { user } = useAuth();
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!eventId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('event_duties').select('*').eq('event_id', eventId)
      .order('name', { ascending: true });
    if (error) console.error('useDuties:', error.message);
    setDuties(data || []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetch(); }, [fetch]);

  const claim = async (dutyId) => {
    const { error } = await supabase.from('event_duties')
      .update({ claimed_by: user.id, claimed_at: new Date().toISOString() })
      .eq('id', dutyId).is('claimed_by', null);
    if (error) { console.error('claim duty:', error.message); return; }
    await fetch();
  };

  const unclaim = async (dutyId) => {
    const { error } = await supabase.from('event_duties')
      .update({ claimed_by: null, claimed_at: null })
      .eq('id', dutyId).eq('claimed_by', user.id);
    if (error) { console.error('unclaim duty:', error.message); return; }
    await fetch();
  };

  return { duties, loading, claim, unclaim, refetch: fetch };
}
