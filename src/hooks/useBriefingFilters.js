// Wave 3.12 — per-admin filter persistence backed by
// briefing_inbox_preferences (composite PK user_id + org_id).
//
// Anti-pattern #25: composite PK requires onConflict: 'user_id,org_id'.
// Single-column conflict raises 42P10.
//
// Filter shape (in-memory):
//   { kind: string|null, teams: uuid[], dateRange:
//     'all'|'this_week'|'last_14_days'|'last_30_days' }
// Wave 4.8 UX (PR #123): 'today' and 'next_7_days' retired from the
// chip UI to match the briefing_active_queue RPC's accepted values.
// Defensive shims in useInboxQueue.js + useInboxHistory.js still
// accept the legacy values for stale stored prefs.
//
// Wave 4.1d-2 §1.3 — default dateRange changed from 'all' to
// 'last_14_days' so the inbox surfaces the recent past games that
// admins compose recaps for. Per-admin saved prefs in
// briefing_inbox_preferences override this default.

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const DEFAULTS = { kind: null, teams: [], dateRange: 'last_14_days' };
const DEBOUNCE_MS = 1000;

function fromRow(row) {
  if (!row) return DEFAULTS;
  return {
    kind: row.default_kind_filter?.[0] || null,
    teams: row.default_team_filter || [],
    // §1.3: legacy rows with 'all' get bumped to the new default.
    dateRange: row.default_date_filter || 'last_14_days',
  };
}

function toUpsertPayload({ userId, orgId, filters }) {
  return {
    user_id: userId, org_id: orgId,
    default_kind_filter: filters.kind ? [filters.kind] : null,
    default_team_filter: filters.teams?.length ? filters.teams : null,
    default_date_filter: filters.dateRange || 'all',
    updated_at: new Date().toISOString(),
  };
}

export function useBriefingFilters() {
  const { user, orgId } = useAuth();
  const [filters, setFilters] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (!user?.id || !orgId) return;
      // AP #37 — org_id first on org-scoped tables.
      const { data, error } = await supabase.from('briefing_inbox_preferences').select('*').eq('org_id', orgId).eq('user_id', user.id).maybeSingle();
      if (cancelled) return;
      if (error) throw error;
      setFilters(fromRow(data));
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [user?.id, orgId]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const update = useCallback((patch) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!user?.id || !orgId) return;
        supabase.from('briefing_inbox_preferences').upsert(toUpsertPayload({ userId: user.id, orgId, filters: next }), { onConflict: 'user_id,org_id' }).then(({ error }) => { if (error) console.error('briefing_inbox_preferences upsert:', error.message); });
      }, DEBOUNCE_MS);
      return next;
    });
  }, [user?.id, orgId]);

  const clear = useCallback(() => update(DEFAULTS), [update]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { filters, loaded, update, clear };
}
