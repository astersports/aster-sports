import { useState } from 'react';
import { Lock } from 'lucide-react';
import Label from '../shared/Label';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/useToast';

// Security group on /account. Extracted from AccountPage to keep it lean
// (≤150) and to add: optimistic "sent" confirmation persisted inline, a
// 30s re-send cooldown to stop accidental double-sends, an aria-live status
// line for screen readers, and kindness microcopy on both paths. Token-only.
const COOLDOWN_MS = 30000;

export default function SecuritySection({ email }) {
  const { showToast } = useToast();
  const [resetting, setResetting] = useState(false);
  const [cooling, setCooling] = useState(false);

  const sendPasswordReset = async () => {
    if (!email || resetting || cooling) return;
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetting(false);
    if (error) {
      showToast("Couldn't send reset email. Try again?", 'error');
    } else {
      setCooling(true);
      setTimeout(() => setCooling(false), COOLDOWN_MS);
      showToast('Password reset email sent. Check your inbox.', 'success');
    }
  };

  const label = resetting ? 'Sending…' : cooling ? 'Email sent — check your inbox' : 'Send password reset email';
  const disabled = resetting || cooling || !email;

  return (
    <section style={{ marginBottom: 16 }}>
      <Label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Lock size={12} strokeWidth={2} aria-hidden="true" /> Security
      </Label>
      <button type="button" onClick={sendPasswordReset} disabled={disabled} className="as-press"
        aria-label={label}
        style={{ width: '100%', minHeight: 44, borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: disabled ? 'var(--as-text-tertiary)' : 'var(--as-text-primary)', fontSize: 15, fontWeight: 500, cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit' }}>
        {label}
      </button>
      <p aria-live="polite" style={{ fontSize: 13, color: 'var(--as-text-tertiary)', margin: '8px 2px 0', lineHeight: 1.5 }}>
        {cooling
          ? 'We sent a reset link. The link opens a secure page to choose a new password.'
          : 'Sends a secure reset link to your email. No password is shown here.'}
      </p>
    </section>
  );
}
