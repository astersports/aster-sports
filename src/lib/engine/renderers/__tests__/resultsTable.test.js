import { describe, expect, it } from 'vitest';
import render from '../resultsTable';
import fixture from '../../__fixtures__/resultsTable';

describe('renderer #5 — resultsTable', () => {
  it('returns { html, plainText }', () => {
    const out = render(fixture);
    expect(out).toEqual(expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
  });
  it('W rows use green, L rows use red', () => {
    const { html } = render(fixture);
    expect(html).toContain('color:#16a34a'); // W
    expect(html).toContain('color:#dc2626'); // L
  });
  it('renders score in NN-NN format', () => {
    const { html } = render(fixture);
    expect(html).toContain('28-32');
    expect(html).toContain('35-22');
  });
  it('plainText starts with header rule', () => {
    const { plainText } = render(fixture);
    expect(plainText).toMatch(/^Saturday Results\n─/);
    expect(plainText).toContain('(L)');
    expect(plainText).toContain('(W)');
  });
  it('matches snapshot', () => {
    expect(render(fixture)).toMatchSnapshot();
  });
});
