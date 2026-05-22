// Cutover PR 7b-1 — substituteFeedbackTokens unit tests.

import { describe, expect, it } from 'vitest';
import { substituteFeedbackTokens } from '../feedbackTokens';

const placeholders = {
  1: '{{feedback_1_url}}', 2: '{{feedback_2_url}}', 3: '{{feedback_3_url}}',
  4: '{{feedback_4_url}}', 5: '{{feedback_5_url}}',
};

const surveySection = (email) => ({
  kind: 'feedback_survey',
  recipient_email: email,
  feedback_token_placeholders: placeholders,
});

const tokensFor = (email) => ({
  1: `https://x.test/?e=${email}&r=1`,
  2: `https://x.test/?e=${email}&r=2`,
  3: `https://x.test/?e=${email}&r=3`,
  4: `https://x.test/?e=${email}&r=4`,
  5: `https://x.test/?e=${email}&r=5`,
});

describe('substituteFeedbackTokens', () => {
  it('1. pure: input array unchanged; returns a new array', () => {
    const input = [surveySection('a@x.test')];
    const inputClone = JSON.parse(JSON.stringify(input));
    const out = substituteFeedbackTokens(input, { 'a@x.test': tokensFor('a@x.test') });
    expect(input).toEqual(inputClone);
    expect(out).not.toBe(input);
  });

  it('2. replaces placeholders with urls in feedback_survey section', () => {
    const out = substituteFeedbackTokens(
      [surveySection('a@x.test')],
      { 'a@x.test': tokensFor('a@x.test') }
    );
    expect(out[0].feedback_token_urls).toEqual(tokensFor('a@x.test'));
    expect(out[0].feedback_token_placeholders).toBeUndefined();
  });

  it('3. other sections passed through unchanged', () => {
    const header = { kind: 'header', headline: 'X' };
    const footer = { kind: 'footer', orgName: 'Y' };
    const sections = [header, surveySection('a@x.test'), footer];
    const out = substituteFeedbackTokens(sections, { 'a@x.test': tokensFor('a@x.test') });
    expect(out[0]).toBe(header);
    expect(out[2]).toBe(footer);
  });

  it('4. throws on bad input shapes', () => {
    expect(() => substituteFeedbackTokens('not array', { 'a@x.test': tokensFor('a@x.test') }))
      .toThrow(TypeError);
    expect(() => substituteFeedbackTokens([], null)).toThrow(TypeError);
  });

  it('5. throws on missing recipient_email key in tokenMap', () => {
    expect(() => substituteFeedbackTokens(
      [surveySection('missing@x.test')],
      { 'other@x.test': tokensFor('other@x.test') }
    )).toThrow(/no token entry for recipient_email missing@x.test/);
  });

  it('6. throws on missing recipient_email on section itself', () => {
    const section = { kind: 'feedback_survey', feedback_token_placeholders: placeholders };
    expect(() => substituteFeedbackTokens([section], { 'a@x.test': tokensFor('a@x.test') }))
      .toThrow(/missing recipient_email/);
  });

  it('7. throws on non-string URL value for any rating', () => {
    const broken = { ...tokensFor('a@x.test'), 3: null };
    expect(() => substituteFeedbackTokens([surveySection('a@x.test')], { 'a@x.test': broken }))
      .toThrow(/tokens\.3.*must be a string/);
  });

  it('8. passes through feedback_survey sections that have no placeholders (already substituted)', () => {
    const already = { kind: 'feedback_survey', recipient_email: 'a@x.test', feedback_token_urls: tokensFor('a@x.test') };
    const out = substituteFeedbackTokens([already], {});
    expect(out[0]).toBe(already);
  });
});
