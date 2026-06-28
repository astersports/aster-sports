import { useState } from 'react';
import { LogOut } from 'lucide-react';
import BottomSheet from '../shared/BottomSheet';

// Sign-out control on /account. Extracted from AccountPage to keep it lean
// (≤150) and to add a confirm step so an accidental tap doesn't drop the
// user out of the app. The confirm is a 1-2 button dialog, so BottomSheet
// is the correct vessel per AP #15. Token-only colors, 44px targets.
export default function SignOutSection({ onSignOut }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onSignOut();
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setConfirming(true)} className="as-press"
        aria-label="Sign out of your account"
        style={{ width: '100%', minHeight: 44, borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'transparent', color: 'var(--as-danger)', fontSize: 15, fontWeight: 500, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
        <LogOut size={20} strokeWidth={1.75} aria-hidden="true" /> Sign out
      </button>

      <BottomSheet open={confirming} onClose={() => !busy && setConfirming(false)} initialHeight="34%">
        <div style={{ padding: '4px 16px 16px' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--as-text-primary)', margin: '0 0 4px' }}>Sign out?</h2>
          <p style={{ fontSize: 15, color: 'var(--as-text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
            You can sign back in anytime with your email.
          </p>
          <button type="button" onClick={confirm} disabled={busy} className="as-press"
            style={{ width: '100%', minHeight: 44, borderRadius: 10, border: 'none', backgroundColor: 'var(--as-danger)', color: 'var(--as-text-inverse)', fontSize: 15, fontWeight: 600, marginBottom: 8, cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit' }}>
            {busy ? 'Signing out…' : 'Yes, sign out'}
          </button>
          <button type="button" onClick={() => setConfirming(false)} disabled={busy} className="as-press"
            style={{ width: '100%', minHeight: 44, borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-text-primary)', fontSize: 15, fontWeight: 500, cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit' }}>
            Stay signed in
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
