import { ghostBtn, primaryBtn } from './registerStyles';
import { formatCurrency } from '../../lib/formatters';

// Post-submit confirmation (spec §5.4/§5.6 voice). Shows the SERVER-authoritative
// total (result.authoritative_total_cents — the #63-money truth; previously
// computed and discarded), not the client estimate. "+ Register another child"
// loops back keeping the guardian; each child is its own pending registration.
export default function RegisterConfirm({ result, program, onAddAnother, onDone }) {
  const already = result?.already_registered || [];
  const count = (result?.registration_ids || []).length;
  const reserved = count > 0;
  const total = result?.authoritative_total_cents ?? 0;
  const discount = result?.discount_cents ?? 0;
  return (
    <div style={{ textAlign: 'center', paddingTop: 32 }}>
      <div aria-hidden="true" style={{ fontSize: 48, color: 'var(--as-success)' }}>✓</div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)', marginTop: 8 }}>
        {reserved ? 'Spot reserved!' : 'Already registered'}
      </h1>
      <p style={{ fontSize: 15, color: 'var(--as-text-secondary)', marginTop: 8 }}>
        {reserved
          ? `You’re in for ${program.name}. Your program admin will confirm payment and be in touch.`
          : `This player is already registered for ${program.name}.`}
      </p>
      {already.length > 0 && (
        <p style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginTop: 8 }}>Already on file: {already.join(', ')}</p>
      )}

      {reserved && total > 0 && (
        <div style={totalBox}>
          {discount > 0 && (
            <div style={row}><span>Family discount</span><b style={{ color: 'var(--as-success)' }}>−{formatCurrency(discount)}</b></div>
          )}
          <div style={{ ...row, ...bigRow }}><span>Amount due</span><b>{formatCurrency(total)}</b></div>
          <div style={note}>Billed at registration · no online payment yet.</div>
        </div>
      )}

      <button type="button" className="as-press" style={{ ...primaryBtn, marginTop: 24 }} onClick={onAddAnother}>+ Register another child</button>
      <button type="button" style={{ ...ghostBtn, width: '100%', marginTop: 8 }} onClick={onDone}>Done</button>
    </div>
  );
}

const totalBox = { textAlign: 'left', marginTop: 20, padding: 15, backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 13 };
const row = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--as-text-secondary)', marginBottom: 7 };
const bigRow = { margin: '9px 0 0', paddingTop: 9, borderTop: '1px solid var(--as-border-subtle)', fontSize: 16, color: 'var(--as-text-primary)', fontWeight: 700 };
const note = { fontSize: 11.5, color: 'var(--as-text-tertiary)', marginTop: 8 };
