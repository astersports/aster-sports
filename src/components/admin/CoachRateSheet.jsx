import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import FullScreenForm from '../shared/FullScreenForm';
import Label from '../shared/Label';
import CoachRateRow from './CoachRateRow';

// A coach's pay settings: a PER-ASSIGNMENT rate (one row per coaching_assignments
// row — each saves on its own, touching exactly that team's row, NOT fanning across
// every team the coach is on [the PR-4b clobber fix]) + a coach-level DEFAULT payout
// method. 3+ controls → FullScreenForm (AP#15). Rates flow to FUTURE sessions via the
// PR-4a stamp trigger; editing a rate never touches existing pay_cents/owed/paid.
const METHODS = [
  { value: '', label: 'No default' }, { value: 'zelle', label: 'Zelle' }, { value: 'venmo', label: 'Venmo' },
  { value: 'cash', label: 'Cash' }, { value: 'check', label: 'Check' }, { value: 'stripe', label: 'Card/Stripe' }, { value: 'other', label: 'Other' },
];
const field = { width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' };
const note = { fontSize: 12, color: 'var(--as-text-tertiary)' };

export default function CoachRateSheet({ coach, orgId, onClose, onSaved }) {
  const [rows, setRows] = useState(null); // null = loading
  const [method, setMethod] = useState(coach.defaultMethod || '');
  const [mSaving, setMSaving] = useState(false);
  const [mErr, setMErr] = useState(null);
  const mRef = useRef(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('coaching_assignments')
      .select('id, role, scope, pay_per_session_cents, teams!inner(name, sort_order)')
      .eq('org_id', orgId).eq('user_id', coach.userId).eq('active', true);
    if (error) { console.error('CoachRateSheet load:', error.message); setRows([]); return; }
    setRows((data || []).map((r) => ({
      id: r.id, role: r.role, scope: r.scope, pay_per_session_cents: r.pay_per_session_cents,
      teamName: r.teams?.name || '—', sort: r.teams?.sort_order ?? 99,
    })).sort((a, b) => a.sort - b.sort));
  }, [orgId, coach.userId]);
  useEffect(() => { Promise.resolve().then(load); }, [load]);

  const afterRowSave = () => { load(); onSaved(); };

  const methodDirty = (method || '') !== (coach.defaultMethod || '');
  const saveMethod = async () => {
    if (mRef.current || !methodDirty) return;
    mRef.current = true; setMSaving(true); setMErr(null);
    const { error } = await supabase.from('staff_profiles')
      .update({ default_payout_method: method || null })
      .eq('org_id', orgId).eq('user_id', coach.userId);
    mRef.current = false; setMSaving(false);
    if (error) { console.error('CoachRateSheet method:', error.message); setMErr('Looks like that didn’t go through. Try again?'); return; }
    onSaved();
  };

  return (
    <FullScreenForm open title={`${coach.name} — pay settings`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <Label>Rate per team</Label>
          <div style={{ ...note, margin: '2px 0 8px' }}>Each team’s rate saves on its own. Clear a field to mark that team unpaid. Future sessions use the new rate — past pay is unchanged.</div>
          {rows === null ? (
            <div style={{ padding: 16, textAlign: 'center', ...note, fontSize: 13 }}>Loading…</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', ...note, fontSize: 13 }}>No active assignments for this coach.</div>
          ) : (
            <div style={{ backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', overflow: 'hidden' }}>
              {/* key includes the saved rate so a row remounts (resets its input to
                  the new DB value) after its OWN save — other rows' in-progress edits
                  survive (their rate, hence key, is unchanged by a sibling save). */}
              {rows.map((r, i) => <CoachRateRow key={`${r.id}:${r.pay_per_session_cents ?? 'null'}`} assignment={r} orgId={orgId} first={i === 0} onSaved={afterRowSave} />)}
            </div>
          )}
        </div>
        <div>
          <Label>Default payout method</Label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Default payout method" style={{ ...field, marginTop: 2 }}>
            {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <div style={{ ...note, margin: '6px 0 8px' }}>Pre-fills how you usually pay this coach.</div>
          {mErr && <div style={{ fontSize: 13, color: 'var(--as-danger)', marginBottom: 8 }}>{mErr}</div>}
          <button type="button" onClick={saveMethod} disabled={mSaving || !methodDirty} className="as-press"
            style={{ minHeight: 44, padding: '0 20px', borderRadius: 10, border: 'none', backgroundColor: methodDirty ? 'var(--as-accent)' : 'var(--as-bg-tertiary)', color: methodDirty ? 'var(--as-text-inverse)' : 'var(--as-text-tertiary)', fontSize: 15, fontWeight: 600, opacity: mSaving ? 0.6 : 1 }}>
            {mSaving ? 'Saving…' : 'Save method'}
          </button>
        </div>
      </div>
    </FullScreenForm>
  );
}
