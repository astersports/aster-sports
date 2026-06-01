import { useToast } from '../../context/useToast';

// Small "Copy" pill next to the ROSTER section header. Serializes the
// team name + sorted player list to plain text and writes it to the
// clipboard for quick pasting into a group text or email.
//
// ordinalGrade is duplicated from PlayerRow — will consolidate into
// lib/formatters.js in a future cleanup pass.
function ordinalGrade(g) {
  if (!g) return '';
  if (g === 1) return '1st';
  if (g === 2) return '2nd';
  if (g === 3) return '3rd';
  return `${g}th`;
}

export default function CopyRosterButton({ team, sortedPlayers }) {
  const { showToast } = useToast();
  const onCopy = async () => {
    const text = sortedPlayers.map((p) =>
      `#${p.jersey_number || '-'} ${p.first_name} ${p.last_name} (${ordinalGrade(p.grade)})`
    ).join('\n');
    navigator.vibrate?.(10);
    try {
      await navigator.clipboard.writeText(`${team.name} Roster\n\n${text}`);
      showToast('Roster copied');
    } catch {
      showToast("Couldn't copy. Try once more?", 'error');
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className="as-press flex items-center gap-1"
      style={{
        minHeight: 44, padding: '0 14px', borderRadius: 8,
        border: '1px solid var(--as-border-default)',
        backgroundColor: 'var(--as-bg-card)',
        color: 'var(--as-text-secondary)',
        fontSize: 13, fontWeight: 500,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
      </svg>
      Copy
    </button>
  );
}
