// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShareScheduleButton from '../ShareScheduleButton';

afterEach(cleanup);

describe('ShareScheduleButton', () => {
  it('renders nothing without a teamId', () => {
    const { container } = render(<ShareScheduleButton teamId={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('opens a sheet with a QR + the public URL, and copies the link', async () => {
    const user = userEvent.setup();
    // Define AFTER setup() — userEvent installs its own clipboard stub.
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<ShareScheduleButton teamId="team-42" />);
    await user.click(screen.getByRole('button', { name: /share public schedule/i }));

    const dialog = screen.getByRole('dialog');
    // QR renders as an <svg>
    expect(dialog.querySelector('svg')).toBeTruthy();
    // public URL is shown for manual copy
    const expectedUrl = `${window.location.origin}/schedule/team-42`;
    expect(within(dialog).getByText(expectedUrl)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /copy link/i }));
    expect(writeText).toHaveBeenCalledWith(expectedUrl);
    expect(await within(dialog).findByText(/copied/i)).toBeInTheDocument();
  });
});
