// Extracted CTA stack for the public schedule (Download .ics / Subscribe /
// Share-QR) plus the SubscribeSheet, so PublicSchedulePage stays under the
// 150-line cap. Buttons only render when there are events to act on; the
// Share button always renders (a parent can share an empty schedule too).
// Token-only colors, 44px tap targets, descriptive aria-labels.

import { useState } from 'react';
import { Calendar, Download } from 'lucide-react';
import { downloadTeamIcs } from '../../lib/icalHelpers';
import SubscribeSheet from '../shared/SubscribeSheet';
import ShareScheduleButton from '../shared/ShareScheduleButton';

const ctaBtnStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  width: '100%', minHeight: 44, marginTop: 16, borderRadius: 10,
  border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)',
  color: 'var(--as-accent)', fontSize: 15, fontWeight: 500,
};

export default function PublicScheduleActions({ team, teamId, events }) {
  const [showSubscribe, setShowSubscribe] = useState(false);
  const hasEvents = events.length > 0;
  return (
    <>
      {hasEvents && (
        <button type="button" onClick={() => downloadTeamIcs(team.name, events)} className="as-press"
          aria-label="Download the full schedule as a calendar file" style={ctaBtnStyle}>
          <Download size={16} strokeWidth={1.75} />
          Download Schedule (.ics)
        </button>
      )}
      {hasEvents && (
        <button type="button" onClick={() => setShowSubscribe(true)} className="as-press"
          aria-label="Subscribe to this schedule in your calendar app" style={{ ...ctaBtnStyle, marginTop: 8 }}>
          <Calendar size={16} strokeWidth={1.75} />
          Subscribe to Calendar
        </button>
      )}
      <ShareScheduleButton teamId={teamId} label="Share / QR" style={{ ...ctaBtnStyle, marginTop: 8 }} />
      <SubscribeSheet open={showSubscribe} onClose={() => setShowSubscribe(false)} team={team} />
    </>
  );
}
