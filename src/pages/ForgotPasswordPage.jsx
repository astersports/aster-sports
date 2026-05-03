import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import Button from '../components/shared/Button';

// Stub — full flow (email input + resetPasswordForEmail + success state)
// arrives with the auth-polish prompt. For now we ship a branded page so
// the /forgot-password link from LoginPage has somewhere to land.
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  return (
    <div
      className="sf-fullscreen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--em-header)' }}
    >
      <div
        className="w-full text-center"
        style={{
          maxWidth: 400,
          backgroundColor: 'var(--em-bg-card)',
          borderRadius: 16,
          padding: 28,
          boxShadow: 'var(--em-shadow-lg)',
        }}
      >
        <div
          className="inline-flex items-center justify-center mb-4"
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: 'var(--em-accent-soft)',
            color: 'var(--em-accent)',
          }}
          aria-hidden="true"
        >
          <KeyRound size={32} strokeWidth={1.75} />
        </div>
        <h1
          className="font-semibold"
          style={{ color: 'var(--em-text-primary)', fontSize: 20, marginBottom: 8 }}
        >
          Reset password
        </h1>
        <p style={{ color: 'var(--em-text-secondary)', fontSize: 15, marginBottom: 20 }}>
          Password reset is coming soon. Ask an admin to send you a new invite.
        </p>
        <Button onClick={() => navigate('/login')}>
          Back to sign in
        </Button>
      </div>
    </div>
  );
}
