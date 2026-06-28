import { ChevronRight, Sparkles } from 'lucide-react';

// Futures Academy spotlight (L99 enhancement). Futures Academy is a headline
// selling point of the platform — never a footnote (CLAUDE.md §4). It surfaces
// here as a prominent, branded banner on the family programs surface so parents
// see the development pathway first. If a Futures-flagged enrollment exists for
// the family (roster_type carried as a 'futures_academy' status), it greets by
// name; otherwise it invites discovery. --as-* tokens only (academy palette).
export default function FuturesAcademySpotlight({ enrolledNames = [], openSlug }) {
  const isIn = enrolledNames.length > 0;
  const who = enrolledNames.length === 1
    ? enrolledNames[0]
    : enrolledNames.slice(0, -1).join(', ') + ' and ' + enrolledNames[enrolledNames.length - 1];

  const body = isIn
    ? `${who} ${enrolledNames.length === 1 ? 'is' : 'are'} in the Futures Academy — extra development reps with the coaching staff.`
    : 'Extra development reps with the coaching staff, built to grow players between seasons.';

  const Wrapper = openSlug ? 'a' : 'section';
  const linkProps = openSlug ? { href: `/r/${openSlug}`, className: 'as-press' } : {};

  return (
    <Wrapper style={card} aria-label="Futures Academy" {...linkProps}>
      <div style={iconWrap} aria-hidden="true">
        <Sparkles size={20} strokeWidth={2} style={{ color: 'var(--as-academy)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={kicker}>Futures Academy</div>
        <div style={text}>{body}</div>
      </div>
      {openSlug && <ChevronRight size={18} strokeWidth={2} style={{ flex: 'none', color: 'var(--as-academy)' }} aria-hidden="true" />}
    </Wrapper>
  );
}

const card = { display: 'flex', alignItems: 'center', gap: 12, minHeight: 48, backgroundColor: 'var(--as-academy-soft)', border: '1px solid var(--as-academy-soft)', borderRadius: 13, padding: 14, marginBottom: 12, textDecoration: 'none' };
const iconWrap = { flex: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--as-bg-card)' };
const kicker = { fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--as-academy)' };
const text = { fontSize: 13, fontWeight: 500, color: 'var(--as-text-primary)', lineHeight: 1.45, marginTop: 2 };
