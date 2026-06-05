// @vitest-environment jsdom
//
// COMPOSE-FRONT P3 — AnnouncementBody now carries the TokenInsertMenu +
// TokenChipPreview (mirrors CustomMessageBody), since announcements are
// free-form and benefit from the same action-link tokens.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnnouncementBody from '../AnnouncementBody';

afterEach(cleanup);

describe('AnnouncementBody', () => {
  it('renders the Insert link token menu', () => {
    render(<AnnouncementBody value={{ headline: '', body_text: '' }} onChange={() => {}} />);
    expect(screen.getByLabelText('Insert action link')).toBeInTheDocument();
  });

  it('inserting a token appends a placeholder to body_text', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AnnouncementBody value={{ headline: 'Hi', body_text: 'Reply if you can' }} onChange={onChange} />);
    await user.click(screen.getByLabelText('Insert action link'));
    const items = screen.getAllByRole('menuitem');
    await user.click(items[0]);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ body_text: expect.stringMatching(/\{\{token:/) }));
  });
});
