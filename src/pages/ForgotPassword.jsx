import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    // We intentionally show the same "if an account exists..." message even on
    // error so we don't leak which emails have accounts.
    if (error) console.error('Password reset request failed:', error);
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6" style={{ color: 'var(--sf-accent)' }}>
          Reset Password
        </h1>
        {submitted ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-slate-700 mb-4">
              If an account exists for <strong>{email}</strong>, you'll receive a password reset email shortly.
            </p>
            <Link to="/login" className="text-sm font-medium hover:underline" style={{ color: 'var(--sf-accent)' }}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
            <p className="text-sm text-slate-600">
              Enter your email and we'll send you a link to reset your password.
            </p>
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full bg-[var(--sf-accent)] hover:bg-[var(--sf-accent-hover)] text-white font-medium py-2 rounded text-sm disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="text-center">
              <Link to="/login" className="text-sm font-medium hover:underline" style={{ color: 'var(--sf-accent)' }}>
                Back to Sign In
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
