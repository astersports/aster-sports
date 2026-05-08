import { useEffect, useRef, useState } from 'react';

const labelStyle = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--em-text-tertiary)',
};

const chipStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 500,
  backgroundColor: 'var(--em-bg-secondary)',
  color: 'var(--em-text-secondary)',
};

// Renders the engine output in a sandboxed iframe so the inline-styled
// HTML cannot reach into the page. Switches between full HTML and
// plaintext via the toggle buttons.
export default function BriefingPreviewPane({
  html, plainText, eventCount, recipientCount, ready,
}) {
  const [mode, setMode] = useState('full');
  const [debouncedHtml, setDebouncedHtml] = useState(html);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedHtml(html), 300);
    return () => clearTimeout(id);
  }, [html]);

  const iframeRef = useRef(null);

  if (!ready) {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          minHeight: 320,
          padding: 24,
          borderRadius: 10,
          border: '1px dashed var(--em-border-default)',
          backgroundColor: 'var(--em-bg-card)',
          color: 'var(--em-text-tertiary)',
          fontSize: 14,
          textAlign: 'center',
        }}
      >
        Pick a tournament and a team to preview the briefing.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span style={chipStyle} aria-label="Event count">{eventCount} events</span>
          <span style={chipStyle} aria-label="Recipient count">
            {recipientCount === null ? '—' : `${recipientCount} guardians`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span style={labelStyle}>Preview</span>
          <div className="flex" role="tablist" aria-label="Preview format" style={{ borderRadius: 8, backgroundColor: 'var(--em-bg-secondary)', padding: 2 }}>
            {['full', 'plain'].map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                style={{
                  minHeight: 32,
                  padding: '0 12px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  backgroundColor: mode === m ? 'var(--em-bg-card)' : 'transparent',
                  color: mode === m ? 'var(--em-text-primary)' : 'var(--em-text-tertiary)',
                  boxShadow: mode === m ? 'var(--em-shadow-sm)' : 'none',
                }}
              >
                {m === 'full' ? 'HTML' : 'Plain text'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: 'var(--em-bg-card)',
        border: '1px solid var(--em-border-default)',
        borderRadius: 10,
        padding: 8,
        boxShadow: 'var(--em-shadow-sm)',
      }}>
        {mode === 'full' ? (
          <iframe
            ref={iframeRef}
            title="Briefing preview"
            sandbox=""
            srcDoc={debouncedHtml}
            style={{
              width: '100%',
              maxWidth: 600,
              height: 640,
              border: 'none',
              backgroundColor: 'var(--em-text-inverse)',
              display: 'block',
              margin: '0 auto',
            }}
          />
        ) : (
          <pre
            style={{
              maxWidth: 600,
              margin: '0 auto',
              padding: 16,
              fontSize: 13,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              color: 'var(--em-text-primary)',
            }}
          >{plainText}</pre>
        )}
      </div>
    </div>
  );
}
