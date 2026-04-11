import { Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';

// Stub — full flow (email input + resetPasswordForEmail + success state)
// arrives with the auth-polish prompt. For now we ship a branded page so
// the /forgot-password link from LoginPage has somewhere to land.
export default function ForgotPasswordPage() {
  return (
    <div
      className="sf-fullscreen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--sf-header)' }}
    >
      <div
        className="w-full text-center"
        style={{
          maxWidth: 400,
          backgroundColor: 'var(--sf-bg-card)',
          borderRadius: 16,
          padding: 28,
          boxShadow: 'var(--sf-shadow-xl)',
        }}
      >
        <div
          className="inline-flex items-center justify-center mb-4"
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: 'var(--sf-accent-soft)',
            color: 'var(--sf-accent)',
          }}
          aria-hidden="true"
        >
          <KeyRound size={32} strokeWidth={1.75} />
        </div>
        <h1
          className="font-semibold"
          style={{ color: 'var(--sf-text-primary)', fontSize: 20, marginBottom: 8 }}
        >
          Reset password
        </h1>
        <p style={{ color: 'var(--sf-text-secondary)', fontSize: 14, marginBottom: 20 }}>
          Password reset is coming soon. Ask an admin to send you a new invite.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center font-semibold sf-press"
          style={{
            minHeight: 44,
            padding: '0 20px',
            borderRadius: 10,
            backgroundColor: 'var(--sf-accent)',
            color: 'var(--sf-text-inverse)',
            fontSize: 15,
          }}
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
