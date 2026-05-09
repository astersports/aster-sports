import { describe, expect, it } from 'vitest';
import render from '../labeledKeys';
import fixture from '../../__fixtures__/labeledKeys';

describe('renderer #7 — labeledKeys', () => {
  it('returns { html, plainText }', () => {
    const out = render(fixture);
    expect(out).toEqual(expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
  });
  it('renders title eyebrow + each labeled item', () => {
    const { html } = render(fixture);
    // Title gets HTML-escaped; assert on the escaped form.
    expect(html).toContain('COACH&#39;S KEYS TO THE GAME');
    expect(html).toContain('Press hard early.');
    expect(html).toContain('Move without the ball.');
    expect(html).toContain('Box out every possession.');
  });
  it('omits title when not provided', () => {
    const { html } = render({ kind: 'labeled_keys', items: [{ label: 'X', body: 'Y' }] });
    expect(html).not.toContain('letter-spacing:1.5px;text-transform:uppercase;line-height:1.4;margin-bottom:12px');
    expect(html).toContain('X.');
  });
  it('plainText echoes label + body', () => {
    const { plainText } = render(fixture);
    expect(plainText).toContain("COACH'S KEYS TO THE GAME");
    expect(plainText).toContain('Press hard early.');
  });
  it('matches snapshot', () => {
    expect(render(fixture)).toMatchSnapshot();
  });
});
