import { AlertCircle, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';
import { laneFace } from '../../lib/home/registrationLane';

// H-1 (render home-registration-rollup) — the admin Home "Registration" rollup
// card. Conditional: the page renders it only when openCount > 0 (S0 = absent).
// One card, adaptive across the open-program state. Open-program-scoped; Program
// Health stays season-scoped (two scopes, never one merged number).

const fmtClose = (iso) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }) : '');
const daysLeft = (iso) => (iso ? Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)) : 0);

export default function HomeRegistrationCard({ data, onNavigate }) {
  const face = laneFace(data);
  const { openCount, registered, collectedCents, dueCents, needsFeeCount, soonestCloseAt, singleProgram } = data;
  const multi = openCount >= 2;
  const tapTo = multi ? '/admin/programs' : `/admin/programs/${singleProgram?.id}`;

  const Stats = (
    <div style={statsRow}>
      <div style={tile}><div style={tileV}>{registered}</div><div style={tileL}>Registered</div></div>
      <div style={tile}><div style={tileV}>{formatCurrency(collectedCents)}</div><div style={tileL}>Collected</div></div>
      <div style={tile}><div style={{ ...tileV, color: dueCents > 0 ? 'var(--as-danger)' : 'var(--as-text-primary)' }}>{formatCurrency(dueCents)}</div><div style={tileL}>Due</div></div>
    </div>
  );

  return (
    <section aria-label="Registration">
      <div style={secLbl}>Registration</div>
      <button type="button" className="as-press" style={{ ...card, borderLeftColor: multi ? 'var(--as-accent)' : 'var(--as-warning)' }} onClick={() => onNavigate(tapTo)}>
        <ChevronRight size={20} color="var(--as-text-tertiary)" style={{ position: 'absolute', top: 14, right: 12 }} aria-hidden="true" />
        <div style={top}>
          <span style={nm}>{multi ? `Registration · ${openCount} open` : singleProgram?.name}</span>
          {!multi && <span style={openBadge}>Open</span>}
        </div>

        {face === 'single_nofee' ? (
          <div style={nudge} role="note">
            <AlertCircle size={18} color="var(--as-warning)" aria-hidden="true" />
            <span style={nudgeTxt}><b>Open, but no fee set.</b> Set the fee to take registrations.</span>
            <span style={nudgeGo}>Set fee →</span>
          </div>
        ) : (
          <>
            <div style={meta}>{multi ? `Next closes ${fmtClose(soonestCloseAt)}` : `Closes ${fmtClose(soonestCloseAt)} · ${daysLeft(soonestCloseAt)} days left`}</div>
            {Stats}
            {face === 'multi_mixed' && (
              <div style={nudge} role="note">
                <AlertCircle size={18} color="var(--as-warning)" aria-hidden="true" />
                <span style={nudgeTxt}><b>{needsFeeCount} {needsFeeCount === 1 ? 'program needs' : 'programs need'} a fee</b> before it can take registrations.</span>
                <span style={nudgeGo}>Fix →</span>
              </div>
            )}
          </>
        )}
      </button>
    </section>
  );
}

const secLbl = { fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', margin: '0 2px 8px' };
const card = { position: 'relative', display: 'block', width: '100%', textAlign: 'left', backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderLeft: '4px solid var(--as-warning)', borderRadius: 12, padding: '14px 15px', cursor: 'pointer' };
const top = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingRight: 22 };
const nm = { fontSize: 16, fontWeight: 700, color: 'var(--as-text-primary)' };
const openBadge = { fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--as-success)', backgroundColor: 'var(--as-success-soft)', padding: '2px 7px', borderRadius: 5 };
const meta = { fontSize: 12, color: 'var(--as-text-secondary)', marginTop: 6 };
const statsRow = { display: 'flex', gap: 8, marginTop: 13 };
const tile = { flex: 1, backgroundColor: 'var(--as-bg-secondary)', borderRadius: 9, padding: '10px 8px', textAlign: 'center' };
const tileV = { fontSize: 17, fontWeight: 700, color: 'var(--as-text-primary)', fontVariantNumeric: 'tabular-nums' };
const tileL = { fontSize: 10, fontWeight: 600, color: 'var(--as-text-tertiary)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.03em' };
const nudge = { display: 'flex', alignItems: 'center', gap: 10, backgroundColor: 'var(--as-warning-soft)', border: '1px solid var(--as-warning)', borderRadius: 9, padding: '11px 12px', marginTop: 12, minHeight: 44 };
const nudgeTxt = { flex: 1, fontSize: 12.5, color: 'var(--as-text-secondary)' };
const nudgeGo = { fontSize: 12, fontWeight: 700, color: 'var(--as-warning)' };
