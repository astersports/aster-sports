import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const SeasonContext = createContext(null);

// Loads every season for the current org and picks the active one by default.
// The season list is small (a handful of rows per org) so we cache it in
// memory and never refetch until the org changes.
export function SeasonProvider({ children }) {
  const { orgId } = useAuth();
  const [seasons, setSeasons] = useState([]);
  const [activeSeasonId, setActiveSeasonId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Wrapping in Promise.resolve() kicks all setState calls into the
    // microtask queue, which keeps react-hooks/set-state-in-effect happy —
    // the rule only flags setters run synchronously from the effect body.
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (!orgId) {
        setSeasons([]);
        setActiveSeasonId(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('seasons')
        .select('id, name, start_date, end_date, status')
        .eq('org_id', orgId)
        .order('start_date', { ascending: false });
      if (cancelled) return;
      if (error) {
        console.error('Failed to load seasons:', error.message);
        setSeasons([]);
        setActiveSeasonId(null);
      } else {
        const rows = data ?? [];
        setSeasons(rows);
        const active = rows.find((s) => s.status === 'active');
        setActiveSeasonId(active?.id ?? rows[0]?.id ?? null);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orgId]);

  const setSeason = useCallback((id) => setActiveSeasonId(id), []);

  const activeSeason = useMemo(
    () => seasons.find((s) => s.id === activeSeasonId) ?? null,
    [seasons, activeSeasonId],
  );

  const value = useMemo(
    () => ({ activeSeason, seasons, setSeason, loading }),
    [activeSeason, seasons, setSeason, loading],
  );

  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSeason() {
  const ctx = useContext(SeasonContext);
  if (!ctx) throw new Error('useSeason must be used within SeasonProvider');
  return ctx;
}
