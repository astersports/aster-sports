// Wave 4.4-T0c — DevicePreviewFrame. Three-tab preview wrapper for
// parent-facing briefing renders, satisfying CLAUDE.md §12 rule #12:
// "Every parent-facing message/briefing generator ships with device-frame
// preview. The compose UI must render the output in 375px (mobile),
// 600px (desktop email), and plain-text frames before admin can copy/send."
//
// Props: { html, plainText }
//   html       — string of inline-styled HTML rendered into a sandboxed iframe
//   plainText  — string rendered into a <pre> for the plain tab
//
// The iframe is sandboxed (sandbox="") so scripts in the rendered HTML are
// inert. Content is injected via the srcDoc attribute — NOT by writing to
// iframe.contentDocument. A sandbox without allow-same-origin gives the
// frame an opaque origin, so parent access to contentDocument is blocked in
// real browsers (notably iOS Safari) and the doc.write approach rendered a
// blank frame. jsdom ignores that restriction, which is why the old
// contentDocument-write path passed CI but failed on device. srcDoc is
// parsed by the browser inside the frame and needs no parent access.

import { useState } from 'react';

const TABS = [
  { key: 'mobile',  label: 'Mobile · 375',  viewport: 375 },
  { key: 'desktop', label: 'Desktop · 600', viewport: 600 },
  { key: 'plain',   label: 'Plain text',    viewport: null },
];

const tabRow = { display: 'flex', gap: 4, padding: 4, backgroundColor: 'var(--as-bg-tertiary)', borderRadius: 8 };
const tabBtn = (active) => ({
  flex: 1, minHeight: 32, padding: '0 10px', borderRadius: 6,
  fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', border: 'none',
  backgroundColor: active ? 'var(--as-bg-card)' : 'transparent',
  color: active ? 'var(--as-text-primary)' : 'var(--as-text-secondary)',
  boxShadow: active ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
});
const frameWrap = (viewport) => ({
  width: viewport, margin: '0 auto', minHeight: 480,
  border: '1px solid var(--as-border-default)', borderRadius: 10,
  backgroundColor: '#ffffff', overflow: 'hidden',
});
const iframeStyle = { width: '100%', minHeight: 480, border: 'none', display: 'block' };
const plainStyle = {
  margin: 0, padding: 16, minHeight: 480,
  border: '1px solid var(--as-border-default)', borderRadius: 10,
  backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)',
  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
  fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordWrap: 'break-word',
};

function buildSrcDoc(viewport, html) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=${viewport}"></head><body style="margin:0;padding:0;background:#f8fafc;">${html || ''}</body></html>`;
}

export default function DevicePreviewFrame({ html, plainText }) {
  const [tab, setTab] = useState('mobile');

  const viewport = tab === 'mobile' ? 375 : 600;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div role="tablist" aria-label="Preview device" style={tabRow}>
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key}
            onClick={() => setTab(t.key)} className="as-press" style={tabBtn(tab === t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'plain'
        ? <pre style={plainStyle}>{plainText || '(no plain-text body)'}</pre>
        : (
          <div style={frameWrap(viewport)}>
            {/* key on viewport + html length so the iframe REMOUNTS when the
               async preview arrives (loading -> loaded) or the viewport
               changes. Updating srcDoc on an existing iframe does not reliably
               repaint on iOS Safari, so the frame stayed blank until a tab
               switch forced a remount (Frank-reported 2026-06-08). A remount
               guarantees a fresh paint. */}
            <iframe key={`${viewport}:${(html || '').length}`} title="Briefing preview" sandbox="" srcDoc={buildSrcDoc(viewport, html)} style={iframeStyle} />
          </div>
        )}
    </div>
  );
}
