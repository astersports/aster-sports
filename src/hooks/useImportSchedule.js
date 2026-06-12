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
import { buildAssignmentRows } from '../lib/import/coverageConflicts';
import { EVENT_DEFAULT_DURATION_MS } from '../lib/eventWindows';

// DB-8 forward fix (SCHEDULE_L99_BUILD_SPEC §1.5, PR-C'): the import
// path wrote end_at NULL — the source of the never-graying-out event
// class. Every imported row now lands with start + the ONE default
// duration. Exported for the §8 acceptance test.
export function buildImportEventRow(r, tournamentId, tournamentName) {
  return {
    team_id: r.resolved.team_id, event_type: 'tournament', title: `${r.team} vs ${r.opponent}`,
    start_at: r.resolved.start_at,
    end_at: new Date(new Date(r.resolved.start_at).getTime() + EVENT_DEFAULT_DURATION_MS).toISOString(),
    tournament_id: tournamentId, tournament_name: tournamentName,
    location_id: r.resolved.location_id, sub_location: r.court || null,
    opponent: r.opponent || null, home_away: r.home_away || 'neutral',
    is_bonus_game: !!r.is_bonus, status: 'scheduled', publish_status: 'published',
  };
}

export function useImportSchedule(tournamentId) {
  const { orgId, user } = useAuth();
  const [state, setState] = useState('idle');
  const [paste, setPaste] = useState('');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [locations, setLocations] = useState([]);
  const [existingEvents, setExistingEvents] = useState([]);
  // Wave 5 follow-up — track commit result so the page can render a
  // success state distinct from the preview, and so the Commit button
  // is gone (the post-commit dedup labels are stale; clicking again
  // would re-insert/re-update the same rows).
  const [lastCommit, setLastCommit] = useState(null);

  const parse = useCallback(async () => {
    if (!paste.trim() || !tournamentId || !orgId) return;
    setState('parsing'); setError(null);
    try {
      const { data: t, error: tErr } = await supabase.from('tournaments').select('id, name, start_date, end_date').eq('id', tournamentId).maybeSingle();
      if (tErr) throw tErr;
      if (!t) throw new Error('Tournament not found');
      setTournament(t);
      const { data: existing, error: exErr } = await supabase.from('events').select('id, team_id, tournament_id, start_at, opponent, location_id, sub_location, is_bonus_game').eq('tournament_id', tournamentId);
      if (exErr) throw exErr;
      setExistingEvents(existing || []);
      const { data, error: invErr } = await supabase.functions.invoke('parse-tournament-schedule', { body: { paste, tournament_id: tournamentId, org_id: orgId } });
      // Edge function returns { error: '...' } in the JSON body on
      // 4xx/5xx, but supabase.functions.invoke surfaces only a generic
      // FunctionsHttpError unless we dig into context. Try the body
      // first (it's parsed even on non-2xx); fall back to invErr.
      if (data?.error) throw new Error(data.error);
      if (invErr) {
        const ctxBody = invErr.context?.body;
        if (ctxBody) {
          try {
            const parsed = typeof ctxBody === 'string' ? JSON.parse(ctxBody) : ctxBody;
            if (parsed?.error) throw new Error(parsed.error);
          } catch (parseErr) { void parseErr; }
        }
        throw invErr;
      }
      setTeams(data.teams || []);
      setLocations(data.venues || []);
      const validated = (data.rows || []).map((r) => validateParsedRow(r, { teams: data.teams, locations: data.venues, tournament: t }));
      const withDedup = validated.map((r) => classifyRowAgainstExisting({ ...r, tournament_id: tournamentId }, existing || []));
      setRows(withDedup);
      setState('preview');
    } catch (e) { setError(e); setState('error'); }
  }, [paste, tournamentId, orgId]);

  // Re-run BOTH validation AND dedup on inline edit. If validation
  // flips a row from error → valid (e.g. operator picks a team via
  // the dropdown after parse couldn't infer one), the dedup early-
  // return on `status === 'error'` would have stamped it 'new'.
  // Without re-running dedup here, that stale 'new' label survives
  // the edit and the commit inserts even when a matching placeholder
  // event already exists — which is exactly what happened on the
  // first real-world parse (May 15, 2026 smoke test → 4 dup events
  // landed alongside 4 pre-existing placeholders).
  const updateRow = useCallback((idx, patch) => {
    setRows((prev) => prev.map((r, i) => {
      if (i !== idx) return r;
      const validated = validateParsedRow({ ...r, ...patch }, { teams, locations, tournament });
      return classifyRowAgainstExisting({ ...validated, tournament_id: tournamentId }, existingEvents);
    }));
  }, [teams, locations, tournament, existingEvents, tournamentId]);

  const removeRow = useCallback((idx) => setRows((prev) => prev.filter((_, i) => i !== idx)), []);

  // Reset back to a clean paste-mode state. Called from the "Import
  // another" button after a successful commit so the operator can
  // queue another paste without page reload (which would wipe the
  // tournament selection).
  const reset = useCallback(() => {
    setState('idle'); setPaste(''); setRows([]); setError(null);
    setExistingEvents([]); setLastCommit(null);
  }, []);

  const commit = useCallback(async () => {
    setState('committing'); setError(null);
    try {
      const newRows = rows.filter((r) => r.status !== 'error' && r.dedup === 'new');
      const toInsert = newRows.map((r) => buildImportEventRow(r, tournamentId, tournament?.name));
      const toUpdate = rows.filter((r) => r.status !== 'error' && r.dedup === 'updated' && r.matched_event_id);
      let insertedIds = [];
      if (toInsert.length) {
        // .select('id') — RETURNING ids in input order so coverage
        // delegations on new rows map positionally to newRows (PR 6-C).
        const { data: ins, error: insErr } = await supabase.from('events').insert(toInsert).select('id');
        if (insErr) throw insErr;
        insertedIds = (ins || []).map((d) => d.id);
      }
      for (const r of toUpdate) {
        const { error: upErr } = await supabase.from('events').update({ start_at: r.resolved.start_at, opponent: r.opponent, location_id: r.resolved.location_id, sub_location: r.court || null }).eq('id', r.matched_event_id);
        if (upErr) throw upErr;
      }
      // Coverage delegations (PR 6-C): write event_coach_assignments for
      // any row the admin reassigned in the conflict banner. Upsert on the
      // composite unique (event_id, coach_user_id) per AP #25.
      const assignmentRows = buildAssignmentRows({ newRows, insertedIds, updatedRows: toUpdate, userId: user?.id ?? null });
      if (assignmentRows.length) {
        const { error: asErr } = await supabase.from('event_coach_assignments').upsert(assignmentRows, { onConflict: 'event_id,coach_user_id' });
        if (asErr) throw asErr;
      }
      const result = { inserted: toInsert.length, updated: toUpdate.length };
      setLastCommit(result);
      setState('done');
      return result;
    } catch (e) { setError(e); setState('error'); throw e; }
  }, [rows, tournamentId, tournament, user]);

  const validation = summarize(rows);
  const dedup = dedupSummary(rows);
  const canCommit = validation.error === 0 && (dedup.new + dedup.updated) > 0;

  return { state, paste, setPaste, rows, error, parse, updateRow, removeRow, commit, reset, lastCommit, validation, dedup, canCommit, teams, locations };
}
