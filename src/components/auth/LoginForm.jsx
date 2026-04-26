import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

// Style helpers scoped to the login form. Kept colocated here rather
// than hoisted to a shared module so the visual rules for the
// login-specific inputs live next to the markup that uses them.
const lbl = { color: 'var(--em-text-secondary)', fontSize: 13 };
const err = { color: 'var(--em-danger)', fontSize: 12, marginTop: 4 };
const input = (hasErr) => ({
  width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 10,
  border: `1px solid ${hasErr ? 'var(--em-danger)' : 'var(--em-border-default)'}`,
  backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)',
  fontSize: 15, outline: 'none',
});

// Pure render of the email/password form on LoginPage. All state lives
// in the parent; this component just wires inputs and fires onSubmit.
export default function LoginForm({
  email, setEmail,
  password, setPassword,
  showPw, setShowPw,
  errors, submitting, onSubmit,
}) {
  return (
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
            style={{ top: 0, right: 0, width: 44, height: 44, color: 'var(--em-text-tertiary)' }}
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
            color: 'var(--em-danger)', backgroundColor: 'var(--em-danger-soft)',
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
          backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)',
          opacity: submitting ? 0.7 : 1,
        }}
      >{submitting ? 'Signing in…' : 'Sign in'}</button>

      <div className="flex justify-center mt-2">
        <Link
          to="/forgot-password"
          className="sf-press inline-flex items-center justify-center"
          style={{
            minHeight: 44, padding: '0 12px',
            color: 'var(--em-accent)', fontSize: 13, fontWeight: 500,
          }}
        >
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
