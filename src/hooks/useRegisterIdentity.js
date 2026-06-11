import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// B3 funnel: identity + selectable children for the register wizard. An
// authenticated parent picks their existing kids (each carrying a real player_id)
// instead of re-typing them — closing the double-registration hole (re-typed kids
// minted a new player_id the (program, player_id) guard couldn't catch). Children
// come from player_guardians (RLS-scoped to the caller's guardian via
// current_user_guardian_id(); roster-INDEPENDENT, so a tryout-only parent is
// covered too); guardian identity from guardians (user_id = auth.uid()). When no
// session, returns authed:false and the wizard keeps today's manual entry.
const EMPTY = { loading: false, authed: false, guardian: null, children: [] };

export function useRegisterIdentity(programId) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState({ ...EMPTY, loading: true });

  useEffect(() => {
    let alive = true;
    // All setState lives in this async callback (not the effect body) so it never
    // fires synchronously during render. Stay loading until auth settles, so the
    // wizard doesn't flash the manual flow before the select path engages.
    (async () => {
      if (authLoading) { if (alive) setState({ ...EMPTY, loading: true }); return; }
      if (!user) { if (alive) setState(EMPTY); return; }
      // AP#36: surface every read's error. On any error, degrade to authed:false so
      // the wizard keeps the (always-correct) manual flow rather than silently
      // showing an empty child list — which would push a returning parent back to
      // re-typing (the double-reg hole). player_guardians/players/registrations are
      // FK-scoped (no org_id column); RLS scopes them to the caller's guardian.
      const { data: gRow, error: gErr } = await supabase
        .from('guardians').select('first_name, last_name, email, phone').eq('user_id', user.id).maybeSingle();
      const { data: links, error: lErr } = await supabase.from('player_guardians').select('player_id');
      if (gErr || lErr) { console.error('useRegisterIdentity:', (gErr || lErr).message); if (alive) setState(EMPTY); return; }
      const ids = [...new Set((links || []).map((l) => l.player_id))];
      let children = [];
      if (ids.length) {
        const [pRes, rRes] = await Promise.all([
          supabase.from('players').select('id, first_name, last_name, grade, gender').in('id', ids).order('first_name'),
          programId
            ? supabase.from('registrations').select('player_id').eq('program_id', programId).neq('status', 'cancelled').in('player_id', ids)
            : Promise.resolve({ data: [], error: null }),
        ]);
        if (pRes.error || rRes.error) { console.error('useRegisterIdentity:', (pRes.error || rRes.error).message); if (alive) setState(EMPTY); return; }
        const reg = new Set((rRes.data || []).map((r) => r.player_id));
        children = (pRes.data || []).map((p) => ({
          player_id: p.id, first_name: p.first_name, last_name: p.last_name,
          grade: p.grade, gender: p.gender, alreadyRegistered: reg.has(p.id),
        }));
      }
      if (alive) setState({ loading: false, authed: true, guardian: gRow || null, children });
    })();
    return () => { alive = false; };
  }, [user, authLoading, programId]);

  return state;
}
