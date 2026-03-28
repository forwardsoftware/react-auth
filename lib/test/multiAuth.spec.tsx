import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as rtl from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';

import { createMockAuthClient, flushPromises } from './test-utils';

import { createMultiAuth } from '../src';

afterEach(rtl.cleanup);

describe('createMultiAuth', () => {
  it('should return a new MultiAuth with initialized values', () => {
    // Arrange / Act
    const multiAuth = createMultiAuth({
      primary: createMockAuthClient(),
      secondary: createMockAuthClient(),
    });

    // Assert
    expect(multiAuth).toBeDefined();
    expect(multiAuth.AuthProvider).toBeDefined();
    expect(multiAuth.authClients).toBeDefined();
    expect(multiAuth.useAuth).toBeDefined();
  });

  it('should expose all provided clients in authClients', () => {
    // Arrange
    const primaryClient = createMockAuthClient();
    const secondaryClient = createMockAuthClient();

    // Act
    const { authClients } = createMultiAuth({ primary: primaryClient, secondary: secondaryClient });

    // Assert
    expect(authClients.primary).toBeDefined();
    expect(authClients.secondary).toBeDefined();
  });

  describe('useAuth hook', () => {
    it('should throw error if used outside AuthProvider context', async () => {
      // Arrange
      const consoleErrorFn = vi
        .spyOn(console, 'error')
        .mockImplementation(() => vi.fn());

      const { useAuth } = createMultiAuth({ primary: createMockAuthClient() });

      // Act / Assert
      expect(() => {
        renderHook(() => useAuth('primary'));
      }).toThrow('useAuth hook should be used inside AuthProvider');

      consoleErrorFn.mockRestore();
    });

    it('should return the correct client for a given id', async () => {
      // Arrange
      const primaryClient = createMockAuthClient();
      const secondaryClient = createMockAuthClient();

      vi.spyOn(primaryClient, 'onInit').mockResolvedValue(null);
      vi.spyOn(secondaryClient, 'onInit').mockResolvedValue(null);

      const { AuthProvider, authClients, useAuth } = createMultiAuth({
        primary: primaryClient,
        secondary: secondaryClient,
      });

      let primaryFromHook: typeof authClients.primary | undefined;
      let secondaryFromHook: typeof authClients.secondary | undefined;

      function Child() {
        primaryFromHook = useAuth('primary');
        secondaryFromHook = useAuth('secondary');
        return <div />;
      }

      // Act
      rtl.render(
        <AuthProvider>
          <Child />
        </AuthProvider>
      );

      await rtl.act(() => flushPromises());

      // Assert
      expect(primaryFromHook).toBe(authClients.primary);
      expect(secondaryFromHook).toBe(authClients.secondary);
    });
  });

  describe('AuthProvider', () => {
    describe('on initialization', () => {
      it('should init all AuthClient instances', async () => {
        // Arrange
        const primaryClient = createMockAuthClient();
        const secondaryClient = createMockAuthClient();

        const primaryInitSpy = vi
          .spyOn(primaryClient, 'onInit')
          .mockResolvedValue(null);
        const secondaryInitSpy = vi
          .spyOn(secondaryClient, 'onInit')
          .mockResolvedValue(null);

        const { AuthProvider } = createMultiAuth({
          primary: primaryClient,
          secondary: secondaryClient,
        });

        // Act
        rtl.render(
          <AuthProvider>
            <div />
          </AuthProvider>
        );

        await rtl.act(() => flushPromises());

        // Assert
        expect(primaryInitSpy).toHaveBeenCalledTimes(1);
        expect(secondaryInitSpy).toHaveBeenCalledTimes(1);
      });

      it('should handle errors during init of any client', async () => {
        // Arrange
        const primaryClient = createMockAuthClient();
        const secondaryClient = createMockAuthClient();

        const primaryInitSpy = vi
          .spyOn(primaryClient, 'onInit')
          .mockResolvedValue(null);
        vi
          .spyOn(secondaryClient, 'onInit')
          .mockRejectedValue(new Error('Secondary init error'));

        const { AuthProvider } = createMultiAuth({
          primary: primaryClient,
          secondary: secondaryClient,
        });

        // Act
        rtl.render(
          <AuthProvider>
            <div />
          </AuthProvider>
        );

        await rtl.act(() => flushPromises());

        // Assert
        expect(primaryInitSpy).toHaveBeenCalledTimes(1);
      });

      it('should display LoadingComponent if provided while not all clients are initialized', async () => {
        // Arrange
        const primaryClient = createMockAuthClient();
        const secondaryClient = createMockAuthClient();

        vi.spyOn(primaryClient, 'onInit').mockResolvedValue(null);
        vi.spyOn(secondaryClient, 'onInit').mockResolvedValue(null);

        const { AuthProvider } = createMultiAuth({
          primary: primaryClient,
          secondary: secondaryClient,
        });

        // Act — render before async init completes
        const tester = rtl.render(
          <AuthProvider
            LoadingComponent={
              <span data-testid="LoadingComponent">Loading...</span>
            }
          >
            <div />
          </AuthProvider>
        );

        // Assert — LoadingComponent must be visible while clients are still initializing
        expect(tester.getByTestId('LoadingComponent')).toBeVisible();
        expect(tester.getByTestId('LoadingComponent')).toHaveTextContent('Loading...');

        // Allow init to finish so afterEach cleanup is not left with pending state
        await rtl.act(() => flushPromises());
      });

      it('should display ErrorComponent if provided when any client init fails', async () => {
        // Arrange
        const primaryClient = createMockAuthClient();
        const secondaryClient = createMockAuthClient();

        vi.spyOn(primaryClient, 'onInit').mockResolvedValue(null);
        vi
          .spyOn(secondaryClient, 'onInit')
          .mockRejectedValue(new Error('Secondary init error'));

        const { AuthProvider } = createMultiAuth({
          primary: primaryClient,
          secondary: secondaryClient,
        });

        // Act
        const tester = rtl.render(
          <AuthProvider
            ErrorComponent={<span data-testid="ErrorComponent">Error!</span>}
          >
            <div />
          </AuthProvider>
        );

        await rtl.act(() => flushPromises());

        // Assert
        expect(tester.getByTestId('ErrorComponent')).toBeVisible();
        expect(tester.getByTestId('ErrorComponent')).toHaveTextContent('Error!');
      });
    });

    it('should add all auth client instances to context', async () => {
      // Arrange
      const primaryClient = createMockAuthClient();
      const secondaryClient = createMockAuthClient();

      vi.spyOn(primaryClient, 'onInit').mockResolvedValue(null);
      vi.spyOn(secondaryClient, 'onInit').mockResolvedValue(null);

      const { AuthProvider, useAuth } = createMultiAuth({
        primary: primaryClient,
        secondary: secondaryClient,
      });

      function Child() {
        const primary = useAuth('primary');
        const secondary = useAuth('secondary');
        return (
          <div>
            <div data-testid="primaryClient">
              primary: {!!primary ? 'present' : 'absent'}
            </div>
            <div data-testid="secondaryClient">
              secondary: {!!secondary ? 'present' : 'absent'}
            </div>
          </div>
        );
      }

      // Act
      const tester = rtl.render(
        <AuthProvider>
          <Child />
        </AuthProvider>
      );

      await rtl.act(() => flushPromises());

      // Assert
      expect(tester.getByTestId('primaryClient')).toHaveTextContent('primary: present');
      expect(tester.getByTestId('secondaryClient')).toHaveTextContent('secondary: present');
    });
  });

  describe('client isolation', () => {
    it('should route onLogin calls to the correct underlying client for each id', async () => {
      // Arrange
      const primaryClient = createMockAuthClient();
      const secondaryClient = createMockAuthClient();

      const primaryLoginSpy = vi
        .spyOn(primaryClient, 'onLogin')
        .mockResolvedValue({ authToken: 'primary-token', refreshToken: 'primary-refresh' });
      const secondaryLoginSpy = vi
        .spyOn(secondaryClient, 'onLogin')
        .mockResolvedValue({ authToken: 'secondary-token', refreshToken: 'secondary-refresh' });

      vi.spyOn(primaryClient, 'onInit').mockResolvedValue(null);
      vi.spyOn(secondaryClient, 'onInit').mockResolvedValue(null);

      const { AuthProvider, authClients } = createMultiAuth({
        primary: primaryClient,
        secondary: secondaryClient,
      });

      rtl.render(
        <AuthProvider>
          <div />
        </AuthProvider>
      );

      await rtl.act(() => flushPromises());

      // Act
      await authClients.primary.login();
      await authClients.secondary.login();

      // Assert — each enhanced client delegates to its own underlying client
      expect(primaryLoginSpy).toHaveBeenCalledTimes(1);
      expect(secondaryLoginSpy).toHaveBeenCalledTimes(1);
    });

    it('should work correctly with an empty clients map', async () => {
      // Arrange / Act
      const { AuthProvider } = createMultiAuth({});

      let contextAvailable = false;

      function Child() {
        // verify the provider renders children immediately (no clients to wait on)
        contextAvailable = true;
        return <div data-testid="child">ready</div>;
      }

      const tester = rtl.render(
        <AuthProvider>
          <Child />
        </AuthProvider>
      );

      await rtl.act(() => flushPromises());

      // Assert — no clients to init, children render immediately
      expect(tester.getByTestId('child')).toHaveTextContent('ready');
      expect(contextAvailable).toBe(true);
    });
  });

  describe('useAuth — runtime guard', () => {
    it('should throw a descriptive error when accessing an unregistered id at runtime', async () => {
      // Arrange
      const primaryClient = createMockAuthClient();
      vi.spyOn(primaryClient, 'onInit').mockResolvedValue(null);

      const { AuthProvider, useAuth } = createMultiAuth({ primary: primaryClient });

      const consoleErrorFn = vi
        .spyOn(console, 'error')
        .mockImplementation(() => vi.fn());

      // Act / Assert — cast to bypass TypeScript keyof check (simulates JS caller)
      expect(() => {
        rtl.render(
          <AuthProvider>
            {React.createElement(() => {
              useAuth('nonexistent' as 'primary');
              return <div />;
            })}
          </AuthProvider>
        );
      }).toThrow('useAuth: no auth client registered for id "nonexistent"');

      consoleErrorFn.mockRestore();
    });
  });
});
