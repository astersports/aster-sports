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
  it('splits a multi-paragraph body into separate <p> blocks (no run-on blob)', () => {
    const { html, plainText } = render({ kind: 'stats_narrative', body: 'Para one.\n\nPara two.\n\nPara three.' });
    expect(html.match(/<p\s/g)).toHaveLength(3);
    expect(html).toContain('Para one.');
    expect(html).toContain('Para three.');
    expect(plainText).toBe('Para one.\n\nPara two.\n\nPara three.');
  });
  it('single-paragraph body stays exactly one <p> (backward compatible)', () => {
    const { html } = render({ kind: 'stats_narrative', body: 'Just one paragraph here.' });
    expect(html.match(/<p\s/g)).toHaveLength(1);
  });
});
