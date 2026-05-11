// Wave 4.2-A-8b-a — queueComposedMessages helper unit tests.
// Pure-builder tests only (no DB / Supabase). Verifies:
//   - family slice -> 1 row keyed (guardian_id, email, team_id)
//   - team slice -> N rows, one per recipient_guardians[i]
//   - multi-team families -> deduped by guardian_id
//   - testOnly -> [] family rows
//   - admin BCC: appended when not in family rows; suppressed when present
//   - per-slice render produces wrapped HTML + plain text + subject

import { describe, expect, it } from 'vitest';
import { __test, buildFanoutRows } from '../queueComposedMessages';

const sectionsA = [{ kind: 'header', headline: 'A' }];
const familyMessage = (guardianId, email, teamId) => ({
  slice: { kind: 'family', guardian_id: guardianId, email, team_id: teamId },
  subject: `Subj ${guardianId}`,
  content_sections: sectionsA,
});
const teamMessage = (teamId, guardians) => ({
  slice: { kind: 'team', team_id: teamId, recipient_guardians: guardians },
  subject: `Team ${teamId}`,
  content_sections: sectionsA,
});

describe('queueComposedMessages — pure builders', () => {
  it('family slice -> 1 row keyed (guardian_id, email, teams_included)', () => {
    const rows = buildFanoutRows({ messageId: 'm-1', messages: [familyMessage('g1', 'g1@x', 't-1')], testOnly: false });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ message_id: 'm-1', guardian_id: 'g1', email_at_send: 'g1@x', teams_included: ['t-1'], delivery_status: 'queued' });
    expect(rows[0].body_html_rendered).toContain('max-width:600px');
    expect(rows[0].subject_rendered).toBe('Subj g1');
  });

  it('team slice -> N rows, one per recipient_guardians[i]', () => {
    const guardians = [{ guardian_id: 'g1', email: 'g1@x' }, { guardian_id: 'g2', email: 'g2@x' }, { guardian_id: 'g3', email: 'g3@x' }];
    const rows = buildFanoutRows({ messageId: 'm-1', messages: [teamMessage('t-1', guardians)], testOnly: false });
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.guardian_id)).toEqual(['g1', 'g2', 'g3']);
    expect(rows.every((r) => r.teams_included[0] === 't-1')).toBe(true);
    expect(rows.every((r) => r.subject_rendered === 'Team t-1')).toBe(true);
  });

  it('multi-team families on tournament fan-out -> deduped by guardian_id', () => {
    const messages = [
      teamMessage('t-1', [{ guardian_id: 'g1', email: 'g1@x' }, { guardian_id: 'g2', email: 'g2@x' }]),
      teamMessage('t-2', [{ guardian_id: 'g1', email: 'g1@x' }, { guardian_id: 'g3', email: 'g3@x' }]),
    ];
    const rows = buildFanoutRows({ messageId: 'm-1', messages, testOnly: false });
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.guardian_id)).toEqual(['g1', 'g2', 'g3']);
    expect(rows.find((r) => r.guardian_id === 'g1').teams_included).toEqual(['t-1']);
  });

  it('testOnly=true -> no family rows', () => {
    const rows = buildFanoutRows({ messageId: 'm-1', messages: [familyMessage('g1', 'g1@x', 't-1')], testOnly: true });
    expect(rows).toEqual([]);
  });

  it('renderBody wraps HTML + emits plainText + subject', () => {
    const out = __test.renderBody({ subject: 'Hi', content_sections: sectionsA });
    expect(out.subject).toBe('Hi');
    expect(out.body_html_rendered.startsWith('<div style="max-width:600px')).toBe(true);
    expect(out.body_html_rendered.endsWith('</div>')).toBe(true);
    expect(typeof out.body_plain_rendered).toBe('string');
  });

  it('admin BCC appended when not in family rows', () => {
    const sample = __test.renderBody({ subject: 'Hi', content_sections: sectionsA });
    const familyRows = [{ email_at_send: 'g1@x' }, { email_at_send: 'g2@x' }];
    const adminRow = __test.buildAdminRow({ messageId: 'm-1', sample, familyRows });
    expect(adminRow).not.toBeNull();
    expect(adminRow.email_at_send).toBe(__test.ADMIN_BCC_EMAIL);
    expect(adminRow.guardian_id).toBeNull();
    expect(adminRow.teams_included).toEqual([]);
  });

  it('admin BCC suppressed when admin already in family rows', () => {
    const sample = __test.renderBody({ subject: 'Hi', content_sections: sectionsA });
    const familyRows = [{ email_at_send: __test.ADMIN_BCC_EMAIL }];
    const adminRow = __test.buildAdminRow({ messageId: 'm-1', sample, familyRows });
    expect(adminRow).toBeNull();
  });

  it('expandSliceToRows throws on unknown slice.kind', () => {
    const rendered = __test.renderBody({ subject: 'X', content_sections: sectionsA });
    const message = { slice: { kind: 'mystery' }, subject: 'X', content_sections: sectionsA };
    expect(() => __test.expandSliceToRows('m-1', message, rendered)).toThrow(/unknown slice\.kind/);
  });

  it('Wave 4.3-K — synthetic rows (guardian_id=null) fan out by team, not collapse', () => {
    // Simulates the 5 per-team synthetic recipients from get_digest_recipients
    // when pilot_test_recipient_email is set. Pre-4.3-K the dedup key was
    // guardian_id alone — all 5 collapsed to 1 (null key collision). The
    // composite key (email + teams_included) keeps them distinct.
    const messages = ['t-1', 't-2', 't-3', 't-4', 't-5'].map((tid) => ({
      slice: { kind: 'family', guardian_id: null, email: 'admin@x', team_id: tid },
      subject: `Pilot Test · team ${tid}`,
      content_sections: sectionsA,
    }));
    const rows = buildFanoutRows({ messageId: 'm-1', messages, testOnly: false });
    expect(rows).toHaveLength(5);
    expect(rows.every((r) => r.guardian_id == null)).toBe(true);
    expect(rows.every((r) => r.email_at_send === 'admin@x')).toBe(true);
    expect(rows.map((r) => r.teams_included[0]).sort()).toEqual(['t-1', 't-2', 't-3', 't-4', 't-5']);
  });

  it('Wave 4.3-K — real-guardian dedup unchanged for guardians sharing an email', () => {
    // Sanity check that the composite key doesn't accidentally allow real
    // guardians to duplicate. Two team slices both list guardian g1; g1
    // should still appear only once in the output rows.
    const messages = [
      teamMessage('t-1', [{ guardian_id: 'g1', email: 'g1@x' }]),
      teamMessage('t-2', [{ guardian_id: 'g1', email: 'g1@x' }]),
    ];
    const rows = buildFanoutRows({ messageId: 'm-1', messages, testOnly: false });
    expect(rows).toHaveLength(1);
    expect(rows[0].guardian_id).toBe('g1');
  });
});
