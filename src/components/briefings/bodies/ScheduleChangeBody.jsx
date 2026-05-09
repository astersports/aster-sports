/* eslint-disable react-refresh/only-export-components */
// Wave 3.11 follow-up — schedule_change body editor. Locked diff
// preview, no editable fields (the diff is captured by buildSaveDiff
// in wizardForm.js when admin saves a recurring/single edit).

import { labelStyle } from './_styles';

export const defaultValue = { before: null, after: null, eventTitle: '' };

export function validate(v) {
  if (!v?.before || !v?.after) return ['Diff payload missing — open this kind from EventDetail edit flow.'];
  return [];
}

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function ScheduleChangeBody({ value }) {
  const before = value?.before || {};
  const after = value?.after || {};
  return (
    <div style={{ padding: 14, border: '1px solid var(--em-border-default)', borderRadius: 10, backgroundColor: 'var(--em-bg-card)' }}>
      <span style={labelStyle}>Locked diff</span>
      <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginTop: 4 }}>
        Generated from the event edit flow. To change the diff, edit the event and resave.
      </div>
      <div style={{ marginTop: 10, fontSize: 14, color: 'var(--em-text-secondary)', textDecoration: 'line-through' }}>
        Previous: {fmt(before.start_at)}{before.location ? ` · ${before.location}` : ''}
      </div>
      <div style={{ marginTop: 4, fontSize: 15, fontWeight: 700, color: 'var(--em-text-primary)' }}>
        Updated: {fmt(after.start_at)}{after.location ? ` · ${after.location}` : ''}
      </div>
    </div>
  );
}
