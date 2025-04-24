/* istanbul ignore file */

import * as React from 'react';

import { BaseAuthClient } from '../src';

type MockTokens = {
  authToken: string;

  refreshToken: string;
};

type MockCredentials = {
  username: string;

  password: string;
};

class MockAuthClient extends BaseAuthClient<MockTokens, MockCredentials> {
  onInit(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  onLogin(_credentials?: MockCredentials): Promise<MockTokens> {
    throw new Error('Method not implemented.');
  }

  onRefresh(_minValidity?: number): Promise<MockTokens> {
    throw new Error('Method not implemented.');
  }

  onLogout(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

export const createMockAuthClient = () => {
  return new MockAuthClient();
};

export const createMockAuthClientWithHooks = (hooks: Record<string, any>) => {
  // console.log('hooks', hooks);

  class MockAuthClientWithHooks extends BaseAuthClient<
    MockTokens,
    MockCredentials
  > {
    onInit(): Promise<void> {
      throw new Error('Method not implemented.');
    }

    protected onPostInit(): Promise<void> {
      hooks['onPostInit']?.();
      return Promise.resolve();
    }

    protected onPreLogin(): Promise<void> {
      hooks['onPreLogin']?.();
      return Promise.resolve();
    }

    onLogin(_credentials?: MockCredentials): Promise<MockTokens> {
      throw new Error('Method not implemented.');
    }

    protected onPostLogin(isSuccess: boolean): Promise<void> {
      hooks['onPostLogin']?.(isSuccess);
      return Promise.resolve();
    }

    protected onPreRefresh(): Promise<void> {
      hooks['onPreRefresh']?.();
      return Promise.resolve();
    }

    onRefresh(_minValidity?: number): Promise<MockTokens> {
      throw new Error('Method not implemented.');
    }

    protected onPostRefresh(isSuccess: boolean): Promise<void> {
      hooks['onPostRefresh']?.(isSuccess);
      return Promise.resolve();
    }

    protected onPreLogout(): Promise<void> {
      hooks['onPreLogout']?.();
      return Promise.resolve();
    }

    onLogout(): Promise<void> {
      throw new Error('Method not implemented.');
    }

    protected onPostLogout(isSuccess: boolean): Promise<void> {
      hooks['onPostLogout']?.(isSuccess);
      return Promise.resolve();
    }
  }

  return new MockAuthClientWithHooks();
};

export const createChild = (useAuthClientHook: () => MockAuthClient) => {
  return function() {
    const authClient = useAuthClientHook();
    return (
      <div data-testid="authClient">
        authClient: {!!authClient ? 'present' : 'absent'}
      </div>
    );
  };
};

export const flushPromises = () => new Promise(setImmediate);
