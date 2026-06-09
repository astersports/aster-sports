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

  // COMPOSE-FRONT P1 send-gate hole: a null/unknown audience count must block
  // a real send (not read as "0 is fine") and show honest copy.
  it('f. blocks send when audience.filtered is null (unknown audience)', () => {
    setup({ audience: { filtered: null, mode: 'standard' } });
    expect(screen.getByTestId('send-button')).toBeDisabled();
    expect(screen.getByTestId('audience-unknown-note').textContent).toMatch(/Couldn't confirm recipients/);
  });

  it('g. unknown-audience note reads "Confirming…" while resolving', () => {
    setup({ audience: { filtered: null, mode: 'standard' }, audienceResolving: true });
    expect(screen.getByTestId('send-button')).toBeDisabled();
    expect(screen.getByTestId('audience-unknown-note').textContent).toMatch(/Confirming who will receive/);
  });

  it('h. null audience does NOT block a test_only send (admin BCC always reachable)', () => {
    setup({ state: { ...BASE_STATE, test_only: true }, audience: { filtered: null, mode: 'standard' } });
    expect(screen.getByTestId('send-button')).not.toBeDisabled();
    expect(screen.queryByTestId('audience-unknown-note')).not.toBeInTheDocument();
  });

  it('i. resolved count (non-null) enables send', () => {
    setup({ audience: { filtered: 12, total: 12, mode: 'standard' } });
    expect(screen.getByTestId('send-button')).not.toBeDisabled();
  });

  // FORK D (2026-06-09): coach_roundup / family_guide hard-gate an empty picker
  // with a kind-specific note, mirroring games_recap — not the generic
  // "Couldn't confirm recipients" note (which would also fire since the count is
  // null when unpicked).
  it('k. coach_roundup with no coach picked: Send disabled + "Pick a coach" note', () => {
    setup({ state: { ...BASE_STATE, kind: 'coach_roundup', audience_type: 'coach_self', audience_filter: {} }, audience: { filtered: null, mode: 'standard' } });
    expect(screen.getByTestId('send-button')).toBeDisabled();
    expect(screen.getByTestId('anchor-pick-empty-note').textContent).toMatch(/Pick a coach above/);
    // the generic unknown-audience note is suppressed in favor of the specific one
    expect(screen.queryByTestId('audience-unknown-note')).not.toBeInTheDocument();
  });

  it('l. family_guide with no parent picked: Send disabled + "Pick a parent" note', () => {
    setup({ state: { ...BASE_STATE, kind: 'family_guide', audience_type: 'family_specific', audience_filter: {} }, audience: { filtered: null, mode: 'standard' } });
    expect(screen.getByTestId('send-button')).toBeDisabled();
    expect(screen.getByTestId('anchor-pick-empty-note').textContent).toMatch(/Pick a parent above/);
  });

  it('m. coach_roundup with a coach picked: gate clears, Send enabled', () => {
    setup({ state: { ...BASE_STATE, kind: 'coach_roundup', audience_type: 'coach_self', audience_filter: { coach_user_id: 'u-1' } }, audience: { filtered: 1, total: 1, mode: 'standard' } });
    expect(screen.getByTestId('send-button')).not.toBeDisabled();
    expect(screen.queryByTestId('anchor-pick-empty-note')).not.toBeInTheDocument();
  });

  // A3: test_only toggle relocated from the body to the send action. It renders
  // in the send section, reflects state.test_only, and flips it via dispatch.
  it('j. test-only toggle renders here and flips test_only via dispatch', async () => {
    const dispatch = vi.fn();
    const user = userEvent.setup();
    render(<StepSendConfirm state={BASE_STATE} dispatch={dispatch} audience={AUDIENCE_OK} onSend={() => {}} sending={false} pilotModeEnabled={false} />);
    const toggle = screen.getByTestId('test-only-toggle');
    expect(toggle).toBeInTheDocument();
    expect(toggle).not.toBeChecked(); // BASE_STATE test_only:false
    await user.click(toggle);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_TEST', value: true });
  });
});
