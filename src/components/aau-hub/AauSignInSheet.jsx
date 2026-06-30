import { useState } from 'react';
import { supabase } from '../../lib/supabase';

// "Save your teams" magic-link sign-in for the no-login Hub (R1·PR-A, DR-P sync).
// One field (email) → Supabase OTP magic link → the link returns to /hub already
// signed in, where the tracking store merges the local list onto the account and
// it follows the parent across devices. Full-screen fixed overlay (anti-pattern
// #5: no %/dvh heights). --as-* tokens only. Two states: signed-out (email form)
// and signed-in (confirmation + sign out).

const overlay = {
  position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  backgroundColor: 'rgba(0,0,0,0.3)',
};
const panel = {
  width: '100%', maxWidth: 600, backgroundColor: 'var(--as-bg-card)', borderTopLeftRadius: 16, borderTopRightRadius: 16,
  padding: 20, boxShadow: 'var(--as-shadow-lg)',
};
const input = {
  width: '100%', height: 44, padding: '0 14px', fontSize: 15, color: 'var(--as-text-primary)',
  backgroundColor: 'var(--as-bg-tertiary)', border: '1.5px solid var(--as-border-default)', borderRadius: 10,
  outline: 'none', boxSizing: 'border-box',
};
const primaryBtn = {
  width: '100%', minHeight: 44, marginTop: 12, borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer',
  color: 'var(--as-text-inverse)', backgroundColor: 'var(--as-accent)', border: 'none',
};
const ghostBtn = {
  width: '100%', minHeight: 44, marginTop: 8, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  color: 'var(--as-text-secondary)', background: 'none', border: '1px solid var(--as-border-default)',
};
const title = { margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--as-text-primary)' };
const sub = { margin: '6px 0 14px', fontSize: 14, color: 'var(--as-text-secondary)', lineHeight: 1.4 };

export default function AauSignInSheet({ user, signOut, onClose }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [err, setErr] = useState('');

  const send = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) { setErr('Enter a valid email'); return; }
    setStatus('sending'); setErr('');
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: `${window.location.origin}/hub` },
    });
    if (error) { setStatus('error'); setErr("Couldn't send the link. Try again in a moment."); return; }
    setStatus('sent');
  };

  return (
    <div style={overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Save your teams">
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        {user ? (
          <>
            <p style={title}>Your teams are saved</p>
            <p style={sub}>Signed in as {user.email}. Tracked teams follow your account on any device.</p>
            <button type="button" style={ghostBtn} onClick={() => { signOut(); onClose(); }}>Sign out</button>
            <button type="button" style={{ ...ghostBtn, color: 'var(--as-accent)' }} onClick={onClose}>Done</button>
          </>
        ) : status === 'sent' ? (
          <>
            <p style={title}>Check your email</p>
            <p style={sub}>We sent a sign-in link to {email.trim()}. Tap it on this device and your tracked teams will be saved to your account.</p>
            <button type="button" style={{ ...ghostBtn, color: 'var(--as-accent)' }} onClick={onClose}>Done</button>
          </>
        ) : (
          <form onSubmit={send}>
            <p style={title}>Save your teams</p>
            <p style={sub}>Get a one-tap sign-in link by email — no password. Your tracked teams stick around and sync across devices.</p>
            <input style={input} type="email" inputMode="email" autoComplete="email" placeholder="you@email.com"
              aria-label="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
            {err && <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--as-danger)' }}>{err}</p>}
            <button type="submit" style={primaryBtn} disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Email me a link'}
            </button>
            <button type="button" style={ghostBtn} onClick={onClose}>Not now</button>
          </form>
        )}
      </div>
    </div>
  );
}
