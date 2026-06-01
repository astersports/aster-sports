/* eslint-disable react-refresh/only-export-components */
// Wave 5 PR 5c — family_guide body editor. Picks a parent (from
// the org's guardians who have a user_id) + a date range. State
// writes:
//   - audience_filter.parent_user_id → state.audience_filter
//     (resolver registry's anchorFromState extracts parentUserId)
//   - body.date_range = { start, end } (ISO YYYY-MM-DD).
// Default range: today through 7 days out. Default parent: current
// user if they're a guardian in this org, else first guardian.

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
  if (!audienceFilter?.parent_user_id) errs.push('Pick a parent.');
  if (!v?.date_range?.start || !v?.date_range?.end) errs.push('Pick a date range.');
  if (v?.date_range?.start && v?.date_range?.end && v.date_range.start > v.date_range.end) errs.push('Start date must be on or before end date.');
  return errs;
}

export default function FamilyGuideBody({ value, onChange, audienceFilter, onAudienceChange }) {
  const v = useMemo(() => ({ ...defaultValue, ...(value || {}), date_range: { ...defaultValue.date_range, ...(value?.date_range || {}) } }), [value]);
  const set = (patch) => onChange?.(patch);
  const setRange = (patch) => set({ date_range: { ...v.date_range, ...patch } });
  const { orgId, user } = useAuth();
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!orgId) { setGuardians([]); setLoading(false); return; }
      setLoading(true);
      const { data, error } = await supabase.from('guardians')
        .select('user_id, first_name, last_name, email')
        .eq('org_id', orgId)
        .not('user_id', 'is', null)
        .order('last_name');
      if (cancelled) return;
      if (error) { setGuardians([]); setLoading(false); return; }
      setGuardians(data || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [orgId]);

  // Default selection: current user if they're in guardians, else
  // first row. Skip if already set.
  useEffect(() => {
    if (!guardians.length || audienceFilter?.parent_user_id) return;
    const me = guardians.find((g) => g.user_id === user?.id);
    const pick = me || guardians[0];
    if (pick) onAudienceChange?.({ parent_user_id: pick.user_id });
  }, [guardians, user?.id, audienceFilter?.parent_user_id, onAudienceChange]);

  return (
    <div style={fieldGap}>
      <label>
        <span style={labelStyle}>Parent</span>
        <select value={audienceFilter?.parent_user_id || ''} onChange={(e) => onAudienceChange?.({ parent_user_id: e.target.value })} style={{ ...inputStyle, padding: '0 10px' }}>
          <option value="">{loading ? 'Loading…' : 'Pick a parent…'}</option>
          {guardians.map((g) => (<option key={g.user_id} value={g.user_id}>{g.first_name} {g.last_name}{g.email ? ` · ${g.email}` : ''}</option>))}
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
        One briefing for the parent across every kid on their roster. Cross-kid time conflicts (same-day overlap or tight travel) surface in an amber callout at the top.
      </div>
    </div>
  );
}
