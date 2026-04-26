import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * usePreferences
 * Reads + writes the current user's row in public.user_preferences for the active org.
 * The row is auto-created via trigger on user_roles INSERT (Migration 016), so SELECT
 * is expected to find a row for any signed-in user.
 *
 * Microtask wrap on early-return setState calls satisfies react-hooks/set-state-in-effect
 * (same pattern as useEventRideCounts.js and useRides.js).
 */
export function usePreferences() {
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

  const updatePreference = useCallback(
    async (column, value) => {
      if (!userId || !orgId) return;
      const previous = preferences;
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
    [userId, orgId, preferences]
  );

  const mergePreferenceJson = useCallback(
    async (column, partial) => {
      if (!userId || !orgId || !preferences) return;
      const current = preferences[column] ?? {};
      const next = { ...current, ...partial };
      await updatePreference(column, next);
    },
    [userId, orgId, preferences, updatePreference]
  );

  return {
    preferences,
    loading,
    error,
    updatePreference,
    mergePreferenceJson,
  };
}
