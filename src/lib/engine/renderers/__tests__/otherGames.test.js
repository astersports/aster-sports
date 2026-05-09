import { describe, expect, it } from 'vitest';
import render from '../otherGames';
import fixture from '../../__fixtures__/otherGames';

describe('template T4 — otherGames', () => {
  it('returns { html, plainText }', () => {
    const out = render(fixture);
    expect(out).toEqual(expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
  });
  it('cobalt eyebrow + each game line', () => {
    const { html } = render(fixture);
    expect(html).toContain('OTHER GAMES TO WATCH');
    expect(html).toContain('color:#4a8fd4');
    expect(html).toContain('Wave (Eli)');
    expect(html).toContain('Atlantic Sharks');
    expect(html).toContain('Court 1');
  });
  it('plainText uses bullets', () => {
    const { plainText } = render(fixture);
    expect(plainText).toContain('Other games to watch:');
    expect(plainText).toContain('• 10:00 AM');
    expect(plainText).toContain('Wave (Eli) vs Atlantic Sharks');
  });
  it('matches snapshot', () => {
    expect(render(fixture)).toMatchSnapshot();
  });
});
