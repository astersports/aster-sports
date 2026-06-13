import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import BottomSheet from '../shared/BottomSheet';
import Label from '../shared/Label';

// A coach's pay settings: per-session RATE (across their season teams, on
// coaching_assignments) + DEFAULT payout method (coach-level, on
// staff_profiles — pre-fills the Record-payout form). Two controls →
// BottomSheet per AP#15.
const METHODS = [
  { value: '', label: 'No default' }, { value: 'zelle', label: 'Zelle' }, { value: 'venmo', label: 'Venmo' },
  { value: 'cash', label: 'Cash' }, { value: 'check', label: 'Check' }, { value: 'stripe', label: 'Card/Stripe' }, { value: 'other', label: 'Other' },
];
const field = { width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' };

export default function CoachRateSheet({ coach, orgId, seasonId, onClose, onSaved }) {
  const [rate, setRate] = useState(coach.rateCents ? String(coach.rateCents / 100) : '');
  const [method, setMethod] = useState(coach.defaultMethod || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const cents = Math.max(0, Math.round(parseFloat(rate) * 100) || 0);

  const handleSave = async () => {
    setSaving(true); setErr(null);
    const teamsRes = await supabase.from('teams').select('id').eq('org_id', orgId).eq('season_id', seasonId);
    if (teamsRes.error) { setSaving(false); setErr('Couldn’t reach the server. Try again in a moment.'); return; }
    const teamIds = (teamsRes.data || []).map((t) => t.id);
    const rateRes = await supabase.from('coaching_assignments')
      .update({ pay_per_session_cents: cents > 0 ? cents : null })
      .eq('org_id', orgId).eq('user_id', coach.userId).in('team_id', teamIds);
    const methodRes = await supabase.from('staff_profiles')
      .update({ default_payout_method: method || null })
      .eq('org_id', orgId).eq('user_id', coach.userId);
    setSaving(false);
    if (rateRes.error || methodRes.error) { setErr('Looks like that didn’t go through. Try again?'); return; }
    onSaved();
  };

  return (
    <BottomSheet open onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)' }}>{coach.name} — pay settings</div>
        <div>
          <Label>Pay per session ($)</Label>
          <input type="number" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0.00" aria-label="Pay per session" style={field} />
          <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)', marginTop: 6 }}>Applied to every team this coach is on this season. Leave 0 to mark unpaid.</div>
        </div>
        <div>
          <Label>Default payout method</Label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Default payout method" style={field}>
            {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)', marginTop: 6 }}>Pre-fills how you usually pay this coach.</div>
        </div>
        {err && <div style={{ fontSize: 13, color: 'var(--as-danger)' }}>{err}</div>}
        <button type="button" onClick={handleSave} disabled={saving} className="as-press"
          style={{ minHeight: 48, borderRadius: 10, border: 'none', backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 16, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </BottomSheet>
  );
}
