import { describe, it, expect, vi, afterEach } from 'vitest';
import * as rtl from '@testing-library/react';
import '@testing-library/jest-dom';

import { TestAuthClient, flushPromises } from '../test-utils';

const testState = vi.hoisted(() => ({
  client: null as InstanceType<typeof TestAuthClient> | null,
}));

vi.mock('../../src/auth', async () => {
  const { createAuth } = await import('@forward-software/react-auth');
  const { TestAuthClient: Cls } = await import('../test-utils');
  testState.client = new Cls();
  return createAuth(testState.client);
});

import { EventLog } from '../../src/components/EventLog';
import { AuthProvider } from '../../src/auth';

afterEach(rtl.cleanup);

describe('EventLog', () => {
  it('should render event log container', async () => {
    // Arrange & Act
    rtl.render(
      <AuthProvider>
        <EventLog />
      </AuthProvider>,
    );
    await rtl.act(() => flushPromises());

    // Assert
    expect(rtl.screen.getByTestId('event-log')).toBeInTheDocument();
    expect(rtl.screen.getByTestId('event-list')).toBeInTheDocument();
  });

  it('should display events when auth events fire', async () => {
    // Arrange & Act — AuthProvider calls init(), which emits initSuccess
    rtl.render(
      <AuthProvider>
        <EventLog />
      </AuthProvider>,
    );
    await rtl.act(() => flushPromises());

    // Assert — initSuccess should appear from the provider's init call
    const eventItems = rtl.screen.getAllByTestId('event-item');
    expect(eventItems.length).toBeGreaterThanOrEqual(1);

    const eventNames = eventItems.map((el) => el.textContent);
    expect(eventNames.some((text) => text?.includes('initSuccess'))).toBe(true);
  });

  it('should clear events when clear button is clicked', async () => {
    // Arrange — render and wait for init events
    rtl.render(
      <AuthProvider>
        <EventLog />
      </AuthProvider>,
    );
    await rtl.act(() => flushPromises());

    // Verify events exist first
    expect(rtl.screen.getAllByTestId('event-item').length).toBeGreaterThanOrEqual(1);

    // Act — click the clear button
    await rtl.act(async () => {
      rtl.fireEvent.click(rtl.screen.getByTestId('clear-events-button'));
    });

    // Assert — no event items remain
    expect(rtl.screen.queryAllByTestId('event-item')).toHaveLength(0);
    expect(rtl.screen.getByText('No events yet')).toBeInTheDocument();
  });
});
