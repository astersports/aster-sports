import { useState } from 'react';
import { Check, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { APP_BASE_URL } from '../../lib/constants';
import { primaryBtn } from './registerStyles';

// B2 confirmation bridge (magic-link — architect-ruled B; Frank GO 2026-06-10).
// The guardian email was captured at registration (StepGuardian), so claiming
// the account is ONE tap: send a Supabase magic-link to that email. The click
// lands an authenticated, email-confirmed session; AuthContext.resolveNewUser
// Context then runs claim_guardian_by_email() (the SECDEF RPC carrying the
// email-confirm gate) to link the anonymously-created guardian row to the auth
// user, and the parent lands in My Family (/family, B1). No password friction at
// the highest-intent, lowest-patience moment. A password account is a fast-follow
// swap if recurring-login reliability ever matters (architect note).
export default function RegisterClaimAccount({ email }) {
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !email) return null;

  async function send() {
    setStatus('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${APP_BASE_URL}/family` },
    });
    setStatus(error ? 'error' : 'sent');
  }

  if (status === 'sent') {
    return (
      <div style={{ ...card, backgroundColor: 'var(--as-success-soft)', borderColor: 'var(--as-success)' }} role="status" aria-live="polite">
        <div style={iconWrap} aria-hidden="true"><Check size={22} color="var(--as-success)" strokeWidth={2.4} /></div>
        <h3 style={title}>Check your email</h3>
        <p style={body}>We sent a sign-in link to <b style={strong}>{email}</b>. Tap it to see what you owe and get the schedule.</p>
      </div>
    );
  }

  return (
    <div style={card}>
      <h3 style={title}>Track payment &amp; schedule</h3>
      <p style={body}>Create your account to see what you owe, get the schedule, and register faster next time.</p>
      <p style={{ ...body, fontWeight: 600, color: 'var(--as-text-primary)', margin: '6px 0 13px' }}>We’ll send a sign-in link to {email}</p>
      <button type="button" className="as-press" style={{ ...primaryBtn, gap: 8 }} onClick={send} disabled={status === 'sending'} aria-label={`Send a sign-in link to ${email}`}>
        <Mail size={18} aria-hidden="true" />{status === 'sending' ? 'Sending…' : 'Send sign-in link'}
      </button>
      {status === 'error' && <p role="alert" style={{ ...body, color: 'var(--as-danger)', marginTop: 10 }}>Couldn’t send the link. Try again in a moment.</p>}
      <button type="button" style={skip} onClick={() => setDismissed(true)}>Maybe later</button>
    </div>
  );
}

const card = { marginTop: 16, padding: 17, backgroundColor: 'var(--as-info-soft)', border: '1px solid var(--as-border-default)', borderRadius: 13, textAlign: 'center' };
const iconWrap = { width: 44, height: 44, borderRadius: '50%', backgroundColor: 'var(--as-bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' };
const title = { fontSize: 15, fontWeight: 700, color: 'var(--as-text-primary)', marginBottom: 5 };
const body = { fontSize: 13, color: 'var(--as-text-secondary)', lineHeight: 1.45 };
const strong = { color: 'var(--as-text-primary)', fontWeight: 700 };
const skip = { display: 'block', width: '100%', marginTop: 11, background: 'none', border: 'none', fontSize: 13, fontWeight: 500, color: 'var(--as-text-tertiary)', cursor: 'pointer' };
