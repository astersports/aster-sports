import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { usePrograms } from '../hooks/usePrograms';
import { EMBER_DISPLAY_NAME } from '../lib/emberDefaults';

const ROLE_LABELS = { admin: 'Admin', coach: 'Coach', parent: 'Parent' };
const VERSION = 'Ember v2.0';

const SectionHeader = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--em-text-tertiary)', marginBottom: 8 }}>{children}</div>
);

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, role, orgName, myChildren, guardianFirstName, signOut } = useAuth();
  const { programs } = usePrograms();
  const [lastName, setLastName] = useState(null);

  useEffect(() => {
    if (role !== 'parent' || !user?.id) return;
    supabase.from('guardians').select('last_name').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setLastName(data?.last_name ?? null));
  }, [role, user?.id]);

  const parentName = [guardianFirstName, lastName].filter(Boolean).join(' ').trim();
  const displayName = (role === 'parent' && parentName) || user?.user_metadata?.full_name || user?.email || 'User';
  const teamName = (teamId) => programs.find((p) => p.id === teamId)?.name || '—';

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--em-bg-page)', padding: '16px 16px 32px' }}>
      <button type="button" onClick={() => navigate(-1)} className="sf-press"
        style={{ display: 'flex', alignItems: 'center', minHeight: 44, padding: '0 8px 0 0', background: 'none', border: 'none', color: 'var(--em-accent)', fontSize: 15, fontWeight: 500, marginBottom: 12 }}>
        <ChevronLeft size={20} strokeWidth={1.75} /> Back
      </button>

      <section style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', boxShadow: 'var(--em-shadow-sm)', padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--em-text-primary)' }}>{displayName}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, backgroundColor: 'var(--em-accent-soft)', color: 'var(--em-accent)' }}>
            {ROLE_LABELS[role] || 'User'}
          </span>
          <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>{orgName || EMBER_DISPLAY_NAME}</span>
        </div>
      </section>

      {role === 'parent' && (myChildren?.length > 0) && (
        <section style={{ marginBottom: 16 }}>
          <SectionHeader>MY CHILDREN</SectionHeader>
          <div style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', overflow: 'hidden' }}>
            {myChildren.map((c, i) => (
              <div key={c.playerId} style={{ padding: '12px 14px', borderTop: i === 0 ? 'none' : '1px solid var(--em-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--em-text-primary)' }}>{c.firstName} {c.lastName}</span>
                <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>{teamName(c.teamId)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginBottom: 16 }}>
        <SectionHeader>PREFERENCES</SectionHeader>
        <div style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', padding: 16, fontSize: 13, color: 'var(--em-text-tertiary)' }}>
          Notification preferences coming soon.
        </div>
      </section>

      <button type="button" onClick={signOut} className="sf-press"
        style={{ width: '100%', minHeight: 44, borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'transparent', color: 'var(--em-danger)', fontSize: 14, fontWeight: 500, marginBottom: 24 }}>
        Sign out
      </button>

      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--em-text-tertiary)' }}>{VERSION}</div>
    </div>
  );
}
