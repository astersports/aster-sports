export default function FormGuide({ results }) {
  if (!results?.length) return null;
  const colors = { W: 'var(--em-success)', L: 'var(--em-danger)', T: 'var(--em-neutral)' };
  const wins = results.filter((r) => r === 'W').length;
  const losses = results.filter((r) => r === 'L').length;
  const ties = results.filter((r) => r === 'T').length;
  const ariaLabel = `Form guide — ${wins} ${wins === 1 ? 'win' : 'wins'}, ${losses} ${losses === 1 ? 'loss' : 'losses'}, ${ties} ${ties === 1 ? 'tie' : 'ties'}`;
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }} role="img" aria-label={ariaLabel}>
      {results.map((r, i) => (
        <div key={i} aria-hidden="true" style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: colors[r] || 'var(--em-neutral)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'var(--em-text-inverse)' }}>
          {r}
        </div>
      ))}
    </div>
  );
}
