// Wave 3.13 — locked anchor chip. Shown in StepAnchorAudience when
// the composer was opened with anchor pre-populated (anchor-page
// entry). Resolves anchor name async; admin can override via the
// unlock button (rare).

import { Lock, Unlock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const wrap = { display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, border: '1.5px solid var(--as-accent)', backgroundColor: 'var(--as-accent-soft)' };
const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--as-text-tertiary)' };
const nameStyle = { fontSize: 14, fontWeight: 600, color: 'var(--as-text-primary)' };
const unlockBtn = { marginLeft: 'auto', minHeight: 36, padding: '0 10px', borderRadius: 8, border: 'none', backgroundColor: 'transparent', color: 'var(--as-text-secondary)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 };

async function resolveAnchorName(kind, id) {
  if (!id) return '';
  if (kind === 'org') return 'All Aster AAU families';
  if (kind === 'event') {
    const { data } = await supabase.from('events').select('title,start_at,teams(name)').eq('id', id).maybeSingle();
    if (!data) return '(event not found)';
    const date = data.start_at ? new Date(data.start_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' }) : '';
    return [data.teams?.name, data.title, date].filter(Boolean).join(' · ');
  }
  if (kind === 'tournament') {
    const { data } = await supabase.from('tournaments').select('name,start_date,end_date').eq('id', id).maybeSingle();
    if (!data) return '(tournament not found)';
    const range = [data.start_date, data.end_date].filter(Boolean).join(' – ');
    return [data.name, range].filter(Boolean).join(' · ');
  }
  if (kind === 'team') {
    const { data } = await supabase.from('teams').select('name').eq('id', id).maybeSingle();
    return data?.name || '(team not found)';
  }
  return '';
}

export default function LockedAnchorChip({ anchorKind, anchorId, onUnlock }) {
  const [name, setName] = useState('');
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      const n = await resolveAnchorName(anchorKind, anchorId);
      if (!cancelled) setName(n);
    });
    return () => { cancelled = true; };
  }, [anchorKind, anchorId]);
  return (
    <div style={wrap} role="status">
      <Lock size={14} strokeWidth={1.75} color="var(--as-accent)" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={labelStyle}>{anchorKind || 'anchor'}</span>
        <span style={nameStyle}>{name || '…'}</span>
      </div>
      {onUnlock && (
        <button type="button" onClick={onUnlock} className="as-press" style={unlockBtn} aria-label="Switch anchor">
          <Unlock size={12} strokeWidth={1.75} /> Switch
        </button>
      )}
    </div>
  );
}
