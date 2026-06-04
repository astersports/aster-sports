// Wave 4.2-A-8a — PreviewPanel routes calendar-anchored kinds through
// RESOLVER_REGISTRY via useResolverPreview. Free-form kinds (announcement,
// custom_message) keep legacy compose.
//
// Wave 4.4-T0c — preview surface delegates to DevicePreviewFrame
// (375 / 600 / plain) per CLAUDE.md §12 rule #12.
//
// D-3(a) 2026-06-03 — registry-path criterion widened to `entry !== null`
// (was `sendPath === 'composerSubmit'`). Closes BUG C: rsvp_nudge,
// weekly_digest, academy_callup_notice (sendPath != composerSubmit) now
// preview via registry instead of falling through to legacy KIND_COMPOSERS.
// Also closes the prior DUAL-COMPOSE drift surface (weeklyDigest had
// preview via renderers/weeklyDigest legacy vs send via resolvers/
// weeklyDigest registry — both render paths now go through resolvers/).

import { useMemo, useState } from 'react';
import { compose, renderSections, renderSectionsPlainText } from '../../lib/engine/composer';
import { RESOLVER_REGISTRY } from '../../lib/engine/resolvers/registry';
import { useResolverPreview } from '../../lib/engine/useResolverPreview';
import { APP_BASE_URL } from '../../lib/constants';
import DevicePreviewFrame from '../shared/DevicePreviewFrame';

const wrap = { display: 'flex', flexDirection: 'column', gap: 8, height: '100%' };
const topBar = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--as-text-tertiary)' };

// Placeholder substituted for preview only — real per-recipient URLs are
// inserted at send time by digestSend. Per audit doc §B5.3, this used to
// hardcode the LH tenant deploy host (app.legacyhoopers.org); now derives
// from the platform-level APP_BASE_URL so the preview URL matches whatever
// host is currently serving the app (astersports.app by default).
const PREVIEW_UNSUBSCRIBE_URL = `${APP_BASE_URL}/unsubscribe?preview=1`;

function withPreviewUnsubscribe({ html, plainText }) {
  return {
    html: (html || '').replaceAll('{{UNSUBSCRIBE_URL}}', PREVIEW_UNSUBSCRIBE_URL),
    plainText: (plainText || '').replaceAll('{{UNSUBSCRIBE_URL}}', PREVIEW_UNSUBSCRIBE_URL),
  };
}

function errorRender(msg) {
  return { html: `<div style="padding:24px;color:#dc2626;font-family:Inter,sans-serif;">${msg}</div>`, plainText: msg };
}

function safeLegacyCompose(kind, data) {
  try {
    const r = compose({ kind, data });
    return { html: r.html, plainText: r.plainText || '' };
  } catch (e) { return errorRender(`Preview error: ${e.message}`); }
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
  const [period] = useState(() => ({ start: new Date(), end: new Date(Date.now() + 7 * 86400000) }));

  // D-3(a) — registry path covers every kind that has a RESOLVER_REGISTRY
  // entry, regardless of sendPath (was sendPath === 'composerSubmit'-only).
  const entry = RESOLVER_REGISTRY[state.kind] || null;
  const anchor = useMemo(() => entry ? entry.anchorFromState(state) : null, [entry, state]);
  const overrides = useMemo(() => entry ? entry.overridesFromState(state) : null, [entry, state]);
  const preview = useResolverPreview({ resolve: entry?.resolve || null, anchor });

  const composed = useMemo(() => {
    if (entry) {
      if (preview.isLoading) return { html: '<div style="padding:24px;font-family:Inter,sans-serif;color:#64748b;">Loading preview…</div>', plainText: 'Loading preview…' };
      if (preview.error) return errorRender(`Preview error: ${preview.error.message}`);
      if (!preview.data) return { html: '', plainText: '' };
      if (!preview.data.slices.length) return { html: '<div style="padding:24px;font-family:Inter,sans-serif;color:#64748b;">No recipients for this anchor.</div>', plainText: 'No recipients for this anchor.' };
      try {
        const { content_sections } = entry.compose(preview.data.context, preview.data.slices[0], overrides);
        const inner = renderSections(content_sections);
        return {
          html: `<div style="max-width:600px;margin:0 auto;background-color:#ffffff;font-family:Inter,system-ui,sans-serif;padding:0 0 24px 0;">${inner}</div>`,
          plainText: renderSectionsPlainText(content_sections),
        };
      } catch (e) { return errorRender(`Preview error: ${e.message}`); }
    }
    const data = buildLegacyData(state, coaches, families, eventTitle, before, after, period);
    return safeLegacyCompose(state.kind || 'custom_message', data);
  }, [entry, preview, overrides, state, coaches, families, eventTitle, before, after, period]);

  const audience = state.test_only
    ? 'Preview · admin@ only'
    : `Preview · sends to ${recipientCount ?? '…'} ${recipientCount === 1 ? 'family' : 'families'}`;

  return (
    <div style={wrap}>
      <div style={topBar}>{audience}</div>
      <DevicePreviewFrame {...withPreviewUnsubscribe(composed)} />
    </div>
  );
}
