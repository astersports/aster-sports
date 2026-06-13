import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import BottomSheet from '../shared/BottomSheet';
import Label from '../shared/Label';

// Set a coach's per-session rate (the "assign the rate" half of coach comp).
// Updates pay_per_session_cents across the coach's active coaching_assignments
// for THIS season's teams. A single-field control → BottomSheet per AP#15.
export default function CoachRateSheet({ coach, orgId, seasonId, onClose, onSaved }) {
  const [rate, setRate] = useState(coach.rateCents ? String(coach.rateCents / 100) : '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const cents = Math.max(0, Math.round(parseFloat(rate) * 100) || 0);

  const handleSave = async () => {
    setSaving(true); setErr(null);
    const teamsRes = await supabase.from('teams').select('id').eq('org_id', orgId).eq('season_id', seasonId);
    if (teamsRes.error) { setSaving(false); setErr('Couldn’t reach the server. Try again in a moment.'); return; }
    const teamIds = (teamsRes.data || []).map((t) => t.id);
    const { error } = await supabase.from('coaching_assignments')
      .update({ pay_per_session_cents: cents > 0 ? cents : null })
      .eq('org_id', orgId).eq('user_id', coach.userId).in('team_id', teamIds);
    setSaving(false);
    if (error) { setErr('Looks like that didn’t go through. Try again?'); return; }
    onSaved();
  };

  return (
    <BottomSheet open onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)' }}>{coach.name}’s rate</div>
        <div>
          <Label>Pay per session ($)</Label>
          <input type="number" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0.00" aria-label="Pay per session"
            style={{ width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }} />
          <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)', marginTop: 6 }}>Applied to every team this coach is on this season. Leave 0 to mark unpaid.</div>
        </div>
        {err && <div style={{ fontSize: 13, color: 'var(--as-danger)' }}>{err}</div>}
        <button type="button" onClick={handleSave} disabled={saving} className="as-press"
          style={{ minHeight: 48, borderRadius: 10, border: 'none', backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 16, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save rate'}
        </button>
      </div>
    </BottomSheet>
  );
}
