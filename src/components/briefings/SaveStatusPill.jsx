// Wave 4.1b §6.I — save status pill in BriefingComposer header.
// Replaces the static "Saved 6:25 PM" timestamp with a 3-state pill:
//   draft  — wizard has a kind but no save has fired yet
//   saving — useBriefingDraft.busy is true
//   saved  — savedAt is non-null and not currently saving
// The timestamp moves to a hover title so the pill reads as live state.

const baseStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  minHeight: 22, padding: '0 10px',
  borderRadius: 9999, fontSize: 11, fontWeight: 600,
  letterSpacing: '0.04em', textTransform: 'uppercase',
};

const TONE = {
  draft: { dot: '🟡', bg: 'var(--em-bg-tertiary)', fg: 'var(--em-text-secondary)' },
  saving: { dot: '🔵', bg: 'var(--em-info-soft)', fg: 'var(--em-info)' },
  saved: { dot: '🟢', bg: 'var(--em-success-soft)', fg: 'var(--em-success)' },
};

function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function SaveStatusPill({ busy, savedAt, hasKind }) {
  let key = 'draft';
  if (busy) key = 'saving';
  else if (savedAt) key = 'saved';
  if (!hasKind && !savedAt && !busy) return null;
  const tone = TONE[key];
  const label = key === 'saving' ? 'Saving…' : key === 'saved' ? 'Saved' : 'Draft';
  const title = savedAt ? `Last saved ${fmtTime(savedAt)}` : 'Unsaved changes';
  return (
    <span title={title} style={{ ...baseStyle, backgroundColor: tone.bg, color: tone.fg }}>
      <span aria-hidden="true">{tone.dot}</span>
      {label}
    </span>
  );
}
