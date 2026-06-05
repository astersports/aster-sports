import { describe, expect, it } from 'vitest';
import render from '../coachesBlock';

const SECTION = {
  kind: 'coaches_block',
  teams: [
    { team_name: '10U Black', coaches: [
      { display_name: 'Coach Kenny', title: 'Coaching Director', phone: '(516) 644-0208' },
      { display_name: 'Coach Darien', title: 'Assistant Coach', phone: '(914) 555-0190' },
    ] },
    { team_name: '9U Boys', coaches: [
      { display_name: 'Coach Kenny', title: 'Coaching Director', phone: '(516) 644-0208' },
    ] },
  ],
};

describe('renderer — coaches_block (Your coaches reference)', () => {
  it('returns { html, plainText }', () => {
    const out = render(SECTION);
    expect(out).toEqual(expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
  });

  it('renders a "Your coaches" heading + a team-name label per group', () => {
    const { html } = render(SECTION);
    expect(html).toContain('Your coaches');
    expect(html).toContain('10U Black');
    expect(html).toContain('9U Boys');
  });

  it('renders each coach name + title · phone (signoff row style)', () => {
    const { html } = render(SECTION);
    expect(html).toContain('Coach Kenny');
    expect(html).toContain('Coaching Director · (516) 644-0208');
    expect(html).toContain('Coach Darien');
    expect(html).toContain('Assistant Coach · (914) 555-0190');
  });

  it('is table-based and inline-styled — no <style> blocks (§13)', () => {
    const { html } = render(SECTION);
    expect(html).toMatch(/<table/);
    expect(html).not.toMatch(/<style/);
  });

  it('plainText lists each team + coach line', () => {
    const { plainText } = render(SECTION);
    expect(plainText).toContain('Your coaches');
    expect(plainText).toContain('10U Black');
    expect(plainText).toContain('Coach Kenny');
    expect(plainText).toContain('Coaching Director · (516) 644-0208');
  });

  it('renders empty for no teams (graceful omit)', () => {
    expect(render({ kind: 'coaches_block', teams: [] })).toEqual({ html: '', plainText: '' });
    expect(render({})).toEqual({ html: '', plainText: '' });
  });

  it('matches snapshot', () => {
    expect(render(SECTION)).toMatchSnapshot();
  });
});
