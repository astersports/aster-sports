import { Link } from 'react-router-dom';
import AauMark from './AauMark';

// Branded chrome for the no-login Hub (R1·PR-A) — matches the astersports.io
// landing + the authenticated app: a navy bar with the gold constellation mark
// + "Aster Sports AAU Hub" (taps home) + a Sign in entry, capped by the
// signature gold→flame gradient strip (composed from existing --as-* tokens, no
// hardcoded hex). Full-width bar; inner content tracks the 600px page column.
export default function AauHubHeader() {
  return (
    <header style={{ backgroundColor: 'var(--as-header)' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Link to="/hub" aria-label="Aster Sports AAU Hub home" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', minWidth: 0 }}>
          <AauMark size={24} />
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--as-accent)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Aster Sports AAU Hub
          </span>
        </Link>
        <Link
          to="/login"
          style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', minHeight: 44, fontSize: 13, fontWeight: 600, color: 'var(--as-text-on-dark)', textDecoration: 'none', padding: '0 14px', borderRadius: 9999, border: '1px solid var(--as-accent)' }}
        >
          Sign in
        </Link>
      </div>
      <div style={{ height: 3, background: 'linear-gradient(90deg, var(--as-flame-mid), var(--as-accent))' }} />
    </header>
  );
}
