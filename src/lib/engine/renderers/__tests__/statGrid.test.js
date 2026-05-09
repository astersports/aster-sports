import { describe, expect, it } from 'vitest';
import render from '../statGrid';
import fixture from '../../__fixtures__/statGrid';

describe('renderer #2 — statGrid', () => {
  it('returns { html, plainText }', () => {
    const out = render(fixture);
    expect(out).toEqual(expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
  });
  it('html contains 4 cells + tone colors', () => {
    const { html } = render(fixture);
    expect(html).toContain('<table');
    expect(html).toContain('Record');
    expect(html).toContain('Pts/Game');
    expect(html).toContain('#16a34a'); // positive tone
    expect(html).toContain('#4a8fd4'); // neutral default
  });
  it('plainText joins cells with middot separator', () => {
    const { plainText } = render(fixture);
    expect(plainText).toBe('Record 1-1 · Pts/Game 29.0 · Diff +2.5 · Games 4');
  });
  it('matches snapshot', () => {
    expect(render(fixture)).toMatchSnapshot();
  });
});
