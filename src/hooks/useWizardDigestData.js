// Wave 4.2-A-8d (P0 hotfix) — bundles the weekly_digest-specific data
// gathering BriefingComposer needs when admin picks kind=weekly_digest
// from the generic wizard. Returns the same shape DigestComposer
// gathers, scoped to a default period (defaultPeriod()). The wizard
// has no period-picker UI; admin uses DigestComposer for non-default
// periods.
//
// Hook is safe to call always — it short-circuits to empty data when
// `enabled` is false, avoiding wasted queries for non-digest kinds.

import { useState } from 'react';
import { defaultPeriod } from '../lib/engine/digestPeriod';
import { useDigestEvents } from './useDigestEvents';

export function useWizardDigestData({ orgId, enabled }) {
  const [period] = useState(() => defaultPeriod());
  const scopedOrgId = enabled ? orgId : null;
  const scopedPeriod = enabled ? period : null;
  const { events, tournaments, teams, rsvpCountsByEvent } = useDigestEvents({ orgId: scopedOrgId, period: scopedPeriod });
  return { period, events, tournaments, teams, rsvpCountsByEvent };
}
