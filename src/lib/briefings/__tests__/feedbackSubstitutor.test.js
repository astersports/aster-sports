// Cutover PR 7b-2 — feedbackSubstitutor factory unit tests.
//
// Pure tests with a stubbed Supabase client. Verifies:
//   • mint_feedback_token called 5x per row (one per rating)
//   • token URLs wrapped with handler base + r param
//   • feedback_survey section stamped with recipient_email + substituted
//   • body_html_rendered + body_plain_rendered re-rendered post-substitute
//   • non-feedback rows passed through unchanged (defensive)
//   • throws when required fields missing

import { describe, expect, it, vi } from 'vitest';
import { createFeedbackSubstitutor } from '../feedbackSubstitutor';

const HANDLER_BASE = 'https://x.test/functions/v1/feedback-token-handler';

function mockSupabase(mintImpl) {
  return {
    rpc: vi.fn(async (name, args) => {
      if (name !== 'mint_feedback_token') throw new Error(`unexpected rpc: ${name}`);
      const data = await mintImpl(args);
      return { data, error: null };
    }),
  };
}

const baseRow = {
  message_id: 'm-1',
  guardian_id: 'g-1',
  email_at_send: 'parent@x.test',
  body_html_rendered: 'ignored-old-html',
  body_plain_rendered: 'ignored-old-plain',
  subject_rendered: 'Subj',
  teams_included: ['t-1'],
  delivery_method: 'resend_api',
  delivery_status: 'queued',
};

const surveySection = {
  kind: 'feedback_survey',
  feedback_token_placeholders: {
    1: '{{feedback_1_url}}', 2: '{{feedback_2_url}}', 3: '{{feedback_3_url}}',
    4: '{{feedback_4_url}}', 5: '{{feedback_5_url}}',
  },
};

describe('createFeedbackSubstitutor', () => {
  it('1. mints 5 tokens (one per rating) via mint_feedback_token RPC', async () => {
    const supabase = mockSupabase(async (args) => `tok-${args.p_rating}`);
    const substitutor = createFeedbackSubstitutor({ supabase, messageId: 'm-1', handlerBase: HANDLER_BASE });
    const row = { ...baseRow, __content_sections: [surveySection] };
    await substitutor(row);
    expect(supabase.rpc).toHaveBeenCalledTimes(5);
    for (let r = 1; r <= 5; r += 1) {
      expect(supabase.rpc).toHaveBeenCalledWith('mint_feedback_token', {
        p_message_id: 'm-1', p_recipient_email: 'parent@x.test', p_rating: r,
      });
    }
  });

  it('2. wraps tokens into handler URLs with rating param', async () => {
    const supabase = mockSupabase(async (args) => `tok-${args.p_rating}`);
    const substitutor = createFeedbackSubstitutor({ supabase, messageId: 'm-1', handlerBase: HANDLER_BASE });
    const row = { ...baseRow, __content_sections: [surveySection] };
    const out = await substitutor(row);
    const sectionOut = out.__content_sections.find((s) => s.kind === 'feedback_survey');
    for (let r = 1; r <= 5; r += 1) {
      expect(sectionOut.feedback_token_urls[r]).toBe(`${HANDLER_BASE}?t=tok-${r}&r=${r}`);
    }
  });

  it('3. body_html_rendered + body_plain_rendered re-rendered post-substitute', async () => {
    const supabase = mockSupabase(async (args) => `tok-${args.p_rating}`);
    const substitutor = createFeedbackSubstitutor({ supabase, messageId: 'm-1', handlerBase: HANDLER_BASE });
    const row = { ...baseRow, __content_sections: [surveySection] };
    const out = await substitutor(row);
    // The new body must contain the real URLs, not the placeholders
    expect(out.body_html_rendered).toContain(`${HANDLER_BASE}?t=tok-1&amp;r=1`);
    expect(out.body_html_rendered).not.toContain('{{feedback_1_url}}');
    expect(out.body_plain_rendered).toContain(`${HANDLER_BASE}?t=tok-1&r=1`);
    expect(out.body_plain_rendered).not.toContain('{{feedback_1_url}}');
    // Preserves transport metadata
    expect(out.email_at_send).toBe('parent@x.test');
    expect(out.guardian_id).toBe('g-1');
    expect(out.teams_included).toEqual(['t-1']);
  });

  it('4. preserves non-feedback sections (header, signoff, brand_footer) untouched', async () => {
    const supabase = mockSupabase(async (args) => `tok-${args.p_rating}`);
    const substitutor = createFeedbackSubstitutor({ supabase, messageId: 'm-1', handlerBase: HANDLER_BASE });
    const otherSections = [
      { kind: 'header', headline: 'A' },
      { kind: 'signoff', prose: 'Thanks' },
      surveySection,
      { kind: 'brand_footer', org_name: 'LH' },
    ];
    const row = { ...baseRow, __content_sections: otherSections };
    const out = await substitutor(row);
    expect(out.__content_sections[0]).toEqual({ kind: 'header', headline: 'A' });
    expect(out.__content_sections[1]).toEqual({ kind: 'signoff', prose: 'Thanks' });
    expect(out.__content_sections[3]).toEqual({ kind: 'brand_footer', org_name: 'LH' });
  });

  it('5. throws on missing email_at_send', async () => {
    const supabase = mockSupabase(async () => 'tok');
    const substitutor = createFeedbackSubstitutor({ supabase, messageId: 'm-1', handlerBase: HANDLER_BASE });
    const row = { ...baseRow, email_at_send: undefined, __content_sections: [surveySection] };
    await expect(substitutor(row)).rejects.toThrow(/missing email_at_send/);
  });

  it('6. throws on missing __content_sections', async () => {
    const supabase = mockSupabase(async () => 'tok');
    const substitutor = createFeedbackSubstitutor({ supabase, messageId: 'm-1', handlerBase: HANDLER_BASE });
    const row = { ...baseRow }; // no __content_sections
    await expect(substitutor(row)).rejects.toThrow(/missing __content_sections/);
  });

  it('7. factory throws on missing constructor args', () => {
    expect(() => createFeedbackSubstitutor({ supabase: null, messageId: 'm-1', handlerBase: 'x' })).toThrow(/missing supabase/);
    expect(() => createFeedbackSubstitutor({ supabase: {}, messageId: null, handlerBase: 'x' })).toThrow(/missing messageId/);
    expect(() => createFeedbackSubstitutor({ supabase: {}, messageId: 'm-1', handlerBase: '' })).toThrow(/missing handlerBase/);
  });

  it('8. propagates mint_feedback_token RPC error', async () => {
    const supabase = {
      rpc: vi.fn(async () => ({ data: null, error: { message: 'rls denied' } })),
    };
    const substitutor = createFeedbackSubstitutor({ supabase, messageId: 'm-1', handlerBase: HANDLER_BASE });
    const row = { ...baseRow, __content_sections: [surveySection] };
    await expect(substitutor(row)).rejects.toThrow(/mint_feedback_token failed.*rls denied/);
  });

  it('9. handles content_sections with no feedback_survey (no-op pass-through after mint)', async () => {
    const supabase = mockSupabase(async (args) => `tok-${args.p_rating}`);
    const substitutor = createFeedbackSubstitutor({ supabase, messageId: 'm-1', handlerBase: HANDLER_BASE });
    const row = { ...baseRow, __content_sections: [{ kind: 'header', headline: 'A' }] };
    const out = await substitutor(row);
    // Tokens still minted (eager — factory doesn't peek for feedback_survey)
    expect(supabase.rpc).toHaveBeenCalledTimes(5);
    // No feedback_survey section to substitute → body matches header-only render
    expect(out.__content_sections[0]).toEqual({ kind: 'header', headline: 'A' });
  });
});
