// Wave 3.11 follow-up — live HTML preview. Calls the engine
// composer with current wizard state and renders the result inside
// a sandboxed iframe so parent CSS doesn't bleed in.

import { useEffect, useMemo, useRef, useState } from 'react';
import { compose } from '../../lib/engine/composer';

const wrap = { display: 'flex', flexDirection: 'column', gap: 8, height: '100%' };
const topBar = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-text-tertiary)' };
const frameStyle = { width: '100%', minHeight: 480, border: '1px solid var(--em-border-default)', borderRadius: 10, backgroundColor: '#ffffff' };

function safeCompose(kind, data) {
  try { return compose({ kind, data }); }
  catch (e) { return { html: `<div style="padding:24px;color:#dc2626;font-family:Inter,sans-serif;">Preview error: ${e.message}</div>`, plainText: '' }; }
}

export default function PreviewPanel({ state, families, coaches, eventTitle, before, after, recipientCount }) {
  const iframeRef = useRef(null);
  const [period] = useState(() => ({ start: new Date(), end: new Date(Date.now() + 7 * 86400000) }));

  const data = useMemo(() => {
    const base = { ...state.body, signoff_message: state.signoff_message, coaches };
    if (state.kind === 'schedule_change') {
      return { ...base, before: before || state.body?.before, after: after || state.body?.after, eventTitle: eventTitle || state.body?.eventTitle };
    }
    if (state.kind === 'weekly_digest') {
      const f = families?.[0] || { team_ids: [], guardian_id: null };
      return { ...base, family: f, events: [], teams: [], tournaments: [], period, body_notes: state.body?.body_notes, ops_notes: state.body?.ops_notes };
    }
    return base;
  }, [state.kind, state.body, state.signoff_message, coaches, families, eventTitle, before, after, period]);

  const composed = useMemo(() => safeCompose(state.kind || 'custom_message', data), [state.kind, data]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=600"></head><body style="margin:0;padding:0;background:#f8fafc;">${composed.html}</body></html>`);
    doc.close();
  }, [composed.html]);

  const audience = state.test_only
    ? 'Preview · admin@ only'
    : `Preview · sends to ${recipientCount ?? '…'} ${recipientCount === 1 ? 'family' : 'families'}`;

  return (
    <div style={wrap}>
      <div style={topBar}>{audience}</div>
      <iframe ref={iframeRef} title="Briefing preview" sandbox="" style={frameStyle} />
    </div>
  );
}
