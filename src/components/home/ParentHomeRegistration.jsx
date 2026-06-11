import { AlertCircle, ChevronRight, Plus } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';
import { familyDueCents } from '../../lib/home/registrationLane';

// H-2 — the parent Home registration + balance lane, built to the architect's
// home-parent-lane render (B2 ratification target). Answers the two first-screen
// questions without entering My Family: "Open for registration" (a CTA naming the
// eligible child(ren)) and "Your balance" (one source: family_balances). Both
// conditional — each section absent when its condition is unmet (no clutter).
const namesHint = (names = []) => (names.length === 0
  ? null
  : names.length <= 2 ? names.join(' and ') : `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`);
const shortDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }) : '');

export default function ParentHomeRegistration({ family, onNavigate }) {
  const open = family?.openPrograms || [];
  const due = familyDueCents(family?.familyBalances || []);
  if (open.length === 0 && due <= 0) return null;
  const one = open.length === 1 ? open[0] : null;
  const hint = one && namesHint(one.eligibleChildren);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {open.length > 0 && (
        <section aria-label="Open for registration">
          <div style={secLbl}>Open for registration</div>
          <div style={card}>
            <div style={top}>
              <span style={nm}>{one ? one.name : `${open.length} programs open`}</span>
              {one && <span style={openBadge}>Open</span>}
            </div>
            <div style={forLine}>
              {one ? `${hint ? `For ${hint} · ` : ''}closes ${shortDate(one.closesAt)}` : 'See what your children can join'}
            </div>
            {one ? (
              <a href={`/r/${one.slug}`} className="as-press" style={cta}><Plus size={17} strokeWidth={2.3} aria-hidden="true" /> Register</a>
            ) : (
              <button type="button" className="as-press" style={{ ...cta, border: 'none' }} onClick={() => onNavigate('/family')}>View all</button>
            )}
          </div>
        </section>
      )}

      {due > 0 && (
        <section aria-label="Your balance">
          <div style={secLbl}>Your balance</div>
          <button type="button" className="as-press" style={balCard} onClick={() => onNavigate('/family')}>
            <ChevronRight size={20} color="var(--as-text-tertiary)" aria-hidden="true" style={{ position: 'absolute', top: 14, right: 13 }} />
            <div style={balLbl}>Family balance</div>
            <div style={balBig}>
              <AlertCircle size={19} strokeWidth={2.4} color="var(--as-danger)" aria-hidden="true" />
              {formatCurrency(due)} due
            </div>
            <div style={balSub}>Tap for details in My Family</div>
          </button>
        </section>
      )}
    </div>
  );
}

const secLbl = { fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', margin: '0 2px 8px' };
const card = { backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderLeft: '4px solid var(--as-warning)', borderRadius: 12, padding: '14px 15px' };
const top = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' };
const nm = { fontSize: 15, fontWeight: 700, color: 'var(--as-text-primary)' };
const openBadge = { fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--as-success)', backgroundColor: 'var(--as-success-soft)', padding: '2px 7px', borderRadius: 5 };
const forLine = { fontSize: 12.5, color: 'var(--as-text-secondary)', marginTop: 6 };
const cta = { width: '100%', minHeight: 46, marginTop: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none', cursor: 'pointer' };
const balCard = { position: 'relative', display: 'block', width: '100%', textAlign: 'left', backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 12, padding: '14px 15px', cursor: 'pointer' };
const balLbl = { fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--as-text-secondary)' };
const balBig = { display: 'flex', alignItems: 'center', gap: 8, marginTop: 9, fontSize: 19, fontWeight: 700, color: 'var(--as-danger)', fontVariantNumeric: 'tabular-nums' };
const balSub = { fontSize: 12, color: 'var(--as-text-secondary)', marginTop: 5 };
