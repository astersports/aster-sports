// Current document versions for guardian_consents writes.
// Bump the version string when the policy/ToS text changes materially —
// existing guardians will then re-affirm on next sign-in (signup-gate
// wiring is the P0-2 part 2 follow-up; consent rows from before the bump
// stay as historical evidence per the audit-log discipline).

export const CONSENT_VERSIONS = Object.freeze({
  privacy_policy: '0.1-draft-2026-06-02',
  terms_of_service: '0.1-draft-2026-06-02',
  photo_video_release: null, // not yet drafted
  safesport_acknowledgment: null,
  communications_optin: null,
});
