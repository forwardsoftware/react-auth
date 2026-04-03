/* istanbul ignore file */

import type { PropsWithChildren } from 'react';

import { createAuth } from '@forward-software/react-auth';
import type { AuthClient } from '@forward-software/react-auth';

export type TestTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export type TestCredentials = {
  username: string;
  password: string;
};

export class TestAuthClient implements AuthClient<TestTokens, TestCredentials> {
  async onInit(): Promise<TestTokens | null> {
    return null;
  }

  async onLogin(_credentials?: TestCredentials): Promise<TestTokens> {
    return {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
  }

  async onRefresh(_currentTokens: TestTokens): Promise<TestTokens> {
    return {
      accessToken: 'refreshed-access-token',
      refreshToken: 'refreshed-refresh-token',
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
  }

  async onLogout(): Promise<void> {
    // no-op
  }
}

export function createTestAuth(client?: AuthClient<TestTokens, TestCredentials>) {
  return createAuth(client ?? new TestAuthClient());
}

export function createTestWrapper(AuthProvider: React.FC<PropsWithChildren>) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <AuthProvider>{children}</AuthProvider>;
  };
}

export const flushPromises = () => new Promise(process.nextTick);
