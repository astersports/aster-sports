// F-PARENT-MOAT-LEAK (#825) — AP#43 cross-surface invariant.
// An archived briefing must NEVER reach a parent. Two parent surfaces read
// briefings: the inbox (useInboxList) and "Needs you" (useParentNeedsYou, which
// derives its comms item from useInboxList). The admin Radar (useRadarFeed) is
// the reference contrast — it already excludes archived. This static lock (same
// shape as timezoneAuditPin / pilotFailCloseParity) asserts all three gate
// archived out, and that "Needs you" has no independent (ungated) briefing
// query that could reintroduce it. Defense-in-depth WITH the RLS backstop
// (message_is_not_archived) — this guards the application layer.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

const inbox = readFileSync('src/hooks/useInboxList.js', 'utf8');
const needsYou = readFileSync('src/hooks/useParentNeedsYou.js', 'utf8');
const radar = readFileSync('src/hooks/useRadarFeed.js', 'utf8');

describe('F-PARENT-MOAT-LEAK: archived briefings never reach a parent (AP#43)', () => {
  it('parent inbox inner-joins comms_messages and gates status to sent/queued', () => {
    expect(inbox).toMatch(/comms_messages!inner/);
    expect(inbox).toMatch(/\.in\(\s*['"]comms_messages\.status['"]\s*,\s*\[[^\]]*['"]sent['"]/);
  });

  it('parent inbox status set does NOT include archived (the leak literal)', () => {
    const m = inbox.match(/\.in\(\s*['"]comms_messages\.status['"]\s*,\s*(\[[^\]]*\])/);
    expect(m, 'useInboxList must filter comms_messages.status').toBeTruthy();
    expect(m[1]).not.toMatch(/archived/);
  });

  it('parent "Needs you" derives from the gated inbox — no independent briefing query', () => {
    expect(needsYou).toMatch(/useInboxList/);
    expect(needsYou).not.toMatch(/from\(\s*['"]comms_message_recipients['"]/);
    expect(needsYou).not.toMatch(/from\(\s*['"]comms_messages['"]/);
  });

  it('admin Radar (contrast) also excludes archived from its status set', () => {
    const m = radar.match(/\.in\(\s*['"]status['"]\s*,\s*(\[[^\]]*\])/);
    expect(m, 'useRadarFeed must filter status').toBeTruthy();
    expect(m[1]).not.toMatch(/archived/);
  });
});
