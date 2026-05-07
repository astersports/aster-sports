import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { seedRosters } from '../lib/tournamentRosters';
import { useAuth } from '../context/AuthContext';
import { registerCacheBuster } from '../lib/cacheBuster';

const cache = new Map();
registerCacheBuster(() => cache.clear());
const cacheKey = (orgId, teamId, statusFilter, seasonFilter) =>
  `${orgId}:${teamId || 'all'}:${statusFilter || 'all'}:${seasonFilter || 'active'}`;

// Fetches tournaments scoped to the current org. Supports team filter (when
// mounted from a team page), status filter chips, season scoping, and
// pagination. Exposes CRUD mutations. Every query is scoped to org_id.
//
// Shape returned per tournament:
// { id, name, circuit, start_date, end_date, primary_venue, primary_venue_address,
//   tourney_url, hotel_url, hotel_deadline_at, rsvp_deadline_at, survival_notes,
//   schedule_status, status, archived_at, teams: [{ id, name, sort_order, team_color }] }

export function useTournaments({ teamId, statusFilter = 'all', seasonFilter = 'active', limit = 20 } = {}) {
  const { orgId } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const offsetRef = useRef(0);

  const fetch = useCallback(async ({ append = false } = {}) => {
    if (!orgId) return;
    if (!append) offsetRef.current = 0;
    if (!append) cache.delete(cacheKey(orgId, teamId, statusFilter, seasonFilter));
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('tournaments')
        .select('id, name, circuit, start_date, end_date, primary_venue, primary_venue_address, tourney_url, hotel_url, hotel_deadline_at, rsvp_deadline_at, survival_notes, schedule_status, status, archived_at, tournament_teams(team_id, teams(id, name, sort_order, team_color))')
        .eq('org_id', orgId)
        .is('archived_at', null)
        .order('start_date', { ascending: false })
        .range(offsetRef.current, offsetRef.current + limit - 1);

      if (statusFilter === 'upcoming') query = query.in('status', ['planned', 'scheduled']);
      else if (statusFilter !== 'all') query = query.eq('status', statusFilter);

      if (seasonFilter === 'active') {
        const { data: season } = await supabase
          .from('seasons').select('start_date, end_date')
          .eq('org_id', orgId).eq('status', 'active').maybeSingle();
        if (season) {
          query = query.gte('start_date', season.start_date).lte('start_date', season.end_date);
        }
      }

      const { data, error: err } = await query;
      if (err) throw err;

      let rows = (data || []).map((t) => ({
        ...t,
        teams: (t.tournament_teams || [])
          .map((tt) => tt.teams).filter(Boolean)
          .sort((a, b) => a.sort_order - b.sort_order),
      }));
      const preFilterCount = rows.length;
      if (teamId) rows = rows.filter((t) => t.teams.some((team) => team.id === teamId));

      if (append) {
        setTournaments((prev) => [...prev, ...rows]);
      } else {
        setTournaments(rows);
      }
      setHasMore(preFilterCount === limit);
      offsetRef.current += rows.length;
      cache.set(cacheKey(orgId, teamId, statusFilter, seasonFilter), rows);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [orgId, teamId, statusFilter, seasonFilter, limit]);

  useEffect(() => {
    const key = cacheKey(orgId, teamId, statusFilter, seasonFilter);
    const cached = cache.get(key);
    if (cached) { setTournaments(cached); setLoading(false); }
    fetch();
  }, [fetch, orgId, teamId, statusFilter, seasonFilter]);

  const loadMore = useCallback(() => { if (hasMore && !loading) fetch({ append: true }); }, [fetch, hasMore, loading]);

  const create = async ({ teamIds, ...fields }) => {
    if (!orgId) return { error: new Error('No orgId') };
    const { data: t, error: err } = await supabase
      .from('tournaments')
      .insert({ ...fields, org_id: orgId })
      .select().single();
    if (err) return { error: err };
    if (teamIds?.length) {
      const links = teamIds.map((tid) => ({ tournament_id: t.id, team_id: tid }));
      const { error: linkErr } = await supabase.from('tournament_teams').insert(links);
      if (linkErr) return { error: linkErr };
      await seedRosters(t.id, teamIds);
    }
    await fetch();
    return { data: t };
  };

  const update = async (id, { teamIds, ...fields }) => {
    const { error: err } = await supabase.from('tournaments').update(fields).eq('id', id);
    if (err) return { error: err };
    if (teamIds) {
      const { data: existing } = await supabase
        .from('tournament_teams').select('team_id').eq('tournament_id', id);
      const existingIds = (existing || []).map((r) => r.team_id);
      const toAdd = teamIds.filter((x) => !existingIds.includes(x));
      const toRemove = existingIds.filter((x) => !teamIds.includes(x));
      if (toAdd.length) {
        await supabase.from('tournament_teams').insert(toAdd.map((tid) => ({ tournament_id: id, team_id: tid })));
        await seedRosters(id, toAdd);
      }
      if (toRemove.length) {
        await supabase.from('tournament_teams').delete().eq('tournament_id', id).in('team_id', toRemove);
      }
    }
    await fetch();
    return { data: true };
  };

  const archive = async (id) => {
    const { error: err } = await supabase
      .from('tournaments').update({ archived_at: new Date().toISOString() }).eq('id', id);
    if (err) return { error: err };
    await fetch();
    return { data: true };
  };

  return { tournaments, loading, error, hasMore, loadMore, create, update, archive, refetch: fetch };
}
