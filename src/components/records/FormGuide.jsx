export default function FormGuide({ results }) {
  if (!results?.length) return null;
  const colors = { W: 'var(--em-success)', L: 'var(--em-danger)', T: 'var(--em-neutral)' };
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {results.map((r, i) => (
        <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: colors[r] || 'var(--em-neutral)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'var(--em-text-inverse)' }}>
          {r}
        </div>
      ))}
    </div>
  );
}
