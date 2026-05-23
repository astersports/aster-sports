// Engine composer. Dispatches to per-kind composers that build
// { subject, html, plainText, ... } from input data.
//
// Section-level dispatch (SECTION_RENDERERS + renderSections +
// renderSectionsPlainText) lives in ./sectionRenderers and is
// re-exported here so existing consumers' imports stay stable.
// Split 2026-05-24 to keep this file under AP #6's 150-line cap.

import { composeAcademyCallupNotice } from './renderers/academyCallupNotice';
import { composeWeeklyDigest } from './renderers/weeklyDigest';
import { composeAnnouncement } from './renderers/announcement';
import { composeCustomMessage } from './renderers/customMessage';

export { SECTION_RENDERERS, renderSections, renderSectionsPlainText } from './sectionRenderers';

// KIND_COMPOSERS — legacy compose() path for kinds NOT in
// RESOLVER_REGISTRY (announcement, custom_message). weekly_digest +
// academy_callup_notice retained defensively; their production sends
// go through dedicated paths (digestSend, academyCallupSend).
const KIND_COMPOSERS = {
  academy_callup_notice: composeAcademyCallupNotice,
  weekly_digest: composeWeeklyDigest,
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
