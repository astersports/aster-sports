// Wave 4.1d-2 §2.6 (label drift) + §4.4 (test-send copy split) tests
// extracted from needsAttention.test.js to keep that file under the
// 150-line cap.

import { describe, expect, it } from 'vitest';
import { buildGameRecapRows, buildPrelimRows, buildTournRecapRows } from '../needsAttention';

describe('Wave 4.1d-2 §2.6 — label drift fixed', () => {
  it('buildPrelimRows uses "Tournament briefing · …" not "Tournament prelim · …"', () => {
    const rows = buildPrelimRows([{ id: 't1', name: 'ZG Rumble for the Ring CT', start_date: '2026-05-15' }], []);
    expect(rows[0].title).toBe('Tournament briefing · ZG Rumble for the Ring CT');
    expect(rows[0].title).not.toContain('Tournament prelim');
  });
});

describe('Wave 4.1d-2 §4.4 — test-send copy split (recipient_count > 1 ⇒ real send)', () => {
  it('buildPrelimRows test-sent anchors get "Test sent · families pending" copy', () => {
    const rows = buildPrelimRows(
      [{ id: 't1', name: 'A', start_date: '2026-05-15' }, { id: 't2', name: 'B', start_date: '2026-05-20' }],
      [], ['t2'],
    );
    const t1 = rows.find((r) => r.anchor_id === 't1');
    const t2 = rows.find((r) => r.anchor_id === 't2');
    expect(t1.audience_preview).toContain('not sent yet');
    expect(t2.audience_preview).toBe('Test sent · families pending');
  });

  it('buildTournRecapRows — same test-sent copy split', () => {
    const rows = buildTournRecapRows(
      [{ id: 't1', name: 'A', end_date: '2026-04-30' }, { id: 't2', name: 'B', end_date: '2026-04-25' }],
      [], ['t1'],
    );
    const t1 = rows.find((r) => r.anchor_id === 't1');
    const t2 = rows.find((r) => r.anchor_id === 't2');
    expect(t1.audience_preview).toBe('Test sent · families pending');
    expect(t2.audience_preview).toContain('not sent yet');
  });

  it('buildGameRecapRows — test-sent copy split', () => {
    const games = [
      { id: 'g1', title: 'A', start_at: '2026-05-08T18:00:00Z', teams: { name: 'X', org_id: 'org' } },
      { id: 'g2', title: 'B', start_at: '2026-05-09T18:00:00Z', teams: { name: 'X', org_id: 'org' } },
    ];
    const rows = buildGameRecapRows(games, [], 5, ['g1']);
    const g1 = rows.find((r) => r.anchor_id === 'g1');
    const g2 = rows.find((r) => r.anchor_id === 'g2');
    expect(g1.audience_preview).toBe('Test sent · families pending');
    expect(g2.audience_preview).toContain('Recap not sent yet');
  });
});
