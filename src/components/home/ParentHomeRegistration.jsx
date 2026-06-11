import { ChevronRight, Plus } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';
import { familyDueCents } from '../../lib/home/registrationLane';

// H-2 — the parent Home registration + balance lane. Answers the two first-screen
// questions without entering My Family: "anything to register for?" (a conditional
// open-program CTA for the family's eligible children) and "what do I owe?" (the
// family balance, one source: family_balances). Both conditional — the whole
// section is absent when nothing is open AND nothing is owed (no clutter).
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
    <section aria-label="Registration">
      <div style={secLbl}>Registration</div>

      {one ? (
        <a href={`/r/${one.slug}`} className="as-press" style={{ ...card, textDecoration: 'none' }}>
          <span style={iconWrap} aria-hidden="true"><Plus size={18} strokeWidth={2.3} color="var(--as-accent)" /></span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={title}>Register{hint ? ` ${hint}` : ''}</span>
            <span style={sub}>{one.name}{one.closesAt ? ` · closes ${shortDate(one.closesAt)}` : ''}</span>
          </span>
          <ChevronRight size={20} color="var(--as-text-tertiary)" aria-hidden="true" />
        </a>
      ) : open.length >= 2 ? (
        <button type="button" className="as-press" style={card} onClick={() => onNavigate('/family')}>
          <span style={iconWrap} aria-hidden="true"><Plus size={18} strokeWidth={2.3} color="var(--as-accent)" /></span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={title}>{open.length} programs open to register</span>
            <span style={sub}>See what your children can join</span>
          </span>
          <ChevronRight size={20} color="var(--as-text-tertiary)" aria-hidden="true" />
        </button>
      ) : null}

      {due > 0 && (
        <button type="button" className="as-press" style={{ ...card, marginTop: open.length ? 8 : 0 }} onClick={() => onNavigate('/family')}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ ...title, color: 'var(--as-danger)' }}>{formatCurrency(due)} due</span>
            <span style={sub}>Across your family · tap to see details</span>
          </span>
          <ChevronRight size={20} color="var(--as-text-tertiary)" aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

const secLbl = { fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', margin: '0 2px 8px' };
const card = { display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 12, padding: '13px 15px', cursor: 'pointer' };
const iconWrap = { width: 34, height: 34, borderRadius: 9, backgroundColor: 'var(--as-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' };
const title = { display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--as-text-primary)' };
const sub = { display: 'block', fontSize: 12.5, color: 'var(--as-text-tertiary)', marginTop: 1 };
