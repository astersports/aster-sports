import { Check } from 'lucide-react';
import ActionRow from './ActionRow';

// NeedsYouSection — slot 3 of shell contract v2: the actions requiring this
// user, capped at 4 with a "see all" overflow. Empty = the all-clear state
// (a shared home state). Loading is covered by the page gate, so this renders
// nothing on the initial blank window.
const SECTION = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--as-text-meta)', marginBottom: 8, padding: '0 2px' };
const COUNT = { backgroundColor: 'var(--as-text-meta)', color: 'var(--as-text-inverse)', fontSize: 10, fontWeight: 700, borderRadius: 9999, minWidth: 18, height: 18, padding: '0 6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', letterSpacing: 0 };
const OVERFLOW = { width: '100%', padding: 10, minHeight: 44, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--as-accent)', backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' };

export default function NeedsYouSection({
  items, overflowCount, totalCount, loading, onRsvpResolved, onNavigate,
  emptyHeading = "You're all set this week",
  emptySub = 'Every RSVP is in. The next one shows up here.',
}) {
  if (loading && totalCount === 0) return null;

  if (totalCount === 0) {
    return (
      <section className="min-w-0" aria-label="Needs you">
        <div style={{ textAlign: 'center', padding: '18px 12px', backgroundColor: 'var(--as-success-soft)', border: '1px solid var(--as-success)', borderRadius: 10 }} role="status">
          <Check size={22} strokeWidth={2} color="var(--as-success)" aria-hidden="true" style={{ margin: '0 auto' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--as-text-primary)', marginTop: 5 }}>{emptyHeading}</div>
          <div style={{ fontSize: 12, color: 'var(--as-text-secondary)', marginTop: 3 }}>{emptySub}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0" aria-label="Needs you">
      <div style={SECTION}>Needs you <span style={COUNT}>{totalCount}</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {items.map((item) => (
          <ActionRow key={item.id} item={item} onRsvpResolved={onRsvpResolved} onNavigate={onNavigate} />
        ))}
        {overflowCount > 0 && (
          <button type="button" onClick={() => onNavigate('/schedule')} className="as-press" style={OVERFLOW}>
            See all {totalCount} →
          </button>
        )}
      </div>
    </section>
  );
}
