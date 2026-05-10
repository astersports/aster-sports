// Wave 4.2-A-8a — PreviewPanel routes 4 calendar-anchored kinds
// through RESOLVER_REGISTRY via useResolverPreview. Free-form kinds
// keep legacy compose. academy_callup_notice shows the blocker
// banner (token mint pending in 4.3).

import { useEffect, useMemo, useRef, useState } from 'react';
import { compose, renderSections } from '../../lib/engine/composer';
import { getDispatchSendPath, RESOLVER_REGISTRY } from '../../lib/engine/resolvers/registry';
import { useResolverPreview } from '../../lib/engine/useResolverPreview';

const wrap = { display: 'flex', flexDirection: 'column', gap: 8, height: '100%' };
const topBar = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-text-tertiary)' };
const frameStyle = { width: '100%', minHeight: 480, border: '1px solid var(--em-border-default)', borderRadius: 10, backgroundColor: '#ffffff' };
const bannerStyle = { padding: 16, borderRadius: 10, backgroundColor: 'var(--em-warning-soft)', border: '1px solid var(--em-warning)', fontSize: 14, color: 'var(--em-text-primary)' };

function safeLegacyCompose(kind, data) {
  try { return compose({ kind, data }); }
  catch (e) { return { html: `<div style="padding:24px;color:#dc2626;font-family:Inter,sans-serif;">Preview error: ${e.message}</div>`, plainText: '' }; }
}

function buildLegacyData(state, coaches, families, eventTitle, before, after, period) {
  const base = { ...state.body, signoff_message: state.signoff_message, coaches };
  if (state.kind === 'schedule_change') {
    return { ...base, before: before || state.body?.before, after: after || state.body?.after, eventTitle: eventTitle || state.body?.eventTitle };
  }
  if (state.kind === 'weekly_digest') {
    const f = families?.[0] || { team_ids: [], guardian_id: null };
    return { ...base, family: f, events: [], teams: [], tournaments: [], period, body_notes: state.body?.body_notes, ops_notes: state.body?.ops_notes };
  }
  return base;
}

export default function PreviewPanel({ state, families, coaches, eventTitle, before, after, recipientCount }) {
  const iframeRef = useRef(null);
  const [period] = useState(() => ({ start: new Date(), end: new Date(Date.now() + 7 * 86400000) }));
  const sendPath = getDispatchSendPath(state.kind);

  const entry = sendPath === 'composerSubmit' ? RESOLVER_REGISTRY[state.kind] : null;
  const anchor = useMemo(() => entry ? entry.anchorFromState(state) : null, [entry, state]);
  const overrides = useMemo(() => entry ? entry.overridesFromState(state) : null, [entry, state]);
  const preview = useResolverPreview({ resolve: entry?.resolve || null, anchor });

  const composed = useMemo(() => {
    if (sendPath === 'blocked') return { html: '' };
    if (entry) {
      if (preview.isLoading) return { html: '<div style="padding:24px;font-family:Inter,sans-serif;color:#64748b;">Loading preview…</div>' };
      if (preview.error) return { html: `<div style="padding:24px;color:#dc2626;font-family:Inter,sans-serif;">Preview error: ${preview.error.message}</div>` };
      if (!preview.data) return { html: '' };
      if (!preview.data.slices.length) return { html: '<div style="padding:24px;font-family:Inter,sans-serif;color:#64748b;">No recipients for this anchor.</div>' };
      try {
        const { content_sections } = entry.compose(preview.data.context, preview.data.slices[0], overrides);
        const inner = renderSections(content_sections);
        return { html: `<div style="max-width:600px;margin:0 auto;background-color:#ffffff;font-family:Inter,system-ui,sans-serif;padding:0 0 24px 0;">${inner}</div>` };
      } catch (e) {
        return { html: `<div style="padding:24px;color:#dc2626;font-family:Inter,sans-serif;">Preview error: ${e.message}</div>` };
      }
    }
    const data = buildLegacyData(state, coaches, families, eventTitle, before, after, period);
    return safeLegacyCompose(state.kind || 'custom_message', data);
  }, [sendPath, entry, preview, overrides, state, coaches, families, eventTitle, before, after, period]);

  useEffect(() => {
    if (sendPath === 'blocked') return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=600"></head><body style="margin:0;padding:0;background:#f8fafc;">${composed.html}</body></html>`);
    doc.close();
  }, [composed.html, sendPath]);

  const audience = state.test_only
    ? 'Preview · admin@ only'
    : `Preview · sends to ${recipientCount ?? '…'} ${recipientCount === 1 ? 'family' : 'families'}`;

  if (sendPath === 'blocked') {
    return (
      <div style={wrap}>
        <div style={topBar}>{audience}</div>
        <div style={bannerStyle}>
          <strong>Sends disabled for {state.kind}.</strong>
          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--em-text-secondary)' }}>
            Callup token infrastructure is pending in wave 4.3. Compose can preview but not send.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={topBar}>{audience}</div>
      <iframe ref={iframeRef} title="Briefing preview" sandbox="" style={frameStyle} />
    </div>
  );
}
