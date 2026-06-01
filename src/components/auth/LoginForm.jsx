import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Input from '../shared/Input';
import Button from '../shared/Button';


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
      <div className="mb-3">
        <Input
          label="Email"
          type="email" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          aria-invalid={!!errors.email}
        />
      </div>

      <div className="mb-3">
        <div className="relative">
          <Input
            label="Password"
            type={showPw ? 'text' : 'password'} autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            aria-invalid={!!errors.password}
            style={{ paddingRight: 48 }}
          />
          <button
            type="button" onClick={() => setShowPw((v) => !v)}
            className="absolute flex items-center justify-center as-press"
            style={{ top: 22, right: 0, width: 44, height: 44, color: 'var(--as-text-tertiary)' }}
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw
              ? <EyeOff size={20} strokeWidth={1.75} />
              : <Eye size={20} strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {errors.form && (
        <div
          className="mb-3"
          style={{
            color: 'var(--as-danger)', backgroundColor: 'var(--as-danger-soft)',
            padding: '8px 12px', borderRadius: 8, fontSize: 13,
          }}
        >
          {errors.form}
        </div>
      )}

      <Button type="submit" disabled={submitting} fullWidth>
        {submitting ? 'Signing in…' : 'Sign in'}
      </Button>

      <div className="flex justify-center mt-2">
        <Link
          to="/forgot-password"
          className="as-press inline-flex items-center justify-center"
          style={{
            minHeight: 44, padding: '0 12px',
            color: 'var(--as-accent)', fontSize: 13, fontWeight: 500,
          }}
        >
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
