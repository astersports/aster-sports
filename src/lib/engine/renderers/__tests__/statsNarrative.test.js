import { describe, expect, it } from 'vitest';
import render from '../statsNarrative';
import fixture from '../../__fixtures__/statsNarrative';

describe('free-text F1 — statsNarrative', () => {
  it('returns { html, plainText }', () => {
    const out = render(fixture);
    expect(out).toEqual(expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
  });
  it('wraps body in a navy <p>', () => {
    const { html } = render(fixture);
    expect(html).toMatch(/^<p\s/);
    expect(html).toContain('color:#0f172a');
    expect(html).toContain('We averaged 29 points');
  });
  it('plainText is the raw body', () => {
    const { plainText } = render(fixture);
    expect(plainText).toBe(fixture.body);
  });
  it('matches snapshot', () => {
    expect(render(fixture)).toMatchSnapshot();
  });
});
