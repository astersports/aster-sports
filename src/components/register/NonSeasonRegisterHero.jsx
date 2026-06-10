import { formatCurrency } from '../../lib/formatters';
import { primaryBtn } from './registerStyles';

// D1 (render G1) — non-season programs (tryout/camp/clinic/…) register through a
// single flat fee, NOT a division grid. The funnel skips the picker (driven off
// programRegistry.hasDivisions) and shows this hero: program + flat per-child fee
// + Continue. The word "division" never surfaces. `division` is the program's one
// implicit unit (from get_public_program); when it's absent the admin hasn't set
// the fee yet, so the link can't take registrations.
export default function NonSeasonRegisterHero({ program, division, regState, opensLabel, onContinue }) {
  const feeCents = division ? (division.base_fee_cents || 0) : 0;
  const ready = regState === 'open' && division && feeCents > 0;

  let statusLine = null;
  if (regState === 'upcoming') statusLine = `Registration opens ${opensLabel || 'soon'}`;
  else if (regState === 'closed') statusLine = `Registration for ${program.name} has closed.`;
  else if (!division || feeCents <= 0) statusLine = 'Registration isn’t open yet — check back soon.';

  return (
    <div>
      <div style={hero}>
        <div style={{ fontSize: 13, color: 'var(--as-text-secondary)' }}>{program.name}</div>
        {ready ? (
          <>
            <div style={feeRow}>
              <span style={{ fontSize: 13, color: 'var(--as-text-secondary)', fontWeight: 600 }}>Per child</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--as-text-primary)' }}>{formatCurrency(feeCents)}</span>
            </div>
            <button type="button" className="as-press" style={{ ...primaryBtn, marginTop: 14 }} onClick={onContinue}>
              Continue · {formatCurrency(feeCents)}
            </button>
          </>
        ) : (
          <p style={{ fontSize: 14, color: 'var(--as-text-tertiary)', marginTop: 10 }}>{statusLine}</p>
        )}
      </div>
    </div>
  );
}

const hero = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 13, boxShadow: 'var(--as-shadow-sm)', padding: 18 };
const feeRow = { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--as-border-subtle)' };
