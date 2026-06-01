// §4.AI Option C — PR A. Freestanding host for BriefingComposer.
// Replaces the BriefingsInboxPage + modal-overlay pattern; admin now
// lands directly in the composer wizard. Synthetic alerts (recap
// pending, tournament wrap-up, schedule-change followup) surface on
// the Admin Home AlertZone instead of in a separate inbox.
//
// onClose → / (admin home). The composer's draft auto-save preserves
// in-progress work, so leaving via Cancel is non-destructive.
//
// Deep-link hydration (useBriefingDeepLink) is unchanged: anchor/kind/
// draft URL params from EventHeroActions, TeamDetailHero,
// TournamentHeader, ComposeAnchorCta still pre-fill the wizard.

import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBriefingDeepLink } from '../hooks/useBriefingDeepLink';
import { useOrgSettings } from '../hooks/useOrgSettings';
import { useAuth } from '../context/AuthContext';
import PilotModeChip from '../components/briefings/PilotModeChip';

const BriefingComposer = lazy(() => import('../components/briefings/BriefingComposer'));

const wrap = { backgroundColor: 'var(--as-bg-page)', minHeight: '100vh' };

export default function BriefingsComposePage() {
  const navigate = useNavigate();
  const { orgId } = useAuth();
  const { pilotModeEnabled } = useOrgSettings(orgId);
  const deepLink = useBriefingDeepLink();
  const [composer, setComposer] = useState(null);

  useEffect(() => {
    if (composer) return undefined;
    Promise.resolve().then(() => {
      setComposer(deepLink.composerInit || {});
      deepLink.consume();
    });
    return undefined;
  }, [composer, deepLink]);

  const onClose = () => navigate('/');

  return (
    <div style={wrap}>
      {pilotModeEnabled && (
        <div style={{ padding: '12px 16px 0' }}>
          <PilotModeChip />
        </div>
      )}
      {composer && (
        <Suspense fallback={null}>
          <BriefingComposer
            initialKind={composer.kind}
            initialAnchorKind={composer.anchor_kind}
            initialAnchorId={composer.anchor_id}
            initialDraftId={composer.draft_id}
            onClose={onClose}
          />
        </Suspense>
      )}
    </div>
  );
}
