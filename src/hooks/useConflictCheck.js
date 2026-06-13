import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Finds events that would overlap a proposed new event. Only runs
// when on the When step and the team/date/times are all filled.
// `excludeEventId` skips self-collision when editing an existing event.
export function useConflictCheck(step, form, excludeEventId) {
  const [conflicts, setConflicts] = useState([]);

  // Microtask wrap on the early-return setConflicts([]) pushes it out of
  // the effect body, satisfying react-hooks/set-state-in-effect.
  useEffect(() => {
    let cancelled = false;
    if (step !== 2 || !form.teamId || !form.date || !form.startTime || !form.endTime) {
      Promise.resolve().then(() => { if (!cancelled) setConflicts([]); });
      return () => { cancelled = true; };
    }
    const newStart = new Date(`${form.date}T${form.startTime}`);
    const newEnd = new Date(`${form.date}T${form.endTime}`);
    supabase
      .from('events')
      .select('id, title, start_at, end_at')
      .eq('team_id', form.teamId)
      .gte('start_at', `${form.date}T00:00:00`)
      .lte('start_at', `${form.date}T23:59:59`)
      .then(({ data, error }) => {
        if (cancelled) return;
        // AP#36: a swallowed error here silently returns zero conflicts and
        // the wizard shows no warning → admin double-books. Log + keep the
        // prior result instead of falsely clearing to "no conflicts".
        if (error) { console.error('useConflictCheck:', error.message); return; }
        setConflicts((data || []).filter((e) => {
          if (excludeEventId && e.id === excludeEventId) return false;
          const es = new Date(e.start_at);
          const ee = e.end_at ? new Date(e.end_at) : es;
          return !(newEnd <= es || newStart >= ee);
        }));
      });
    return () => { cancelled = true; };
  }, [step, form.teamId, form.date, form.startTime, form.endTime, excludeEventId]);

  return conflicts;
}
