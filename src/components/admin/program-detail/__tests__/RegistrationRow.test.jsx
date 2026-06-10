// @vitest-environment jsdom
//
// A1 / AP#46 invariant — RegistrationRow keeps the LIFECYCLE badge separate from
// the fee/payment line. "Mark confirmed" shows only on pending rows and calls
// onConfirm(id) — it writes status only, never payment (the lifecycle-vs-paid
// separation D6 mandates). Confirmed rows show "Confirmed by admin", no action.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import RegistrationRow from '../RegistrationRow';

afterEach(cleanup);
const reg = (status) => ({ id: 'r1', status, players: { first_name: 'Charlie', last_name: 'S' }, registration_fees: [{ amount_cents: 4500 }] });

describe('RegistrationRow (A1 lifecycle/payment separation)', () => {
  it('pending: shows the lifecycle badge + the fee + a Mark confirmed action', () => {
    render(<RegistrationRow registration={reg('pending')} onConfirm={vi.fn()} />);
    expect(screen.getByText('Pending')).toBeTruthy();
    expect(screen.getByText('$45.00 fee')).toBeTruthy(); // fee labelled as a fee, never "paid"
    expect(screen.getByRole('button', { name: /mark charlie s confirmed/i })).toBeTruthy();
  });

  it('Mark confirmed calls onConfirm(id) — lifecycle write only', async () => {
    const onConfirm = vi.fn().mockResolvedValue({ ok: true });
    render(<RegistrationRow registration={reg('pending')} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /mark charlie s confirmed/i }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('r1'));
  });

  it('confirmed: shows "Confirmed by admin" and NO action (never reads as paid)', () => {
    render(<RegistrationRow registration={reg('confirmed')} onConfirm={vi.fn()} />);
    expect(screen.getByText('Confirmed')).toBeTruthy();
    expect(screen.getByText(/confirmed by admin/i)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText(/paid/i)).toBeNull();
  });
});
