import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as rtl from '@testing-library/react';
import '@testing-library/jest-dom';

import { createMockAuthClient, createChild, flushPromises } from './test-utils';

import { createAuth } from '../src';

afterEach(rtl.cleanup);

describe('AuthProvider', () => {
  describe('on initialization', () => {
    it('should init AuthClient instance', async () => {
      const authClientStub = createMockAuthClient();
      const authClientInitSpy = vi
        .spyOn(authClientStub, 'onInit')
        .mockResolvedValue(null);

      const { AuthProvider } = createAuth(authClientStub);

      rtl.render(
        <AuthProvider>
          <div />
        </AuthProvider>
      );

      await rtl.act(() => flushPromises());

      expect(authClientInitSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during init', async () => {
      const authClientStub = createMockAuthClient();

      const authClientInitSpy = vi
        .spyOn(authClientStub, 'onInit')
        .mockRejectedValue(new Error('Stub error'));

      const { AuthProvider } = createAuth(authClientStub);

      rtl.render(
        <AuthProvider>
          <div />
        </AuthProvider>
      );

      await rtl.act(() => flushPromises());

      expect(authClientInitSpy).toHaveBeenCalledTimes(1);
    });

    it('should diplay LoadingComponent if provided', async () => {
      const authClientStub = createMockAuthClient();

      const { AuthProvider } = createAuth(authClientStub);

      const tester = rtl.render(
        <AuthProvider
          LoadingComponent={
            <span data-testid="LoadingComponent">Loading...</span>
          }
        >
          <div />
        </AuthProvider>
      );

      await rtl.act(() => flushPromises());

      expect(tester.getByTestId('LoadingComponent')).toBeVisible();
      expect(tester.getByTestId('LoadingComponent')).toHaveTextContent(
        'Loading...'
      );
    });

    it('should diplay ErrorComponent if provided', async () => {
      const authClientStub = createMockAuthClient();
      vi
        .spyOn(authClientStub, 'onInit')
        .mockRejectedValue(new Error('Stub error'));

      const { AuthProvider } = createAuth(authClientStub);

      const tester = rtl.render(
        <AuthProvider
          ErrorComponent={<span data-testid="ErrorComponent">Error!</span>}
        >
          <div />
        </AuthProvider>
      );

      await rtl.act(() => flushPromises());

      expect(tester.getByTestId('ErrorComponent')).toBeVisible();
      expect(tester.getByTestId('ErrorComponent')).toHaveTextContent('Error!');
    });
  });

  it('should add the authClient instance to context', async () => {
    const authClientStub = createMockAuthClient();

    const { AuthProvider, useAuthClient } = createAuth(authClientStub);

    const Child = createChild(useAuthClient);

    const tester = rtl.render(
      <AuthProvider>
        <Child />
      </AuthProvider>
    );

    await rtl.act(() => flushPromises());

    expect(tester.getByTestId('authClient')).toHaveTextContent(
      'authClient: present'
    );
  });
});
