import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { PreferencesContext } from './PreferencesContext';

/**
 * PreferencesProvider
 * Shared state for user_preferences row. Single instance lives at app root;
 * all consumers (Header, RoleSwitcherSheet, useHomeRole)
 * read from this same store via useContext(PreferencesContext) — eliminates
 * stale-state bugs that surfaced in Step 4C smoke test.
 *
 * Microtask-wrapped setState satisfies react-hooks/set-state-in-effect.
 */
export function PreferencesProvider({ children }) {
  const { user, orgId } = useAuth();
  const userId = user?.id;
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!userId || !orgId) {
      Promise.resolve().then(() => {
        if (cancelled) return;
        setPreferences(null);
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
    });

    (async () => {
      const { data, error: err } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .maybeSingle();

      if (cancelled) return;

      if (err) {
        setError(err);
        setPreferences(null);
      } else {
        setPreferences(data);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, orgId]);

  const prefsRef = useRef(preferences);
  useEffect(() => { prefsRef.current = preferences; });

  const updatePreference = useCallback(
    async (column, value) => {
      if (!userId || !orgId) return;
      const previous = prefsRef.current;
      setPreferences((p) => (p ? { ...p, [column]: value } : p));

      const { error: err } = await supabase
        .from('user_preferences')
        .update({ [column]: value, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('org_id', orgId);

      if (err) {
        setError(err);
        setPreferences(previous);
        throw err;
      }
    },
    [userId, orgId]
  );

  const mergePreferenceJson = useCallback(
    async (column, partial) => {
      if (!userId || !orgId || !prefsRef.current) return;
      const current = prefsRef.current[column] ?? {};
      const next = { ...current, ...partial };
      await updatePreference(column, next);
    },
    [userId, orgId, updatePreference]
  );

  const value = useMemo(
    () => ({ preferences, loading, error, updatePreference, mergePreferenceJson }),
    [preferences, loading, error, updatePreference, mergePreferenceJson]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
