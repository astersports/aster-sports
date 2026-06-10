import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { loadImplicitFeeCents, upsertImplicitFee } from '../lib/implicitDivision';

// D1 — loads + saves a non-season program's single flat fee (its implicit
// division's base fee). The detail editor uses this; setting the fee on the
// existing Fall 2026 Tryouts is what makes it registrable. {data,error} surfaced
// explicitly (AP#36).
export function useProgramFlatFee(programId, orgId, programName) {
  const [cents, setCents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const c = await loadImplicitFeeCents(supabase, programId);
        if (active) setCents(c);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [programId]);

  const save = useCallback(async (dollars) => {
    const amountCents = Math.round(parseFloat(dollars) * 100);
    if (!(amountCents > 0)) return { ok: false, error: 'Enter a fee greater than $0.' };
    setSaving(true);
    setError(null);
    try {
      await upsertImplicitFee(supabase, { orgId, programId, programName, amountCents });
      setCents(amountCents);
      return { ok: true };
    } catch (e) {
      setError(e.message);
      return { ok: false, error: e.message };
    } finally {
      setSaving(false);
    }
  }, [orgId, programId, programName]);

  return { cents, loading, saving, error, save };
}
