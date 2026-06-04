// @vitest-environment jsdom
//
// Wave 4.4-B Session 5c — StepSendConfirm component test. Verifies the
// recipient-summary card renders correct labels + values, schedule
// branching (send-now vs scheduled), pilot banner conditional, and
// SEND button click + disabled-while-sending behavior.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StepSendConfirm from '../StepSendConfirm';

afterEach(cleanup);

const BASE_STATE = {
  kind: 'game_recap', anchor_kind: 'event', anchor_id: 'e-1',
  audience_type: 'event_attendees', audience_filter: null,
  body: {}, signoff_message: '', test_only: false,
  send_mode: 'now', scheduled_for: null,
};
const AUDIENCE_OK = { filtered: 22, total: 22, mode: 'standard', pilotModeOn: false };

function setup(overrides = {}) {
  const onSend = vi.fn();
  const utils = render(<StepSendConfirm state={BASE_STATE} audience={AUDIENCE_OK} onSend={onSend} sending={false} pilotModeEnabled={false} {...overrides} />);
  return { user: userEvent.setup(), onSend, ...utils };
}

describe('StepSendConfirm', () => {
  it('a. renders "Ready to send" header + kind + audience values', () => {
    setup();
    expect(screen.getByText(/Ready to send/)).toBeInTheDocument();
    expect(screen.getByTestId('row-kind').textContent).toBe('Game recap');
    expect(screen.getByTestId('row-audience').textContent).toBe('Event attendees');
  });

  it('b. renders "Send now" when scheduled_for is null', () => {
    setup();
    expect(screen.getByTestId('row-schedule').textContent).toBe('Send now');
  });

  it('c. renders "Scheduled for ..." when scheduled_for is set', () => {
    setup({ state: { ...BASE_STATE, send_mode: 'scheduled', scheduled_for: new Date(Date.now() + 6 * 3600000).toISOString() } });
    expect(screen.getByTestId('row-schedule').textContent).toMatch(/^Scheduled for/);
  });

  it('d. renders pilot banner when pilotModeEnabled=true; omits when false', () => {
    const { rerender } = setup({ pilotModeEnabled: true });
    expect(screen.getByTestId('pilot-banner')).toBeInTheDocument();
    rerender(<StepSendConfirm state={BASE_STATE} audience={AUDIENCE_OK} onSend={() => {}} sending={false} pilotModeEnabled={false} />);
    expect(screen.queryByTestId('pilot-banner')).not.toBeInTheDocument();
  });

  it('e. clicking SEND fires onSend; button disabled while sending', async () => {
    const { user, onSend } = setup();
    await user.click(screen.getByTestId('send-button'));
    expect(onSend).toHaveBeenCalledTimes(1);
    cleanup();
    // re-render with sending=true to assert disabled
    const onSend2 = vi.fn();
    render(<StepSendConfirm state={BASE_STATE} audience={AUDIENCE_OK} onSend={onSend2} sending={true} pilotModeEnabled={false} />);
    const btn = screen.getByTestId('send-button');
    expect(btn).toBeDisabled();
    expect(btn.textContent).toMatch(/Sending/);
  });
});
