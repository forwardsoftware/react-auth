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

import { LoginForm } from '../../src/components/LoginForm';
import { AuthProvider } from '../../src/auth';

afterEach(rtl.cleanup);

describe('LoginForm', () => {
  it('should render login form inputs', async () => {
    // Arrange & Act
    rtl.render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );
    await rtl.act(() => flushPromises());

    // Assert
    expect(rtl.screen.getByTestId('username-input')).toBeInTheDocument();
    expect(rtl.screen.getByTestId('password-input')).toBeInTheDocument();
    expect(rtl.screen.getByTestId('login-button')).toBeInTheDocument();
  });

  it('should trigger auth login on button click', async () => {
    // Arrange
    const loginSpy = vi.spyOn(testState.client!, 'onLogin');

    rtl.render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );
    await rtl.act(() => flushPromises());

    // Act — fill in credentials and click login
    await rtl.act(async () => {
      rtl.fireEvent.change(rtl.screen.getByTestId('username-input'), {
        target: { value: 'user' },
      });
      rtl.fireEvent.change(rtl.screen.getByTestId('password-input'), {
        target: { value: 'password' },
      });
    });

    await rtl.act(async () => {
      rtl.fireEvent.click(rtl.screen.getByTestId('login-button'));
      await flushPromises();
    });

    // Assert
    expect(loginSpy).toHaveBeenCalled();
  });

  it('should display error on failed login', async () => {
    // Arrange — make onLogin reject
    vi.spyOn(testState.client!, 'onLogin').mockRejectedValueOnce(
      new Error('Bad credentials'),
    );

    rtl.render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );
    await rtl.act(() => flushPromises());

    // Act — click the invalid-login button (uses wrong credentials)
    await rtl.act(async () => {
      rtl.fireEvent.click(rtl.screen.getByTestId('invalid-login-button'));
      await flushPromises();
    });

    // Assert
    expect(rtl.screen.getByTestId('login-error')).toBeInTheDocument();
  });
});
