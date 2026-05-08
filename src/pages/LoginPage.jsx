import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import LoginForm from '../components/auth/LoginForm';

// Skyfire brand landing + sign-in. Email auto-trims on submit. Inline field
// errors (not toasts) so the user sees exactly which field failed.
export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const REDIRECT_ALLOWLIST = ['/events/', '/tournaments/', '/teams/', '/schedule', '/records', '/account', '/locations', '/messages'];
  const stickyFrom = location.state?.from?.pathname;
  const from = REDIRECT_ALLOWLIST.some(p => stickyFrom?.startsWith(p)) ? stickyFrom : '/';

  const [searchParams] = useSearchParams();
  const teamParam = searchParams.get('team');
  const [teamContext, setTeamContext] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!teamParam) return;
    supabase.from('teams').select('name, organizations(name)')
      .eq('id', teamParam).maybeSingle()
      .then(({ data }) => {
        if (data) setTeamContext({ teamName: data.name, orgName: data.organizations?.name });
      });
  }, [teamParam]);

  // Reset brand tokens to Skyfire defaults on mount so the login page
  // always shows dark navy regardless of cached org colors.
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--em-header', '#151525');
    r.setProperty('--em-accent', '#C9952E');
    r.setProperty('--em-accent-hover', '#D4A843');
    r.setProperty('--em-accent-soft', 'rgba(201,149,46,0.1)');
    r.setProperty('--em-text-on-dark', '#F5F0E8');
  }, []);

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
    if (error) {
      const msg = (error.message || '').toLowerCase().includes('invalid')
        ? "Email or password doesn't match. Double-check and try again."
        : error.message || "Couldn't sign in right now. Try again in a moment.";
      return setErrors({ form: msg });
    }
    navigate(from, { replace: true });
  };

  return (
    <div
      className="sf-fullscreen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--em-header)' }}
    >
      <div
        className="w-full sf-fade-in"
        style={{
          maxWidth: 400, backgroundColor: 'var(--em-bg-card)',
          borderRadius: 16, padding: 28, boxShadow: 'var(--em-shadow-lg)',
        }}
      >
        <div className="flex flex-col items-center mb-6">
          <img src="/phoenix.webp" alt="Ember"
            style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 16 }} />
        </div>

        {teamContext && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)' }}>
              Welcome to {teamContext.teamName}
            </div>
            <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginTop: 4 }}>
              Sign in to access your child&#39;s schedule
            </div>
          </div>
        )}

        <LoginForm
          email={email} setEmail={setEmail}
          password={password} setPassword={setPassword}
          showPw={showPw} setShowPw={setShowPw}
          errors={errors} submitting={submitting} onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
