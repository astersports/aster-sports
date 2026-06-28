// L99 enhancement #6: load-more button with an in-flight loading state.
// Previously the button vanished the instant load began (it was gated on
// `!loading`), giving no feedback during the append fetch. Here it stays
// mounted, disables, and shows "Loading…" so the tap reads as responsive.
// 44px tap target, token-only colors, aria-busy for screen readers.
export default function TournamentsLoadMore({ onClick, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-busy={loading}
      aria-label="Load more tournaments"
      className="as-press"
      style={{
        width: '100%', minHeight: 44, marginTop: 8,
        borderRadius: 10, border: '1px solid var(--as-border-default)',
        backgroundColor: 'var(--as-bg-card)', color: 'var(--as-accent)',
        fontSize: 15, fontWeight: 500, fontFamily: 'inherit',
        cursor: loading ? 'default' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? 'Loading…' : 'Load more'}
    </button>
  );
}
