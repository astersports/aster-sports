import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronLeft } from 'lucide-react';
import { useGoBack } from '../hooks/useGoBack';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useActiveSeasonTeams } from '../hooks/useActiveSeasonTeams';
import { useToast } from '../context/useToast';
import { ASTER_DISPLAY_NAME } from '../lib/asterDefaults';
import Label from '../components/shared/Label';
import PushEnableToggle from '../components/account/PushEnableToggle';
import MyPreferencesSection from '../components/account/MyPreferencesSection';
import FamilyNotificationsSection from '../components/account/FamilyNotificationsSection';
import StaffProfileCard from '../components/account/StaffProfileCard';
import DeleteAccountSection from '../components/account/DeleteAccountSection';
import AccountIdentityCard from '../components/account/AccountIdentityCard';
import MyChildrenSection from '../components/account/MyChildrenSection';
import SecuritySection from '../components/account/SecuritySection';
import SignOutSection from '../components/account/SignOutSection';

const ROLE_LABELS = { admin: 'Admin', coach: 'Coach', parent: 'Parent' };
const VERSION = 'Aster Sports v2.0';

export default function AccountPage() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user, role, orgName, orgId, myChildren, guardianFirstName, signOut } = useAuth();
  const { showToast } = useToast();
  const { teams } = useActiveSeasonTeams();
  const [lastName, setLastName] = useState(null);
  const [nameLoading, setNameLoading] = useState(role === 'parent');

  // Async data-fetch effect: setState here syncs to the guardian-name load
  // (an external async event), a legitimate effect use — disable the
  // conservative set-state-in-effect rule for the synchronous loading flag.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (role !== 'parent' || !user?.id) { setNameLoading(false); return; }
    setNameLoading(true);
    supabase.from('guardians').select('last_name').eq('user_id', user.id).maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('AccountPage guardianLastName:', error.message);
        setLastName(data?.last_name ?? null);
        setNameLoading(false);
      });
  }, [role, user?.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const parentName = [guardianFirstName, lastName].filter(Boolean).join(' ').trim();
  const displayName = (role === 'parent' && parentName) || user?.user_metadata?.full_name || user?.email || 'User';
  const teamName = (teamId) => teams.find((p) => p.id === teamId)?.name || '—';
  const roleLabel = ROLE_LABELS[role] || 'User';
  const showNameSkeleton = nameLoading && !parentName;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      showToast("Looks like that didn't go through. Try again?", 'error');
    }
  };

  return (
    <main aria-label="Account settings" style={{ minHeight: '100vh', backgroundColor: 'var(--as-bg-page)', padding: '16px 16px 32px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <button type="button" onClick={goBack} className="as-press" aria-label="Go back"
          style={{ display: 'flex', alignItems: 'center', minHeight: 44, padding: '0 8px 0 0', background: 'none', border: 'none', color: 'var(--as-accent)', fontSize: 15, fontWeight: 500, marginBottom: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
          <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" /> Back
        </button>

        {showNameSkeleton ? (
          <section aria-hidden="true" className="as-fade-in" style={{ backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', boxShadow: 'var(--as-shadow-sm)', padding: 16, marginBottom: 16, display: 'flex', gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 9999, backgroundColor: 'var(--as-bg-secondary)' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
              <div style={{ height: 16, width: '55%', borderRadius: 6, backgroundColor: 'var(--as-bg-secondary)' }} />
              <div style={{ height: 12, width: '70%', borderRadius: 6, backgroundColor: 'var(--as-bg-secondary)' }} />
            </div>
          </section>
        ) : (
          <AccountIdentityCard displayName={displayName} email={user?.email}
            roleLabel={roleLabel} orgLabel={orgName || ASTER_DISPLAY_NAME} />
        )}

        {(role === 'admin' || role === 'coach') && (
          <StaffProfileCard defaultDisplayName={user?.user_metadata?.full_name} />
        )}

        {role === 'parent' && (
          <MyChildrenSection children={myChildren} teamName={teamName} onOpenFamily={() => navigate('/family')} />
        )}

        <MyPreferencesSection />

        <FamilyNotificationsSection />

        <section style={{ marginBottom: 16 }}>
          <Label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Bell size={12} strokeWidth={2} aria-hidden="true" /> Notifications</Label>
          <PushEnableToggle userId={user?.id} orgId={orgId} />
        </section>

        <SecuritySection email={user?.email} />

        <SignOutSection onSignOut={handleSignOut} />

        <DeleteAccountSection />

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--as-text-tertiary)', marginTop: 24 }}>{VERSION}</div>
      </div>
    </main>
  );
}
