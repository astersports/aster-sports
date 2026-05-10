// Wave 4.1d-2 §5.2 — minimal player multi-select for academy_callup_notice.
//
// Filters to players where roster_type='futures_academy' OR
// member_type='futures_academy' (call-ups are typically Academy
// players invited to play up). Falls back to all active players if
// the org has no Academy roster yet.

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

const overlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 };
const sheetStyle = { backgroundColor: 'var(--em-bg-card)', borderRadius: 14, maxWidth: 480, width: '100%', maxHeight: '82vh', display: 'flex', flexDirection: 'column' };
const headerStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottom: '1px solid var(--em-border-subtle)' };
const inputStyle = { width: '100%', minHeight: 40, padding: '0 12px', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)' };
const listStyle = { flex: 1, overflowY: 'auto', padding: 8 };
const rowStyle = (active) => ({ width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, border: 'none', textAlign: 'left', backgroundColor: active ? 'var(--em-accent-soft)' : 'transparent', color: 'var(--em-text-primary)' });
const footerStyle = { display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--em-border-subtle)' };
const btn = { flex: 1, minHeight: 40, borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', border: 'none' };

export default function PlayerPicker({ selected, onSelect, onClose }) {
  const { orgId } = useAuth();
  const [players, setPlayers] = useState([]);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState(selected || []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (!orgId) return;
      const { data } = await supabase.from('players')
        .select('id, first_name, last_name, member_type, team_players(team_id, teams(name))')
        .eq('org_id', orgId)
        .order('first_name');
      if (cancelled) return;
      setPlayers((data || []).map((p) => ({
        id: p.id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        teamName: p.team_players?.[0]?.teams?.name || '',
        isAcademy: p.member_type === 'futures_academy',
      })));
    });
    return () => { cancelled = true; };
  }, [orgId]);

  const visible = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    let out = players;
    if (q) out = out.filter((p) => p.name.toLowerCase().includes(q));
    return out;
  }, [players, query]);

  const toggle = (id) => setDraft((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  const apply = () => { onSelect(draft); onClose(); };

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={sheetStyle}>
        <div style={headerStyle}>
          <strong style={{ fontSize: 15 }}>Pick player(s)</strong>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--em-text-secondary)' }}><X size={18} /></button>
        </div>
        <div style={{ padding: 10 }}>
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by first or last name…" style={inputStyle} />
        </div>
        <div style={listStyle}>
          {visible.map((p) => (
            <button key={p.id} type="button" onClick={() => toggle(p.id)} className="sf-press" style={rowStyle(draft.includes(p.id))}>
              <span style={{ flex: 1 }}>{p.name}</span>
              {p.isAcademy && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 9999, color: 'var(--em-academy)', backgroundColor: 'var(--em-academy-soft)' }}>ACADEMY</span>}
              {p.teamName && <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)' }}>{p.teamName}</span>}
            </button>
          ))}
          {!visible.length && <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)', padding: 16, textAlign: 'center' }}>No players match.</div>}
        </div>
        <div style={footerStyle}>
          <button type="button" onClick={onClose} style={{ ...btn, backgroundColor: 'transparent', border: '1px solid var(--em-border-default)', color: 'var(--em-text-primary)' }}>Cancel</button>
          <button type="button" onClick={apply} style={{ ...btn, backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)' }}>Done · {draft.length}</button>
        </div>
      </div>
    </div>
  );
}
