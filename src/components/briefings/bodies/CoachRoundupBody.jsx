/* eslint-disable react-refresh/only-export-components */
// Wave 5 PR 4c — coach_roundup body editor. Picks a coach (from the
// org's staff_profiles) + a date range. State writes:
//   - audience_filter.coach_user_id → state.audience_filter (used by
//     anchorFromState to extract coachUserId).
//   - body.date_range = { start, end } (ISO YYYY-MM-DD).
// Defaults to "today through 7 days out" so a typical Sunday-send
// covers the upcoming week.

import { useEffect, useMemo, useState } from 'react';
import { fieldGap, inputStyle, labelStyle } from './_styles';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

function todayIso() { return new Date().toISOString().slice(0, 10); }
function plusDaysIso(base, days) {
  const dt = new Date(base); dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export const defaultValue = { date_range: { start: todayIso(), end: plusDaysIso(todayIso(), 7) } };

export function validate(v, audienceFilter) {
  const errs = [];
  if (!audienceFilter?.coach_user_id) errs.push('Pick a coach.');
  if (!v?.date_range?.start || !v?.date_range?.end) errs.push('Pick a date range.');
  if (v?.date_range?.start && v?.date_range?.end && v.date_range.start > v.date_range.end) errs.push('Start date must be on or before end date.');
  return errs;
}

export default function CoachRoundupBody({ value, onChange, audienceFilter, onAudienceChange }) {
  const v = useMemo(() => ({ ...defaultValue, ...(value || {}), date_range: { ...defaultValue.date_range, ...(value?.date_range || {}) } }), [value]);
  const set = (patch) => onChange?.(patch);
  const setRange = (patch) => set({ date_range: { ...v.date_range, ...patch } });
  const { orgId, user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!orgId) { setStaff([]); setLoading(false); return; }
      setLoading(true);
      const { data, error } = await supabase.from('staff_profiles')
        .select('user_id, display_name, title').eq('org_id', orgId)
        .not('display_name', 'is', null).order('display_name');
      if (cancelled) return;
      if (error) { setStaff([]); setLoading(false); return; }
      setStaff(data || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [orgId]);

  // Default selection: current user if they're in staff_profiles, else
  // first row. Skip if already set.
  useEffect(() => {
    if (!staff.length || audienceFilter?.coach_user_id) return;
    const me = staff.find((s) => s.user_id === user?.id);
    const pick = me || staff[0];
    if (pick) onAudienceChange?.({ coach_user_id: pick.user_id });
  }, [staff, user?.id, audienceFilter?.coach_user_id, onAudienceChange]);

  return (
    <div style={fieldGap}>
      <label>
        <span style={labelStyle}>Coach</span>
        <select value={audienceFilter?.coach_user_id || ''} onChange={(e) => onAudienceChange?.({ coach_user_id: e.target.value })} style={{ ...inputStyle, padding: '0 10px' }}>
          <option value="">{loading ? 'Loading…' : 'Pick a coach…'}</option>
          {staff.map((s) => (<option key={s.user_id} value={s.user_id}>{s.display_name}{s.title ? ` · ${s.title}` : ''}</option>))}
        </select>
      </label>
      <div style={{ display: 'flex', gap: 12 }}>
        <label style={{ flex: 1 }}>
          <span style={labelStyle}>From</span>
          <input type="date" value={v.date_range.start} onChange={(e) => setRange({ start: e.target.value })} style={inputStyle} />
        </label>
        <label style={{ flex: 1 }}>
          <span style={labelStyle}>To</span>
          <input type="date" value={v.date_range.end} onChange={(e) => setRange({ end: e.target.value })} style={inputStyle} />
        </label>
      </div>
      <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)', lineHeight: 1.4 }}>
        Aggregates every game the coach's teams play in the selected window. Cross-team time conflicts surface in an amber callout at the top.
      </div>
    </div>
  );
}
