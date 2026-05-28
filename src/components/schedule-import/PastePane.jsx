// Wave 5 PR 2 — Step 1 UI for /admin/import-schedule. Single
// textarea + Parse button. State machine handled by useImportSchedule.

const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-text-secondary)', marginBottom: 6, display: 'block' };
const textareaStyle = { width: '100%', minHeight: 320, padding: 14, borderRadius: 10, border: '1.5px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-primary)', fontSize: 13, fontFamily: 'ui-monospace, monospace', resize: 'vertical' };
const btnStyle = { minHeight: 44, padding: '0 24px', borderRadius: 10, border: 'none', backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 15, fontWeight: 600, cursor: 'pointer' };

export default function PastePane({ paste, setPaste, onParse, parsing }) {
  const canParse = paste.trim().length > 0 && !parsing;
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label htmlFor="paste-area" style={labelStyle}>TourneyMachine schedule paste</label>
        <textarea
          id="paste-area"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder="Paste the schedule view from TourneyMachine — raw text is fine."
          style={textareaStyle}
        />
        <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)', marginTop: 6 }}>
          Open the tournament's schedule view on tourneymachine.com, copy the visible text, paste here. URL fetch isn't supported (the source platform blocks bot access).
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onParse} disabled={!canParse} className="em-press"
          style={{ ...btnStyle, opacity: canParse ? 1 : 0.5, cursor: canParse ? 'pointer' : 'not-allowed' }}>
          {parsing ? 'Parsing…' : 'Parse'}
        </button>
      </div>
    </div>
  );
}
