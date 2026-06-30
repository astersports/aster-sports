import { useState } from 'react';
import { Link } from 'react-router-dom';
import AauMark from './AauMark';
import AauSignInSheet from './AauSignInSheet';
import { useHubSession } from '../../hooks/useHubSession';

// Branded chrome for the no-login Hub (R1·PR-A) — navy bar with the gold
// constellation mark + "Aster Sports AAU Hub" (taps home) + a "Save your teams"
// magic-link sign-in, capped by the signature gold→flame gradient strip
// (composed from existing --as-* tokens, no hardcoded hex). Signed-in parents see
// a "✓ Saved" chip that opens the same sheet to sign out.
export default function AauHubHeader() {
  const { user, signOut } = useHubSession();
  const [sheet, setSheet] = useState(false);

  const chip = {
    flexShrink: 0, display: 'inline-flex', alignItems: 'center', minHeight: 44, fontSize: 13, fontWeight: 600,
    color: 'var(--as-text-on-dark)', background: 'none', cursor: 'pointer',
    padding: '0 14px', borderRadius: 9999, border: '1px solid var(--as-accent)',
  };

  return (
    <header style={{ backgroundColor: 'var(--as-header)' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Link to="/hub" aria-label="Aster Sports AAU Hub home" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', minWidth: 0 }}>
          <AauMark size={24} />
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--as-accent)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Aster Sports AAU Hub
          </span>
        </Link>
        <button type="button" style={chip} onClick={() => setSheet(true)} aria-haspopup="dialog">
          {user ? '✓ Saved' : 'Sign in'}
        </button>
      </div>
      <div style={{ height: 3, background: 'linear-gradient(90deg, var(--as-flame-mid), var(--as-accent))' }} />
      {sheet && <AauSignInSheet user={user} signOut={signOut} onClose={() => setSheet(false)} />}
    </header>
  );
}
