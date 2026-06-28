// L99 E6/E7 — the "what needs attention" headline + the page's a11y live region.
// Surfaces stats.familiesOwing + stats.outstanding (computed by
// useSeasonFinancials but never shown on the page before) as one scope-LABELED
// "season" callout — the SAME `stats` object the summary card + progress bar
// read, so there is exactly ONE source/scope for "families owing" here (AP#63).
// When everything is collected it flips to a calm all-clear treatment.
// The visually-hidden role=status announces the season + outstanding total to
// screen readers whenever the selected season changes (§16.4 live regions).
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';

export default function OutstandingCallout({ stats, seasonName }) {
  const owing = stats?.familiesOwing ?? 0;
  const outstanding = stats?.outstanding ?? 0;
  const clear = owing <= 0 || outstanding <= 0;
  const announce = clear
    ? `${seasonName || 'Season'}: all families paid up.`
    : `${seasonName || 'Season'}: ${formatCurrency(outstanding)} outstanding across ${owing} famil${owing === 1 ? 'y' : 'ies'}.`;

  return (
    <>
      <span role="status" aria-live="polite" style={srOnly}>{announce}</span>
      <div style={{ ...box, backgroundColor: clear ? 'var(--as-success-soft)' : 'var(--as-warning-soft)', borderColor: clear ? 'var(--as-success)' : 'var(--as-warning)' }}>
        {clear
          ? <CheckCircle2 size={20} strokeWidth={1.75} color="var(--as-success)" aria-hidden="true" style={{ flexShrink: 0 }} />
          : <AlertCircle size={20} strokeWidth={1.75} color="var(--as-warning)" aria-hidden="true" style={{ flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          {clear ? (
            <div style={title}>All families paid up<span style={tag}>season</span></div>
          ) : (
            <>
              <div style={title}>{formatCurrency(outstanding)} outstanding<span style={tag}>season</span></div>
              <div style={meta}>Across {owing} famil{owing === 1 ? 'y' : 'ies'} — message owing families below to nudge them.</div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

const box = { display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14, marginBottom: 16, border: '1px solid', borderRadius: 10 };
const title = { fontSize: 15, fontWeight: 700, color: 'var(--as-text-primary)', fontVariantNumeric: 'tabular-nums' };
const meta = { fontSize: 12, color: 'var(--as-text-secondary)', marginTop: 2, lineHeight: 1.4 };
const tag = { fontSize: 10, fontWeight: 500, color: 'var(--as-text-tertiary)', marginLeft: 6, verticalAlign: 'middle' };
const srOnly = { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 };
