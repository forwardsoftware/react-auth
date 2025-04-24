import * as React from 'react';
import * as rtl from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { createMockAuthClient, createChild, flushPromises } from './test-utils';

import { createAuth } from '../src';

afterEach(require('@testing-library/react').cleanup);

describe('AuthProvider', () => {
  describe('on initialization', () => {
    it('should init AuthClient instance', async () => {
      const authClientStub = createMockAuthClient();
      const authClientInitSpy = jest
        .spyOn(authClientStub, 'onInit')
        .mockResolvedValue(undefined);

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

      const authClientInitSpy = jest
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
      jest
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
