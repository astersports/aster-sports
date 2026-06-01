import { useEffect, useState } from 'react';
import { User, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export default function NewDmPicker({ onSelect, onClose }) {
  const { user, orgId } = useAuth();
  const trapRef = useFocusTrap(true);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!orgId) return;
    supabase.from('user_roles').select('user_id, role')
      .eq('organization_id', orgId)
      .neq('user_id', user.id)
      .then(({ data, error }) => {
        if (error) { console.error('NewDmPicker user_roles:', error.message); return; }
        const rows = (data || []).map((r) => ({ userId: r.user_id, role: r.role, name: '' }));
        Promise.all(rows.map(async (r) => {
          if (r.role === 'parent') {
            const { data: g, error: gErr } = await supabase.from('guardians').select('first_name, last_name').eq('user_id', r.userId).maybeSingle();
            if (gErr) console.error('NewDmPicker guardians:', gErr.message);
            r.name = g ? `${g.first_name} ${g.last_name}` : 'Parent';
          } else {
            const { data: m, error: mErr } = await supabase.from('staff_profiles').select('display_name').eq('user_id', r.userId).eq('org_id', orgId).maybeSingle();
            if (mErr) console.error('NewDmPicker staff_profiles:', mErr.message);
            r.name = m?.display_name || r.role;
          }
          return r;
        })).then(setMembers);
      });
  }, [orgId, user]);

  const filtered = search
    ? members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    : members;

  return (
    <div ref={trapRef} role="dialog" aria-modal="true" aria-label="New message"
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        backgroundColor: 'var(--as-bg-page)', display: 'flex', flexDirection: 'column',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--as-border-default)' }}>
        <button type="button" onClick={onClose} className="as-press" aria-label="Close"
          style={{ width: 36, height: 36, borderRadius: 10, border: 'none', backgroundColor: 'var(--as-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={18} strokeWidth={1.75} color="var(--as-text-primary)" />
        </button>
        <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)' }}>New Message</span>
      </div>
      <div style={{ padding: '8px 16px' }}>
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search people…" autoFocus
          style={{
            width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 10,
            border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)',
            fontSize: 15, color: 'var(--as-text-primary)', fontFamily: 'inherit',
          }}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        {filtered.map((m) => (
          <button
            key={m.userId} type="button" onClick={() => onSelect(m.userId)}
            className="as-press"
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
              border: 'none', width: '100%', textAlign: 'left', fontFamily: 'inherit',
              cursor: 'pointer', backgroundColor: 'transparent',
              borderBottom: '1px solid var(--as-border-subtle)',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--as-bg-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <User size={16} strokeWidth={1.75} color="var(--as-text-tertiary)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--as-text-primary)' }}>{m.name}</div>
              <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)', textTransform: 'capitalize' }}>{m.role}</div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && members.length > 0 && (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--as-text-tertiary)', fontSize: 14 }}>No results</div>
        )}
      </div>
    </div>
  );
}
