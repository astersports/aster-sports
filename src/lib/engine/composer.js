// Engine composer. Dispatches to per-kind composers that build
// { subject, html, plainText, ... } from input data.
//
// Section-level dispatch (SECTION_RENDERERS + renderSections +
// renderSectionsPlainText) lives in ./sectionRenderers and is
// re-exported here so existing consumers' imports stay stable.
// Split 2026-05-24 to keep this file under AP #6's 150-line cap.
//
// D-3(a) 2026-06-03 — defensive KIND_COMPOSERS entries for
// weekly_digest + academy_callup_notice removed. PreviewPanel widened
// its registry-path criterion to cover all RESOLVER_REGISTRY entries,
// so the defensive duplicates are no longer needed. AP #34 grep
// precondition: zero non-test callers of compose({kind:'weekly_digest'})
// or compose({kind:'academy_callup_notice'}) at removal time.

import { composeAnnouncement } from './renderers/announcement';
import { composeCustomMessage } from './renderers/customMessage';

export { SECTION_RENDERERS, renderSections, renderSectionsPlainText } from './sectionRenderers';

// KIND_COMPOSERS — legacy compose() path for free-form kinds NOT in
// RESOLVER_REGISTRY (announcement, custom_message).
const KIND_COMPOSERS = {
  announcement: composeAnnouncement,
  custom_message: composeCustomMessage,
};

export function compose({ kind, data }) {
  const kindComposer = KIND_COMPOSERS[kind];
  if (!kindComposer) {
    const supported = Object.keys(KIND_COMPOSERS).join(', ');
    throw new Error(`No engine composer for kind "${kind}". Supported kinds: ${supported}.`);
  }
  return kindComposer(data);
}
