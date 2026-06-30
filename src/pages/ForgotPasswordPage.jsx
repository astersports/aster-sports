import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from '../components/shared/Button';
import Input from '../components/shared/Input';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) { setError('Enter your email'); return; }
    setSending(true); setError(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSending(false);
    if (err) { setError("Couldn't send reset link. Try again in a moment."); return; }
    setSent(true);
  };

  return (
    <div className="as-fullscreen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--as-header)' }}>
      <div className="w-full text-center" style={{ maxWidth: 400, backgroundColor: 'var(--as-bg-card)', borderRadius: 16, padding: 28, boxShadow: 'var(--as-shadow-lg)' }}>
        <div className="inline-flex items-center justify-center mb-4" style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: sent ? 'var(--as-success-soft)' : 'var(--as-accent-soft)', color: sent ? 'var(--as-success)' : 'var(--as-accent)' }} aria-hidden="true">
          {sent ? <CheckCircle2 size={32} strokeWidth={1.75} /> : <KeyRound size={32} strokeWidth={1.75} />}
        </div>
        <h1 className="font-semibold" style={{ color: 'var(--as-text-primary)', fontSize: 20, marginBottom: 8 }}>
          {sent ? 'Check your email' : 'Reset password'}
        </h1>
        {sent ? (
          <>
            <p style={{ color: 'var(--as-text-secondary)', fontSize: 15, marginBottom: 20, lineHeight: 1.5 }}>
              We sent a reset link to <strong>{email.trim()}</strong>. Check your inbox and follow the link to set a new password.
            </p>
            <Button onClick={() => navigate('/login')}>Back to sign in</Button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: 'var(--as-text-secondary)', fontSize: 15, marginBottom: 16, lineHeight: 1.5 }}>
              Enter your email and we'll send you a link to reset your password.
            </p>
            <div style={{ marginBottom: 16, textAlign: 'left' }}>
              <Input id="reset-email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            </div>
            {error && <div style={{ color: 'var(--as-danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <Button type="submit" disabled={sending} style={{ width: '100%' }}>
              {sending ? 'Sending…' : 'Send reset link'}
            </Button>
            <button type="button" onClick={() => navigate('/login')} style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--as-accent)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
