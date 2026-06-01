import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/useToast';

const DEFAULT_QUIET = {
  weekday: { start: '21:00', end: '07:00' },
  weekend: { start: '22:00', end: '08:00' },
};

function fmt(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

const timeInput = { minHeight: 36, padding: '0 8px', borderRadius: 8, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 14, fontFamily: 'inherit' };

export default function QuietHoursCard({ userId, orgId }) {
  const { showToast } = useToast();
  const [quiet, setQuiet] = useState(DEFAULT_QUIET);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId || !orgId) return;
    supabase.from('user_preferences')
      .select('quiet_hours').eq('user_id', userId).eq('org_id', orgId).maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('QuietHoursCard:', error.message);
        if (data?.quiet_hours) setQuiet({ ...DEFAULT_QUIET, ...data.quiet_hours });
      });
  }, [userId, orgId]);

  const update = (period, field, value) => {
    setQuiet((prev) => ({ ...prev, [period]: { ...prev[period], [field]: value } }));
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('user_preferences')
      .update({ quiet_hours: quiet, updated_at: new Date().toISOString() })
      .eq('user_id', userId).eq('org_id', orgId);
    setSaving(false);
    if (error) { showToast("Couldn't save. Try again?", 'error'); return; }
    setEditing(false);
    showToast('Quiet hours updated');
  };

  return (
    <div style={{ backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', padding: 16 }}>
      {['weekday', 'weekend'].map((period) => (
        <div key={period} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 15, color: 'var(--as-text-primary)' }}>{period === 'weekday' ? 'Weekdays' : 'Weekends'}</span>
          {editing ? (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input type="time" value={quiet[period]?.start || ''} onChange={(e) => update(period, 'start', e.target.value)} style={timeInput} />
              <span style={{ color: 'var(--as-text-tertiary)', fontSize: 13 }}>–</span>
              <input type="time" value={quiet[period]?.end || ''} onChange={(e) => update(period, 'end', e.target.value)} style={timeInput} />
            </div>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--as-text-tertiary)' }}>
              {fmt(quiet[period]?.start)} – {fmt(quiet[period]?.end)}
            </span>
          )}
        </div>
      ))}
      <div style={{ fontSize: 11, color: 'var(--as-text-tertiary)', marginTop: 4, marginBottom: 8 }}>
        Notifications are silenced during these hours.
      </div>
      {editing ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setEditing(false)} style={{ flex: 1, minHeight: 44, borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-text-primary)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button type="button" onClick={save} disabled={saving} className="as-press" style={{ flex: 1, minHeight: 44, borderRadius: 10, border: 'none', backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.5 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="as-press" style={{ minHeight: 36, padding: '0 14px', borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Edit quiet hours</button>
      )}
    </div>
  );
}
