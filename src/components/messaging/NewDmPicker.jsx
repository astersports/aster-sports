import { useEffect, useState } from 'react';
import { X, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function NewDmPicker({ onSelect, onClose }) {
  const { user, orgId } = useAuth();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!orgId) return;
    supabase.from('user_roles').select('user_id, role')
      .eq('organization_id', orgId)
      .neq('user_id', user.id)
      .then(({ data }) => {
        const rows = (data || []).map((r) => ({ userId: r.user_id, role: r.role, name: '' }));
        Promise.all(rows.map(async (r) => {
          if (r.role === 'parent') {
            const { data: g } = await supabase.from('guardians').select('first_name, last_name').eq('user_id', r.userId).maybeSingle();
            r.name = g ? `${g.first_name} ${g.last_name}` : 'Parent';
          } else {
            const { data: m } = await supabase.from('org_members').select('first_name, last_name').eq('user_id', r.userId).maybeSingle();
            r.name = m ? `${m.first_name} ${m.last_name}` : r.role;
          }
          return r;
        })).then(setMembers);
      });
  }, [orgId, user]);

  const filtered = search
    ? members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    : members;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      backgroundColor: 'var(--em-bg-page)', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--em-border-default)' }}>
        <button type="button" onClick={onClose} className="sf-press" aria-label="Close"
          style={{ width: 36, height: 36, borderRadius: 10, border: 'none', backgroundColor: 'var(--em-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={18} strokeWidth={1.75} color="var(--em-text-primary)" />
        </button>
        <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)' }}>New Message</span>
      </div>
      <div style={{ padding: '8px 16px' }}>
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search people…" autoFocus
          style={{
            width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 10,
            border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)',
            fontSize: 15, color: 'var(--em-text-primary)', fontFamily: 'inherit',
          }}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        {filtered.map((m) => (
          <button
            key={m.userId} type="button" onClick={() => onSelect(m.userId)}
            className="sf-press"
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
              border: 'none', width: '100%', textAlign: 'left', fontFamily: 'inherit',
              cursor: 'pointer', backgroundColor: 'transparent',
              borderBottom: '1px solid var(--em-border-subtle)',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--em-bg-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <User size={16} strokeWidth={1.75} color="var(--em-text-tertiary)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--em-text-primary)' }}>{m.name}</div>
              <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)', textTransform: 'capitalize' }}>{m.role}</div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && members.length > 0 && (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--em-text-tertiary)', fontSize: 14 }}>No results</div>
        )}
      </div>
    </div>
  );
}
