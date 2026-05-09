/* eslint-disable react-refresh/only-export-components */
// Wave 3.11 follow-up — rsvp_nudge body editor STUB. Wave 4.0 ships
// HMAC tokens + per-event anchor URLs and replaces this with real
// editor fields. For now the kind is gated `disabled: true` in
// kindMetadata.js, so this component should never actually mount in
// the picker flow.

export const defaultValue = {};

export function validate() {
  return ['RSVP nudges ship in wave 4.0 — token + edge function not yet wired.'];
}

export default function RsvpNudgeBody() {
  return (
    <div style={{ padding: 14, border: '1px dashed var(--em-border-default)', borderRadius: 10, fontSize: 14, color: 'var(--em-text-tertiary)' }}>
      RSVP nudges arrive in wave 4.0 with one-tap response tokens. Body content auto-generates from event data — no editable fields.
    </div>
  );
}
