import NextEventCard from '../admin/NextEventCard';

// ComingUpSection — slot 4 of shell contract v2. The single next event
// (not already surfaced in Needs you); the full week lives on the Schedule
// tab. Reuses the canonical NextEventCard. Renders nothing when there's no
// upcoming event — the off-season / all-clear states live in the tail.
const SECTION_LABEL = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--as-text-meta)', marginBottom: 8,
};

const SEE_MORE = {
  width: '100%', marginTop: 8, padding: 10, minHeight: 44,
  textAlign: 'center', fontSize: 13, fontWeight: 600,
  color: 'var(--as-accent)', backgroundColor: 'var(--as-bg-card)',
  border: '1px solid var(--as-border-default)', borderRadius: 10,
  cursor: 'pointer', fontFamily: 'inherit',
};

export default function ComingUpSection({ event, weather, draft, rsvpClose, onSeeSchedule }) {
  if (!event) return null;
  return (
    <section className="min-w-0" aria-label="Coming up">
      <div style={SECTION_LABEL}>Coming up</div>
      <NextEventCard event={event} weather={weather} draft={draft} rsvpClose={rsvpClose} />
      <button type="button" onClick={onSeeSchedule} className="as-press" style={SEE_MORE}>
        See full schedule
      </button>
    </section>
  );
}
