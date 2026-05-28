import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

// Small pill button that triggers the invite-parent Edge Function. Admin-only
// placement is the caller's responsibility — this component just handles the
// request lifecycle and in-place status swap.
export default function InviteButton({ guardianEmail }) {
  const { orgId } = useAuth();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const invite = async () => {
    setStatus('loading'); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not signed in');
      if (!orgId) throw new Error('No active org');
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-parent`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email: guardianEmail, org_id: orgId }),
      });
      const text = await res.text();
      console.error('Invite response:', res.status, text);
      if (!res.ok) {
        let body = {}; try { body = JSON.parse(text); } catch { /* not json */ }
        throw new Error(body.error || text?.slice(0, 80) || `HTTP ${res.status}`);
      }
      setStatus('sent');
    } catch (e) {
      setError(e.message || 'Error'); setStatus('error');
    }
  };

  const pill = { minHeight: 44, padding: '0 12px', borderRadius: 9999, fontSize: 13, fontWeight: 500, backgroundColor: 'transparent' };

  if (status === 'sent') {
    return <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--em-success)' }}>Invited ✓</span>;
  }
  if (status === 'error') {
    return (
      <button type="button" onClick={invite} className="em-press" title={error}
        style={{ ...pill, border: '1.5px solid var(--em-danger)', color: 'var(--em-danger)', maxWidth: '100%', whiteSpace: 'normal', textAlign: 'left', padding: '6px 10px', borderRadius: 8 }}>
        {error || 'Error — tap to retry'}
      </button>
    );
  }
  return (
    <button type="button" onClick={invite} disabled={status === 'loading'} className="em-press"
      style={{ ...pill, border: '1.5px solid var(--em-accent)', color: 'var(--em-accent)', opacity: status === 'loading' ? 0.6 : 1 }}>
      {status === 'loading' ? 'Sending…' : 'Invite'}
    </button>
  );
}
