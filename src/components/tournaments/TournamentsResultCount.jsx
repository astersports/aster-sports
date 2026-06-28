// L99 enhancement #5: aria-live result count. Gives sighted users a quick
// density signal ("12 tournaments") and announces filter-result changes to
// screen readers (clarity + a11y). "+ more" hint when pagination has rows
// beyond the current page, so the count never reads as the final total.
export default function TournamentsResultCount({ count, hasMore }) {
  if (count === 0) return null;
  const noun = count === 1 ? 'tournament' : 'tournaments';
  return (
    <div
      aria-live="polite"
      style={{
        fontSize: 11, fontWeight: 500, letterSpacing: '0.5px',
        textTransform: 'uppercase', color: 'var(--as-text-tertiary)',
        marginBottom: 10,
      }}
    >
      {count}{hasMore ? '+' : ''} {noun}
    </div>
  );
}
