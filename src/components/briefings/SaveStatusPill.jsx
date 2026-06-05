// Wave 4.1b §6.I — save status pill in BriefingComposer header.
// Replaces the static "Saved 6:25 PM" timestamp with a 4-state pill:
//   draft  — wizard has a kind but no save has fired yet
//   saving — useBriefingDraft.busy is true
//   saved  — savedAt is non-null and not currently saving
//   error  — useBriefingDraft.error is set (COMPOSE-FRONT P2: silent
//            autosave failure closed — surfaces the data-loss path)
// The timestamp moves to a hover title so the pill reads as live state.

const baseStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  minHeight: 22, padding: '0 10px',
  borderRadius: 9999, fontSize: 11, fontWeight: 600,
  letterSpacing: '0.04em', textTransform: 'uppercase',
};

const TONE = {
  draft: { dot: '🟡', bg: 'var(--as-bg-tertiary)', fg: 'var(--as-text-secondary)' },
  saving: { dot: '🔵', bg: 'var(--as-info-soft)', fg: 'var(--as-info)' },
  saved: { dot: '🟢', bg: 'var(--as-success-soft)', fg: 'var(--as-success)' },
  error: { dot: '🔴', bg: 'var(--as-danger-soft)', fg: 'var(--as-danger)' },
};

function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
}

export default function SaveStatusPill({ busy, savedAt, error, hasKind }) {
  // error wins over saving/saved so a failed save never reads as "Saved".
  let key = 'draft';
  if (error) key = 'error';
  else if (busy) key = 'saving';
  else if (savedAt) key = 'saved';
  if (!hasKind && !savedAt && !busy && !error) return null;
  const tone = TONE[key];
  const label = key === 'error' ? 'Couldn’t save — retry'
    : key === 'saving' ? 'Saving…'
    : key === 'saved' ? 'Saved' : 'Draft';
  const title = error ? "Your last change didn't save — keep editing to retry"
    : savedAt ? `Last saved ${fmtTime(savedAt)}` : 'Unsaved changes';
  return (
    <span title={title} role={error ? 'alert' : undefined} aria-live={error ? 'assertive' : undefined}
      style={{ ...baseStyle, backgroundColor: tone.bg, color: tone.fg }}>
      <span aria-hidden="true">{tone.dot}</span>
      {label}
    </span>
  );
}
