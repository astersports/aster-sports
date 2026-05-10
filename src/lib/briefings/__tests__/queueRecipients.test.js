import { describe, expect, it } from 'vitest';
import { __test } from '../queueRecipients';

const { buildFamilyRows, buildAdminRow, ADMIN_BCC_EMAIL } = __test;

const composed = { html: '<p>body</p>', plainText: 'body', subject: 'Subj' };
const audience = [
  { guardian_id: 'g1', email: 'a@x', team_ids: ['t-10blue'] },
  { guardian_id: 'g2', email: 'b@x', team_ids: ['t-10blue'] },
];

describe('buildFamilyRows', () => {
  it('builds one queued row per audience family with rendered body + teams', () => {
    const rows = buildFamilyRows({ messageId: 'm1', audience, composed, teamIds: ['t-10blue'], testOnly: false });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      message_id: 'm1', guardian_id: 'g1', email_at_send: 'a@x',
      delivery_method: 'resend_api', delivery_status: 'queued',
      body_html_rendered: '<p>body</p>', body_plain_rendered: 'body',
      subject_rendered: 'Subj', teams_included: ['t-10blue'],
    });
  });
  it('testOnly skips family rows entirely', () => {
    const rows = buildFamilyRows({ messageId: 'm1', audience, composed, teamIds: ['t-10blue'], testOnly: true });
    expect(rows).toEqual([]);
  });
  it('null teamIds defaults teams_included to []', () => {
    const rows = buildFamilyRows({ messageId: 'm1', audience: [audience[0]], composed, teamIds: null, testOnly: false });
    expect(rows[0].teams_included).toEqual([]);
  });
  it('empty audience returns empty rows even when not testOnly', () => {
    expect(buildFamilyRows({ messageId: 'm1', audience: [], composed, teamIds: ['t-x'], testOnly: false })).toEqual([]);
  });
});

describe('buildAdminRow', () => {
  it('emits an admin BCC row when admin email is not already in family rows', () => {
    const familyRows = [{ email_at_send: 'a@x' }, { email_at_send: 'b@x' }];
    const row = buildAdminRow({ messageId: 'm1', composed, familyRows });
    expect(row).toMatchObject({
      message_id: 'm1', guardian_id: null, email_at_send: ADMIN_BCC_EMAIL,
      delivery_status: 'queued', body_html_rendered: '<p>body</p>',
    });
    expect(row.teams_included).toEqual([]);
  });
  it('skips admin row when admin email is already a family recipient', () => {
    const familyRows = [{ email_at_send: ADMIN_BCC_EMAIL }];
    expect(buildAdminRow({ messageId: 'm1', composed, familyRows })).toBeNull();
  });
  it('admin row has guardian_id=null so the unsubscribe stamp falls back to public URL', () => {
    const row = buildAdminRow({ messageId: 'm1', composed, familyRows: [] });
    expect(row.guardian_id).toBeNull();
  });
});
