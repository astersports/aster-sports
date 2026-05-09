import { describe, expect, it } from 'vitest';
import render from '../weeklySchedule';
import fixture from '../../__fixtures__/weeklySchedule';

describe('renderer #6 — weeklySchedule', () => {
  it('returns { html, plainText }', () => {
    const out = render(fixture);
    expect(out).toEqual(expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
  });
  it('renders each day header in cobalt eyebrow style', () => {
    const { html } = render(fixture);
    expect(html).toContain('MON · MAY 18');
    expect(html).toContain('SAT · MAY 23');
    expect(html).toContain('color:#4a8fd4');
  });
  it('standard event uses team color left border', () => {
    const { html } = render(fixture);
    expect(html).toContain('border-left:5px solid #7C3AED');
    expect(html).toContain('border-left:5px solid #18181B');
    expect(html).toContain('border-left:5px solid #2563EB');
  });
  it('tournament_placeholder uses cream bg + gold border + amber suffix', () => {
    const { html } = render(fixture);
    expect(html).toContain('background-color:#fffbeb');
    expect(html).toContain('border:1px solid #fbbf24');
    expect(html).toContain('color:#92400e'); // amber-bold suffix
    expect(html).toContain('see Thursday email');
  });
  it('plainText groups events under day headers', () => {
    const { plainText } = render(fixture);
    expect(plainText).toContain('MON · MAY 18');
    expect(plainText).toContain('11U Girls · Practice');
    expect(plainText).toContain('SAT · MAY 23');
  });
  it('matches snapshot', () => {
    expect(render(fixture)).toMatchSnapshot();
  });
});
