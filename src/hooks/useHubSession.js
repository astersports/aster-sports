import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Lightweight auth-session hook for the no-login Hub (R1·PR-A). Returns the bare
// auth identity ({ user }, null when anon) and tracks sign-in / sign-out. Distinct
// from the app's AuthContext, which loads org membership + branding — the Hub only
// needs the identity to drive the magic-link "save your teams" sync. Safe for a
// signed-in app user too: the same session simply carries onto the Hub.
export function useHubSession() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => { if (active) setUser(data?.session?.user || null); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user || null);
    });
    return () => { active = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  return { user, signOut: () => supabase.auth.signOut() };
}
