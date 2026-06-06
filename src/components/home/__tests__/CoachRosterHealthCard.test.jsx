// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import CoachRosterHealthCard from '../CoachRosterHealthCard';

afterEach(cleanup);

describe('CoachRosterHealthCard', () => {
  it('shows the check-in nudge when there is no attendance data yet', () => {
    const { container } = render(<CoachRosterHealthCard hasData={false} checkInCount={0} loading={false} onStartCheckIn={() => {}} />);
    expect(container.textContent).toMatch(/No attendance logged yet/);
    expect(container.textContent).toMatch(/Start Check-In/);
  });

  it('shows the logged count once check-ins exist', () => {
    const { container } = render(<CoachRosterHealthCard hasData checkInCount={5} loading={false} onStartCheckIn={() => {}} />);
    expect(container.textContent).toMatch(/5 check-ins logged/);
    expect(container.textContent).not.toMatch(/No attendance/);
  });

  it('renders nothing while loading', () => {
    const { container } = render(<CoachRosterHealthCard hasData={false} checkInCount={0} loading onStartCheckIn={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
