import { formatCurrency } from '../../lib/formatters';
import { registrationErrorInfo } from '../../lib/registrationErrors';
import { ghostBtn, primaryBtn } from './registerStyles';

// Step 4 (lean capture variant) — review + submit. NO Stripe: "Reserve" creates a pending
// registration; the program admin records payment via the existing financial flow. The
// shown total is the client estimate; submit_registration returns the authoritative total.
export default function StepReview({ player, division, cart, submitting, error, onBack, onSubmit }) {
  const name = player.first_name || 'your player';
  return (
    <div>
      <div style={card}>
        <div style={row}><span>{player.first_name}’s {division.name}</span><span style={{ fontWeight: 600 }}>{formatCurrency(cart.subtotalCents)}</span></div>
        {cart.discountCents > 0 && (
          <div style={{ ...row, color: 'var(--as-success)' }}><span>Family discount</span><span>−{formatCurrency(cart.discountCents)}</span></div>
        )}
        <div style={{ ...row, borderTop: '1px solid var(--as-border-default)', paddingTop: 8, marginTop: 8, fontWeight: 700 }}>
          <span>Due</span><span>{formatCurrency(cart.totalCents)}</span>
        </div>
      </div>
      <p style={reassure}>One confirmation · we’ll email you a link to track payment.</p>
      {error && <div role="alert" style={errStyle}>{registrationErrorInfo(error).message}</div>}
      <div style={btnRow}>
        <button type="button" style={ghostBtn} onClick={onBack} disabled={submitting}>Back</button>
        <button type="button" className="as-press" style={{ ...primaryBtn, flex: 1, opacity: submitting ? 0.6 : 1 }} disabled={submitting} onClick={onSubmit}>
          {submitting ? 'Reserving…' : `Reserve ${name}’s spot`}
        </button>
      </div>
    </div>
  );
}

const card = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, boxShadow: 'var(--as-shadow-sm)', padding: 16, marginBottom: 8 };
const row = { display: 'flex', justifyContent: 'space-between', fontSize: 15, color: 'var(--as-text-primary)', marginBottom: 4 };
const reassure = { fontSize: 13, color: 'var(--as-text-tertiary)', textAlign: 'center', margin: '0 0 12px' };
const errStyle = { padding: '8px 12px', borderRadius: 10, backgroundColor: 'var(--as-danger-soft)', color: 'var(--as-danger)', fontSize: 13, marginBottom: 8 };
const btnRow = { display: 'flex', gap: 8, marginTop: 8 };
