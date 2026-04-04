import { describe, it, expect, vi, afterEach } from 'vitest';
import * as rtl from '@testing-library/react';
import '@testing-library/jest-dom';

import { TestAuthClient, flushPromises } from '../test-utils';
import type { TestTokens } from '../test-utils';

const testState = vi.hoisted(() => ({
  client: null as InstanceType<typeof TestAuthClient> | null,
}));

vi.mock('../../src/auth', async () => {
  const { createAuth } = await import('@forward-software/react-auth');
  const { TestAuthClient: Cls } = await import('../test-utils');
  testState.client = new Cls();
  return createAuth(testState.client);
});

import { AuthenticatedView } from '../../src/components/AuthenticatedView';
import { AuthProvider } from '../../src/auth';

afterEach(rtl.cleanup);

const MOCK_TOKENS: TestTokens = {
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  expiresAt: Date.now() + 5 * 60 * 1000,
};

describe('AuthenticatedView', () => {
  it('should render the authenticated view when logged in', async () => {
    // Arrange — onInit returns tokens → authenticated
    vi.spyOn(testState.client!, 'onInit').mockResolvedValueOnce(MOCK_TOKENS);

    // Act
    rtl.render(
      <AuthProvider>
        <AuthenticatedView />
      </AuthProvider>,
    );
    await rtl.act(() => flushPromises());

    // Assert
    expect(rtl.screen.getByTestId('authenticated-view')).toBeInTheDocument();
    expect(rtl.screen.getByText('You are authenticated.')).toBeInTheDocument();
  });

  it('should show token expiry time', async () => {
    // Arrange
    const tokens: TestTokens = {
      ...MOCK_TOKENS,
      expiresAt: 1700000000000,
    };
    vi.spyOn(testState.client!, 'onInit').mockResolvedValueOnce(tokens);

    // Act
    rtl.render(
      <AuthProvider>
        <AuthenticatedView />
      </AuthProvider>,
    );
    await rtl.act(() => flushPromises());

    // Assert
    const expiryEl = rtl.screen.getByTestId('token-expiry');
    expect(expiryEl).toBeInTheDocument();
    expect(expiryEl.textContent).toContain('Tokens expire at:');
    // The formatted time should not be N/A since we provided a valid expiresAt
    expect(expiryEl.textContent).not.toContain('N/A');
  });

  it('should trigger token refresh on refresh button click', async () => {
    // Arrange
    vi.spyOn(testState.client!, 'onInit').mockResolvedValueOnce(MOCK_TOKENS);
    const refreshSpy = vi.spyOn(testState.client!, 'onRefresh');

    rtl.render(
      <AuthProvider>
        <AuthenticatedView />
      </AuthProvider>,
    );
    await rtl.act(() => flushPromises());

    // Act
    await rtl.act(async () => {
      rtl.fireEvent.click(rtl.screen.getByTestId('refresh-button'));
      await flushPromises();
    });

    // Assert
    expect(refreshSpy).toHaveBeenCalled();
  });

  it('should trigger logout on logout button click', async () => {
    // Arrange
    vi.spyOn(testState.client!, 'onInit').mockResolvedValueOnce(MOCK_TOKENS);
    const logoutSpy = vi.spyOn(testState.client!, 'onLogout');

    rtl.render(
      <AuthProvider>
        <AuthenticatedView />
      </AuthProvider>,
    );
    await rtl.act(() => flushPromises());

    // Act
    await rtl.act(async () => {
      rtl.fireEvent.click(rtl.screen.getByTestId('logout-button'));
      await flushPromises();
    });

    // Assert
    expect(logoutSpy).toHaveBeenCalled();
  });
});
