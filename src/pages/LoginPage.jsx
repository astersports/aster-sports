import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Skyfire brand landing + sign-in. Email auto-trims on submit. Inline field
// errors (not toasts) so the user sees exactly which field failed.
export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    const next = {};
    if (!trimmed) next.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(trimmed)) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    const { error } = await signIn(trimmed, password);
    setSubmitting(false);
    if (error) return setErrors({ form: error.message || 'Unable to sign in' });
    navigate(from, { replace: true });
  };

  const input = (err) => ({
    width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 10,
    border: `1px solid ${err ? 'var(--sf-danger)' : 'var(--sf-border-default)'}`,
    backgroundColor: 'var(--sf-bg-card)', color: 'var(--sf-text-primary)',
    fontSize: 15, outline: 'none',
  });
  const lbl = { color: 'var(--sf-text-secondary)', fontSize: 13 };
  const err = { color: 'var(--sf-danger)', fontSize: 12, marginTop: 4 };

  return (
    <div
      className="sf-fullscreen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--sf-header)' }}
    >
      <div
        className="w-full sf-fade-in"
        style={{
          maxWidth: 400, backgroundColor: 'var(--sf-bg-card)',
          borderRadius: 16, padding: 28, boxShadow: 'var(--sf-shadow-xl)',
        }}
      >
        <div className="flex flex-col items-center mb-6">
          <img
            src="/phoenix-logo.png"
            alt=""
            className="mb-3"
            style={{
              width: 96, height: 96, borderRadius: '50%', objectFit: 'cover',
              backgroundColor: 'var(--sf-accent-soft)',
            }}
          />
          <div
            className="font-bold"
            style={{ color: 'var(--sf-accent)', fontSize: 24, letterSpacing: 2 }}
          >
            SKYFIRE
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate>
          <label className="block mb-3">
            <span className="block mb-1 font-medium" style={lbl}>Email</span>
            <input
              type="email" autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={input(!!errors.email)} aria-invalid={!!errors.email}
            />
            {errors.email && <div style={err}>{errors.email}</div>}
          </label>

          <label className="block mb-3">
            <span className="block mb-1 font-medium" style={lbl}>Password</span>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                style={{ ...input(!!errors.password), paddingRight: 48 }}
                aria-invalid={!!errors.password}
              />
              <button
                type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute flex items-center justify-center sf-press"
                style={{ top: 0, right: 0, width: 44, height: 44, color: 'var(--sf-text-tertiary)' }}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw
                  ? <EyeOff size={20} strokeWidth={1.75} />
                  : <Eye size={20} strokeWidth={1.75} />}
              </button>
            </div>
            {errors.password && <div style={err}>{errors.password}</div>}
          </label>

          {errors.form && (
            <div
              className="mb-3"
              style={{
                color: 'var(--sf-danger)', backgroundColor: 'var(--sf-danger-soft)',
                padding: '8px 12px', borderRadius: 8, fontSize: 13,
              }}
            >
              {errors.form}
            </div>
          )}

          <button
            type="submit" disabled={submitting}
            className="w-full font-semibold sf-press sf-bounce-tap"
            style={{
              minHeight: 44, borderRadius: 10, fontSize: 15,
              backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-inverse)',
              opacity: submitting ? 0.7 : 1,
            }}
          >{submitting ? 'Signing in…' : 'Sign in'}</button>

          <div className="flex justify-center mt-2">
            <Link
              to="/forgot-password"
              className="sf-press inline-flex items-center justify-center"
              style={{
                minHeight: 44, padding: '0 12px',
                color: 'var(--sf-accent)', fontSize: 13, fontWeight: 500,
              }}
            >
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
