import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const DEBOUNCE_MS = 500;
const SAVED_FLASH_MS = 1500;
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000];
const AUDIT_FIELDS = ['our_score', 'opponent_score', 'quarter_scores', 'player_of_game_id', 'coach_highlight', 'result', 'point_differential'];

function emptyShell(eventId) {
  return { event_id: eventId, our_score: null, opponent_score: null, quarter_scores: null, player_of_game_id: null, coach_highlight: null, result: null, point_differential: null, published_at: null };
}

function derive(s) {
  if (s.our_score == null || s.opponent_score == null) return { ...s, result: null, point_differential: null };
  const diff = s.our_score - s.opponent_score;
  return { ...s, result: diff > 0 ? 'W' : diff < 0 ? 'L' : 'T', point_differential: diff };
}

function computeDiff(prior, next) {
  const changed = {}, prev = {};
  for (const f of AUDIT_FIELDS) {
    if (JSON.stringify(prior[f]) !== JSON.stringify(next[f])) { changed[f] = next[f]; prev[f] = prior[f]; }
  }
  return { fieldsChanged: changed, priorValues: prev };
}

const WRITE_COLS = { our_score: true, opponent_score: true, quarter_scores: true, player_of_game_id: true, coach_highlight: true, result: true, point_differential: true };
function pickWriteFields(r) {
  const out = {};
  for (const k in WRITE_COLS) out[k] = r[k] ?? null;
  return out;
}

export default function useScoreDraft(eventId) {
  const { user } = useAuth();
  const [result, setResult] = useState(() => emptyShell(eventId));
  const [state, setState] = useState('idle');
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const retryRef = useRef(0);
  const retryTimerRef = useRef(null);
  const serverRef = useRef(null);
  const flashRef = useRef(null);
  // resultRef + performSaveRef: canonical React 19 fixes per the refs
  // + immutability rules. resultRef mirrors `result` for async reads
  // (1-frame lag safe — all consumers async). performSaveRef breaks
  // self-recursion in retry setTimeout. Revisit when useEffectEvent ships.
  const resultRef = useRef(result);
  const performSaveRef = useRef(null);
  useEffect(() => { resultRef.current = result; }, [result]);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    supabase.from('game_results').select('*').eq('event_id', eventId).maybeSingle()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) { setState('error'); setError(err); return; }
        if (data) { setResult(data); serverRef.current = data; }
        setState('idle');
      });
    return () => { cancelled = true; };
  }, [eventId]);

  const performSave = useCallback(async () => {
    setState('saving');
    const r = resultRef.current;
    const priorPub = serverRef.current?.published_at ?? null;
    const editorName = user?.user_metadata?.full_name || user?.email || 'Unknown';
    try {
      let saved;
      if (r.id) {
        const { data, error: e } = await supabase.from('game_results').update(pickWriteFields(r)).eq('id', r.id).select().single();
        if (e) throw e;
        saved = data;
      } else {
        const { data, error: e } = await supabase.from('game_results').insert({ ...pickWriteFields(r), event_id: eventId, entered_by: user?.id ?? null }).select().single();
        if (e) throw e;
        saved = data;
        setResult(prev => ({ ...prev, id: saved.id, entered_by: saved.entered_by }));
      }
      if (priorPub && serverRef.current) {
        const { fieldsChanged, priorValues } = computeDiff(serverRef.current, saved);
        if (Object.keys(fieldsChanged).length > 0) {
          const { error: ae } = await supabase.from('game_result_edits').insert({ game_result_id: saved.id, editor_user_id: user?.id ?? null, editor_name: editorName, fields_changed: fieldsChanged, prior_values: priorValues });
          if (ae) console.warn('Audit row INSERT failed:', ae.message);
        }
      }
      serverRef.current = saved;
      retryRef.current = 0;
      setState('saved'); setLastSaved(new Date()); setError(null);
      if (flashRef.current) clearTimeout(flashRef.current);
      flashRef.current = setTimeout(() => setState(s => s === 'saved' ? 'idle' : s), SAVED_FLASH_MS);
    } catch (err) {
      retryRef.current += 1;
      if (retryRef.current >= 5) { setState('error'); setError(err); return; }
      retryTimerRef.current = setTimeout(() => performSaveRef.current?.(), RETRY_DELAYS[retryRef.current - 1] ?? 16000);
    }
  }, [eventId, user]);
  useEffect(() => { performSaveRef.current = performSave; }, [performSave]);

  const updateField = useCallback((name, value) => {
    setResult(prev => derive({ ...prev, [name]: value }));
    setState('dirty');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(performSave, DEBOUNCE_MS);
  }, [performSave]);

  const updateFields = useCallback((partial) => {
    setResult(prev => derive({ ...prev, ...partial }));
    setState('dirty');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(performSave, DEBOUNCE_MS);
  }, [performSave]);

  const publish = useCallback(async () => {
    if (resultRef.current.our_score == null || resultRef.current.opponent_score == null) throw new Error('Both scores required to publish');
    setState('saving');
    try {
      const { data, error: e } = await supabase.from('game_results').update({ published_at: new Date().toISOString(), published_by: user?.id ?? null }).eq('id', resultRef.current.id).select().single();
      if (e) throw e;
      serverRef.current = data; setResult(data);
      setState('saved'); setLastSaved(new Date());
      if (flashRef.current) clearTimeout(flashRef.current);
      flashRef.current = setTimeout(() => setState(s => s === 'saved' ? 'idle' : s), SAVED_FLASH_MS);
    } catch (err) { setState('error'); setError(err); throw err; }
  }, [user]);

  const unpublish = useCallback(async () => {
    setState('saving');
    try {
      const { data, error: e } = await supabase.from('game_results').update({ published_at: null }).eq('id', resultRef.current.id).select().single();
      if (e) throw e;
      serverRef.current = data; setResult(data);
      setState('saved'); setLastSaved(new Date());
      if (flashRef.current) clearTimeout(flashRef.current);
      flashRef.current = setTimeout(() => setState(s => s === 'saved' ? 'idle' : s), SAVED_FLASH_MS);
    } catch (err) { setState('error'); setError(err); }
  }, []);

  const retry = useCallback(() => { retryRef.current = 0; setError(null); performSave(); }, [performSave]);

  useEffect(() => () => { [debounceRef, flashRef, retryTimerRef].forEach((r) => { if (r.current) clearTimeout(r.current); }); }, []);

  return { result, state, lastSaved, error, isPublished: !!result.published_at, updateField, updateFields, publish, unpublish, retry };
}
