// Wave 4.4-B housekeeping — wizard header extracted from
// BriefingComposer.jsx so the parent stays under the 150 LOC cap.
//
// Pure presentational: back button (hidden on step 1) + step
// counter + SaveStatusPill. Behavior + UI byte-identical to the
// inline header that lived at BriefingComposer.jsx:129-133 before
// this extract.

import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import SaveStatusPill from './SaveStatusPill';

const headerWrap = {
  display: 'flex', alignItems: 'center', gap: 8,
  fontSize: 12, color: 'var(--em-text-tertiary)',
};
const backBtn = {
  minWidth: 44, minHeight: 44, padding: 12, border: 'none',
  background: 'transparent', cursor: 'pointer',
};
const viewSentStyle = {
  fontSize: 12, fontWeight: 500, color: 'var(--em-accent)',
  textDecoration: 'none', padding: '0 8px', minHeight: 32,
  display: 'inline-flex', alignItems: 'center',
};

export default function WizardHeader({ step, totalSteps, onBack, draft, hasKind, viewSentTo = null }) {
  return (
    <div style={headerWrap}>
      {step > 1 && (
        <button
          type="button"
          onClick={onBack}
          className="sf-press"
          style={backBtn}
          aria-label="Back to previous step"
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
        </button>
      )}
      <span>{`Step ${step} of ${totalSteps}`}</span>
      <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {viewSentTo && (
          <Link to={viewSentTo} style={viewSentStyle} className="sf-press" aria-label="View sent briefings">
            View sent
          </Link>
        )}
        <SaveStatusPill busy={draft.busy} savedAt={draft.savedAt} hasKind={hasKind} />
      </span>
    </div>
  );
}
