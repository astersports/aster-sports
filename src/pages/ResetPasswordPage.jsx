import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from '../components/shared/Button';
import Input from '../components/shared/Input';

// Completes the password-recovery flow — the piece the app was missing (reset
// emails redirected here but there was no "set a new password" screen). The
// reset link lands here with a recovery token in the URL hash; supabase-js sets
// a recovery session on load and fires PASSWORD_RECOVERY. The user picks a new
// password via supabase.auth.updateUser, then continues into the app. Public
// route (no shell, no guard) — the recovery session is the only auth at this point.

const wrap = { backgroundColor: 'var(--as-header)' };
const card = { maxWidth: 400, backgroundColor: 'var(--as-bg-card)', borderRadius: 16, padding: 28, boxShadow: 'var(--as-shadow-lg)' };

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [hasSession, setHasSession] = useState(null); // null = still verifying the link
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    let settled = false;
    const markHasSession = () => { if (active && !settled) { settled = true; setHasSession(true); } };
    // The recovery session lands asynchronously (detectSessionInUrl parses the
    // token hash after mount), so listen for it AND poll getSession once...
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => { if (session) markHasSession(); });
    supabase.auth.getSession().then(({ data }) => { if (data?.session) markHasSession(); });
    // ...but don't declare the link dead until the hash has had time to resolve,
    // otherwise a valid link flashes the "expired" card before the session lands.
    const timer = setTimeout(() => { if (active && !settled) { settled = true; setHasSession(false); } }, 3000);
    return () => { active = false; clearTimeout(timer); sub?.subscription?.unsubscribe?.(); };
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Use at least 8 characters'); return; }
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (err) { setError("Couldn't update your password — this link may have expired. Request a fresh one below."); return; }
    setDone(true);
  };

  return (
    <div className="as-fullscreen flex items-center justify-center p-6" style={wrap}>
      <div className="w-full text-center" style={card}>
        <div className="inline-flex items-center justify-center mb-4" style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: done ? 'var(--as-success-soft)' : 'var(--as-accent-soft)', color: done ? 'var(--as-success)' : 'var(--as-accent)' }} aria-hidden="true">
          {done ? <CheckCircle2 size={32} strokeWidth={1.75} /> : <KeyRound size={32} strokeWidth={1.75} />}
        </div>
        <h1 className="font-semibold" style={{ color: 'var(--as-text-primary)', fontSize: 20, marginBottom: 8 }}>
          {done ? 'Password updated' : 'Set a new password'}
        </h1>

        {done ? (
          <>
            <p style={{ color: 'var(--as-text-secondary)', fontSize: 15, marginBottom: 20, lineHeight: 1.5 }}>
              You're all set — your new password is saved. Continue to Aster Sports.
            </p>
            <Button onClick={() => navigate('/')} style={{ width: '100%' }}>Go to Aster Sports</Button>
          </>
        ) : hasSession === false ? (
          <>
            <p style={{ color: 'var(--as-text-secondary)', fontSize: 15, marginBottom: 20, lineHeight: 1.5 }}>
              This reset link is invalid or has expired. Request a fresh one and use the newest email.
            </p>
            <Link to="/forgot-password" style={{ color: 'var(--as-accent)', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              Send a new reset link
            </Link>
          </>
        ) : hasSession === null ? (
          <p aria-live="polite" style={{ color: 'var(--as-text-meta)', fontSize: 14 }}>Verifying your reset link…</p>
        ) : (
          <form onSubmit={onSubmit}>
            <div style={{ marginBottom: 12, textAlign: 'left' }}>
              <Input label="New password" type="password" autoComplete="new-password"
                value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            </div>
            <div style={{ marginBottom: 16, textAlign: 'left' }}>
              <Input label="Confirm password" type="password" autoComplete="new-password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            {error && <div style={{ color: 'var(--as-danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <Button type="submit" disabled={saving} style={{ width: '100%' }}>
              {saving ? 'Saving…' : 'Save new password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
