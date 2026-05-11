// Wave 4.4-B Session 5d-b-2 — admin's saved-favorite audience presets.
// Backed by user_preferences.favorite_audiences JSONB column (added
// in migration 20260511230000).
//
// Shape per entry: { id, label, audience_type, audience_filter, created_at }
// Persistence: upsert against user_preferences (handles missing row +
// existing row in one call). org_id is required by the table; we read
// it from useAuth.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // Fallback for ancient environments — should never hit in vitest/jsdom
  // or modern browsers, but defensive.
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useFavoriteAudiences() {
  const { orgId, user } = useAuth();
  const userId = user?.id;
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (!userId) { setFavorites([]); setLoading(false); return; }
      const { data, error } = await supabase
        .from('user_preferences')
        .select('favorite_audiences')
        .eq('user_id', userId)
        .maybeSingle();
      if (cancelled) return;
      if (error) { setFavorites([]); setLoading(false); return; }
      setFavorites(Array.isArray(data?.favorite_audiences) ? data.favorite_audiences : []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [userId]);

  const persist = useCallback(async (next) => {
    if (!userId || !orgId) return;
    const prev = favorites;
    setFavorites(next);
    const { error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, org_id: orgId, favorite_audiences: next }, { onConflict: 'user_id' });
    if (error) { setFavorites(prev); console.warn('[useFavoriteAudiences] persist failed', error.message); }
  }, [favorites, userId, orgId]);

  const add = useCallback((audience_type, audience_filter, label) => {
    const entry = { id: newId(), label, audience_type, audience_filter, created_at: new Date().toISOString() };
    return persist([...favorites, entry]);
  }, [favorites, persist]);

  const remove = useCallback((id) => {
    return persist(favorites.filter((f) => f.id !== id));
  }, [favorites, persist]);

  return { favorites, loading, add, remove };
}
