import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Admin view of a program's registrations (org-scoped reads via RLS). Each registration
// joins the player + its fee rows. {data,error} surfaced before use (#36); Promise.all
// results checked independently. Exposes refetch so the detail page refreshes after edits.
export function useProgramRegistrations(programId) {
  const [program, setProgram] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [pRes, rRes] = await Promise.all([
      supabase.from('programs').select('id, name, public_slug, is_published, program_type, status, start_date, end_date').eq('id', programId).maybeSingle(),
      supabase.from('registrations')
        .select('id, status, created_at, players(first_name, last_name), registration_fees(amount_cents)')
        .eq('program_id', programId)
        .order('created_at', { ascending: false }),
    ]);
    if (pRes.error) setError(pRes.error.message);
    else if (rRes.error) setError(rRes.error.message);
    else {
      setProgram(pRes.data);
      setRegistrations(rRes.data || []);
    }
    setLoading(false);
  }, [programId]);

  // Microtask wrap keeps the synchronous setLoading(true) out of the effect body.
  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return { program, registrations, loading, error, refetch };
}
