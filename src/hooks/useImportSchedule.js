// Wave 5 PR 2 — orchestration hook for /admin/import-schedule.
// Single-paste flow: paste → parse (edge fn) → validate (local) →
// dedup-against-existing (local) → preview → commit (bulk insert).
// Per scope read: per-row inline edit before commit; smart diff;
// three-severity validation indicators.

import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { summarize, validateParsedRow } from '../lib/import/scheduleValidation';
import { classifyRowAgainstExisting, dedupSummary } from '../lib/import/scheduleDeduplication';

export function useImportSchedule(tournamentId) {
  const { orgId } = useAuth();
  const [state, setState] = useState('idle');
  const [paste, setPaste] = useState('');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [locations, setLocations] = useState([]);

  const parse = useCallback(async () => {
    if (!paste.trim() || !tournamentId || !orgId) return;
    setState('parsing'); setError(null);
    try {
      const { data: t } = await supabase.from('tournaments').select('id, name, start_date, end_date').eq('id', tournamentId).maybeSingle();
      if (!t) throw new Error('Tournament not found');
      setTournament(t);
      const { data: existing = [] } = await supabase.from('events').select('id, team_id, tournament_id, start_at, opponent, location_id, sub_location, is_bonus_game').eq('tournament_id', tournamentId);
      const { data, error: invErr } = await supabase.functions.invoke('parse-tournament-schedule', { body: { paste, tournament_id: tournamentId, org_id: orgId } });
      if (invErr) throw invErr;
      if (data?.error) throw new Error(data.error);
      setTeams(data.teams || []);
      setLocations(data.venues || []);
      const validated = (data.rows || []).map((r) => validateParsedRow(r, { teams: data.teams, locations: data.venues, tournament: t }));
      const withDedup = validated.map((r) => classifyRowAgainstExisting({ ...r, tournament_id: tournamentId }, existing));
      setRows(withDedup);
      setState('preview');
    } catch (e) { setError(e); setState('error'); }
  }, [paste, tournamentId, orgId]);

  const updateRow = useCallback((idx, patch) => {
    setRows((prev) => prev.map((r, i) => i === idx ? validateParsedRow({ ...r, ...patch }, { teams, locations, tournament }) : r));
  }, [teams, locations, tournament]);

  const removeRow = useCallback((idx) => setRows((prev) => prev.filter((_, i) => i !== idx)), []);

  const commit = useCallback(async () => {
    setState('committing'); setError(null);
    try {
      const toInsert = rows.filter((r) => r.status !== 'error' && r.dedup === 'new').map((r) => ({
        team_id: r.resolved.team_id, event_type: 'tournament', title: `${r.team} vs ${r.opponent}`,
        start_at: r.resolved.start_at, end_at: null,
        tournament_id: tournamentId, tournament_name: tournament?.name,
        location_id: r.resolved.location_id, sub_location: r.court || null,
        opponent: r.opponent || null, home_away: r.home_away || 'neutral',
        is_bonus_game: !!r.is_bonus, status: 'scheduled', publish_status: 'published',
      }));
      const toUpdate = rows.filter((r) => r.status !== 'error' && r.dedup === 'updated' && r.matched_event_id);
      if (toInsert.length) {
        const { error: insErr } = await supabase.from('events').insert(toInsert);
        if (insErr) throw insErr;
      }
      for (const r of toUpdate) {
        const { error: upErr } = await supabase.from('events').update({ start_at: r.resolved.start_at, opponent: r.opponent, location_id: r.resolved.location_id, sub_location: r.court || null }).eq('id', r.matched_event_id);
        if (upErr) throw upErr;
      }
      setState('done');
      return { inserted: toInsert.length, updated: toUpdate.length };
    } catch (e) { setError(e); setState('error'); throw e; }
  }, [rows, tournamentId, tournament]);

  const validation = summarize(rows);
  const dedup = dedupSummary(rows);
  const canCommit = validation.error === 0 && (dedup.new + dedup.updated) > 0;

  return { state, paste, setPaste, rows, error, parse, updateRow, removeRow, commit, validation, dedup, canCommit, teams, locations };
}
