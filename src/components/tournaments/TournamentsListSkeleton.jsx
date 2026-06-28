import SectionSkeleton from '../home/SectionSkeleton';

// L99 enhancement #1: shape-matched loading skeleton (Linear/Stripe pattern,
// §16.11) replaces the bare "Loading..." text. The user sees the list layout
// instantly and rows fill the slots, reducing perceived wait. aria-busy +
// visually-hidden status text announce the load to screen readers.
export default function TournamentsListSkeleton({ rows = 4 }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span style={{
        position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
        overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
      }}>
        Loading tournaments…
      </span>
      <SectionSkeleton variant="card" rows={rows} />
    </div>
  );
}
