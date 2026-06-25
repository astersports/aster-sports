import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

// On edit, prefill the wizard form with recurrence (pattern + until from
// sibling dates) and existing volunteer slots. Extracted from
// CreateActivityWizard to keep that component under the 150-line cap
// (CLAUDE.md §6). setForm is the wizard's state setter.
export function useEditEventPrefill({ isEdit, editEvent, orgId, setForm }) {
  // Recurrence (pattern + until) from sibling dates. Phase 1 audit P1-2:
  // org_id added as defense-in-depth; parent_event_id isolation is
  // practically sufficient but the canonical pattern requires org scope.
  useEffect(() => {
    if (!isEdit || !editEvent?.parent_event_id || !orgId) return;
    let cancelled = false;
    supabase.from('events').select('start_at')
      .eq('org_id', orgId)
      .eq('parent_event_id', editEvent.parent_event_id)
      .order('start_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.error('useEditEventPrefill recurrence:', error.message); return; }
        if (!data || data.length < 2) return;
        const days = Math.round((new Date(data[1].start_at) - new Date(data[0].start_at)) / 86400000);
        const pattern = days === 14 ? 'biweekly' : 'weekly';
        const until = data[data.length - 1].start_at.slice(0, 10);
        setForm((f) => ({ ...f, recurrence: { pattern, until } }));
      });
    return () => { cancelled = true; };
  }, [isEdit, editEvent?.parent_event_id, orgId, setForm]);

  // Existing volunteer slots into the DutyEditor.
  useEffect(() => {
    if (!isEdit || !editEvent?.id) return;
    let cancelled = false;
    supabase.from('event_duties').select('*').eq('event_id', editEvent.id)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.error('useEditEventPrefill duties:', error.message); return; }
        if (!data || data.length === 0) return;
        const grouped = {};
        data.forEach((d) => {
          if (!grouped[d.duty_name]) grouped[d.duty_name] = { duty_name: d.duty_name, slots_needed: 0, claimed: 0 };
          grouped[d.duty_name].slots_needed += 1;
          if (d.claimed_by_name || d.guardian_id) grouped[d.duty_name].claimed += 1;
        });
        setForm((f) => ({ ...f, duties: Object.values(grouped) }));
      });
    return () => { cancelled = true; };
  }, [isEdit, editEvent?.id, setForm]);
}
