import { describe, it, expect, vi, afterEach } from 'vitest';
import * as rtl from '@testing-library/react';
import '@testing-library/jest-dom';

import { TestAuthClient, flushPromises } from '../test-utils';
import type { TestTokens } from '../test-utils';

// Create a shared test client accessible by both the mock factory and test bodies.
const testState = vi.hoisted(() => ({
  client: null as InstanceType<typeof TestAuthClient> | null,
}));

vi.mock('../../src/auth', async () => {
  const { createAuth } = await import('@forward-software/react-auth');
  const { TestAuthClient: Cls } = await import('../test-utils');
  testState.client = new Cls();
  return createAuth(testState.client);
});

// Imports resolved AFTER the mock is installed.
import { AuthStatus } from '../../src/components/AuthStatus';
import { AuthProvider } from '../../src/auth';

afterEach(rtl.cleanup);

describe('AuthStatus', () => {
  it('should render initialization status', async () => {
    // Arrange — default onInit returns null → initialized = true

    // Act
    rtl.render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );
    await rtl.act(() => flushPromises());

    // Assert
    expect(rtl.screen.getByTestId('initialized-badge')).toHaveTextContent(
      'Initialized: true',
    );
  });

  it('should render authentication status when not authenticated', async () => {
    // Arrange — onInit returns null → not authenticated

    // Act
    rtl.render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );
    await rtl.act(() => flushPromises());

    // Assert
    expect(rtl.screen.getByTestId('authenticated-badge')).toHaveTextContent(
      'Authenticated: false',
    );
  });

  it('should render authentication status when authenticated', async () => {
    // Arrange — onInit returns tokens → authenticated
    const tokens: TestTokens = {
      accessToken: 'init-access',
      refreshToken: 'init-refresh',
      expiresAt: Date.now() + 300_000,
    };
    vi.spyOn(testState.client!, 'onInit').mockResolvedValueOnce(tokens);

    // Act
    rtl.render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );
    await rtl.act(() => flushPromises());

    // Assert
    expect(rtl.screen.getByTestId('authenticated-badge')).toHaveTextContent(
      'Authenticated: true',
    );
  });

  it('should render token display', async () => {
    // Arrange — onInit returns tokens
    const tokens: TestTokens = {
      accessToken: 'display-access',
      refreshToken: 'display-refresh',
      expiresAt: 1700000000000,
    };
    vi.spyOn(testState.client!, 'onInit').mockResolvedValueOnce(tokens);

    // Act
    rtl.render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    );
    await rtl.act(() => flushPromises());

    // Assert
    const tokenDisplay = rtl.screen.getByTestId('token-display');
    expect(tokenDisplay).toHaveTextContent('display-access');
    expect(tokenDisplay).toHaveTextContent('display-refresh');
  });
});
