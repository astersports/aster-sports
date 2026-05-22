// Cutover PR 7b-2.5 — digestFeedback unit tests.
// Mirror of feedbackSubstitutor.test.js shape, adapted for the
// digestSend family shape ({ family: slice, subject, html, plainText, sections }).

import { describe, expect, it, vi } from 'vitest';
import { substituteFeedbackForFamily } from '../digestFeedback';

function mockSupabase(mintImpl) {
  return {
    rpc: vi.fn(async (name, args) => {
      if (name !== 'mint_feedback_token') throw new Error(`unexpected rpc: ${name}`);
      const data = await mintImpl(args);
      return { data, error: null };
    }),
  };
}

const surveySection = {
  kind: 'feedback_survey',
  feedback_token_placeholders: {
    1: '{{feedback_1_url}}', 2: '{{feedback_2_url}}', 3: '{{feedback_3_url}}',
    4: '{{feedback_4_url}}', 5: '{{feedback_5_url}}',
  },
};

const baseFamily = {
  family: { kind: 'family', guardian_id: 'g-1', email: 'parent@x.test', team_ids: ['t-1'] },
  subject: 'Week ahead',
  html: 'old-html',
  plainText: 'old-plain',
  sections: [{ kind: 'header', headline: 'A' }, surveySection, { kind: 'footer', orgName: 'LH' }],
  teams_included: ['t-1'],
};

describe('substituteFeedbackForFamily', () => {
  it('1. mints 5 tokens (one per rating)', async () => {
    const supabase = mockSupabase(async (args) => `tok-${args.p_rating}`);
    await substituteFeedbackForFamily(supabase, 'm-1', baseFamily);
    expect(supabase.rpc).toHaveBeenCalledTimes(5);
    for (let r = 1; r <= 5; r += 1) {
      expect(supabase.rpc).toHaveBeenCalledWith('mint_feedback_token', {
        p_message_id: 'm-1', p_recipient_email: 'parent@x.test', p_rating: r,
      });
    }
  });

  it('2. substitutes feedback_token_urls into the section', async () => {
    const supabase = mockSupabase(async (args) => `tok-${args.p_rating}`);
    const out = await substituteFeedbackForFamily(supabase, 'm-1', baseFamily);
    const sectionOut = out.sections.find((s) => s.kind === 'feedback_survey');
    expect(sectionOut.feedback_token_urls).toBeDefined();
    expect(sectionOut.feedback_token_placeholders).toBeUndefined();
    for (let r = 1; r <= 5; r += 1) {
      expect(sectionOut.feedback_token_urls[r]).toContain(`t=tok-${r}&r=${r}`);
    }
  });

  it('3. re-renders html + plainText with substituted URLs', async () => {
    const supabase = mockSupabase(async (args) => `tok-${args.p_rating}`);
    const out = await substituteFeedbackForFamily(supabase, 'm-1', baseFamily);
    expect(out.html).not.toBe('old-html');
    expect(out.plainText).not.toBe('old-plain');
    expect(out.html).toContain('t=tok-1&amp;r=1');
    expect(out.html).not.toContain('{{feedback_1_url}}');
    expect(out.plainText).toContain('t=tok-1&r=1');
  });

  it('4. preserves transport metadata (family, subject, teams_included)', async () => {
    const supabase = mockSupabase(async (args) => `tok-${args.p_rating}`);
    const out = await substituteFeedbackForFamily(supabase, 'm-1', baseFamily);
    expect(out.family).toEqual(baseFamily.family);
    expect(out.subject).toBe('Week ahead');
    expect(out.teams_included).toEqual(['t-1']);
  });

  it('5. throws on missing family.email', async () => {
    const supabase = mockSupabase(async () => 'tok');
    const bad = { ...baseFamily, family: { ...baseFamily.family, email: undefined } };
    await expect(substituteFeedbackForFamily(supabase, 'm-1', bad)).rejects.toThrow(/missing family\.email/);
  });

  it('6. throws on missing sections', async () => {
    const supabase = mockSupabase(async () => 'tok');
    const bad = { ...baseFamily, sections: undefined };
    await expect(substituteFeedbackForFamily(supabase, 'm-1', bad)).rejects.toThrow(/missing sections/);
  });

  it('7. propagates mint_feedback_token RPC error', async () => {
    const supabase = {
      rpc: vi.fn(async () => ({ data: null, error: { message: 'rls denied' } })),
    };
    await expect(substituteFeedbackForFamily(supabase, 'm-1', baseFamily)).rejects.toThrow(/mint_feedback_token failed.*rls denied/);
  });
});
