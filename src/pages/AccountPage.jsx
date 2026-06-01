import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronLeft, Lock, Moon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { usePrograms } from '../hooks/usePrograms';
import { useToast } from '../context/useToast';
import { EMBER_DISPLAY_NAME } from '../lib/emberDefaults';
import Label from '../components/shared/Label';
import NotificationPrefs from '../components/account/NotificationPrefs';
import PushEnableToggle from '../components/account/PushEnableToggle';
import QuietHoursCard from '../components/account/QuietHoursCard';
import StaffProfileCard from '../components/account/StaffProfileCard';

const ROLE_LABELS = { admin: 'Admin', coach: 'Coach', parent: 'Parent' };
const VERSION = 'AsterSports v2.0';

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, role, orgName, orgId, myChildren, guardianFirstName, signOut } = useAuth();
  const { showToast } = useToast();
  const { programs } = usePrograms();
  const [lastName, setLastName] = useState(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (role !== 'parent' || !user?.id) return;
    supabase.from('guardians').select('last_name').eq('user_id', user.id).maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('AccountPage guardianLastName:', error.message);
        setLastName(data?.last_name ?? null);
      });
  }, [role, user?.id]);

  const parentName = [guardianFirstName, lastName].filter(Boolean).join(' ').trim();
  const displayName = (role === 'parent' && parentName) || user?.user_metadata?.full_name || user?.email || 'User';
  const teamName = (teamId) => programs.find((p) => p.id === teamId)?.name || '—';

  const sendPasswordReset = async () => {
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    setResetting(false);
    if (error) showToast("Couldn't send reset email. Try again?", 'error');
    else showToast('Password reset email sent. Check your inbox.', 'success');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--em-bg-page)', padding: '16px 16px 32px' }}>
      <button type="button" onClick={() => navigate(-1)} className="em-press" aria-label="Go back"
        style={{ display: 'flex', alignItems: 'center', minHeight: 44, padding: '0 8px 0 0', background: 'none', border: 'none', color: 'var(--em-accent)', fontSize: 15, fontWeight: 500, marginBottom: 12 }}>
        <ChevronLeft size={20} strokeWidth={1.75} /> Back
      </button>

      <section style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', boxShadow: 'var(--em-shadow-sm)', padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--em-text-primary)' }}>{displayName}</div>
        <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)', marginTop: 2 }}>{user?.email}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, backgroundColor: 'var(--em-accent-soft)', color: 'var(--em-accent)' }}>
            {ROLE_LABELS[role] || 'User'}
          </span>
          <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>{orgName || EMBER_DISPLAY_NAME}</span>
        </div>
      </section>

      {(role === 'admin' || role === 'coach') && (
        <StaffProfileCard defaultDisplayName={user?.user_metadata?.full_name} />
      )}

      {role === 'parent' && myChildren?.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <Label>My Children</Label>
          <div style={{ backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', overflow: 'hidden' }}>
            {myChildren.map((c, i) => (
              <div key={c.playerId} style={{ padding: '12px 14px', borderTop: i === 0 ? 'none' : '1px solid var(--em-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--em-text-primary)' }}>{c.firstName} {c.lastName}</span>
                <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>{teamName(c.teamId)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginBottom: 16 }}>
        <Label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Bell size={12} strokeWidth={2} /> Notifications</Label>
        <PushEnableToggle userId={user?.id} orgId={orgId} />
        <NotificationPrefs userId={user?.id} orgId={orgId} />
      </section>

      <section style={{ marginBottom: 16 }}>
        <Label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Moon size={12} strokeWidth={2} /> Quiet Hours</Label>
        <QuietHoursCard userId={user?.id} orgId={orgId} />
      </section>

      <section style={{ marginBottom: 16 }}>
        <Label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Lock size={12} strokeWidth={2} /> Security</Label>
        <button type="button" onClick={sendPasswordReset} disabled={resetting} className="em-press"
          style={{ width: '100%', minHeight: 44, borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)', fontSize: 15, fontWeight: 500 }}>
          {resetting ? 'Sending…' : 'Send password reset email'}
        </button>
      </section>

      <button type="button" onClick={signOut} className="em-press"
        style={{ width: '100%', minHeight: 44, borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'transparent', color: 'var(--em-danger)', fontSize: 15, fontWeight: 500, marginBottom: 24 }}>
        Sign out
      </button>

      <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--em-text-tertiary)' }}>{VERSION}</div>
    </div>
  );
}
