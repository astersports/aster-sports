// @vitest-environment jsdom
//
// B2 confirmation bridge (magic-link). Locks the claim contract:
//   - "Send sign-in link" calls supabase.auth.signInWithOtp with the captured
//     email + emailRedirectTo = <APP_BASE_URL>/family (the My Family landing).
//   - success flips to the aria-live "Check your email" state.
//   - an OTP error surfaces a role=alert message (kindness microcopy), not a throw.
//   - "Maybe later" dismisses; no email / no render when email is absent.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import RegisterClaimAccount from '../RegisterClaimAccount';

const signInWithOtp = vi.fn();
vi.mock('../../../lib/supabase', () => ({ supabase: { auth: { signInWithOtp: (...a) => signInWithOtp(...a) } } }));
vi.mock('../../../lib/constants', () => ({ APP_BASE_URL: 'https://astersports.app' }));

afterEach(cleanup);
beforeEach(() => signInWithOtp.mockReset());

describe('RegisterClaimAccount (B2 magic-link bridge)', () => {
  it('renders nothing when no email', () => {
    const { container } = render(<RegisterClaimAccount email="" />);
    expect(container.firstChild).toBeNull();
  });

  it('sends an OTP to the captured email with the /family redirect, then shows the sent state', async () => {
    signInWithOtp.mockResolvedValue({ error: null });
    render(<RegisterClaimAccount email="fsamaritano@gmail.com" />);
    fireEvent.click(screen.getByRole('button', { name: /send a sign-in link/i }));
    await waitFor(() => expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'fsamaritano@gmail.com',
      options: { emailRedirectTo: 'https://astersports.app/family' },
    }));
    const status = await screen.findByRole('status');
    expect(status.textContent).toMatch(/check your email/i);
    expect(status.textContent).toContain('fsamaritano@gmail.com');
  });

  it('surfaces a role=alert on OTP failure (no throw)', async () => {
    signInWithOtp.mockResolvedValue({ error: { message: 'rate limited' } });
    render(<RegisterClaimAccount email="x@y.com" />);
    fireEvent.click(screen.getByRole('button', { name: /send a sign-in link/i }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/couldn’t send the link/i);
  });

  it('"Maybe later" dismisses the card', () => {
    const { container } = render(<RegisterClaimAccount email="x@y.com" />);
    fireEvent.click(screen.getByRole('button', { name: /maybe later/i }));
    expect(container.firstChild).toBeNull();
  });
});
