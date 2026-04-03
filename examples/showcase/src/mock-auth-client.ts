import type { AuthClient } from '@forward-software/react-auth';

export type MockTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export type MockCredentials = {
  username: string;
  password: string;
};

export const VALID_CREDENTIALS: MockCredentials = {
  username: 'user',
  password: 'password',
};

const STORAGE_KEY = 'react-auth-showcase-tokens';
const DEFAULT_DELAY_MS = 800;

export class MockAuthClient implements AuthClient<MockTokens, MockCredentials> {
  private delayMs: number;

  constructor(delayMs = DEFAULT_DELAY_MS) {
    this.delayMs = delayMs;
  }

  private wait(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.delayMs));
  }

  private generateTokens(): MockTokens {
    return {
      accessToken: `mock-access-${Date.now()}`,
      refreshToken: `mock-refresh-${Date.now()}`,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
  }

  async onInit(): Promise<MockTokens | null> {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const tokens: MockTokens = JSON.parse(stored);
      if (tokens.expiresAt > Date.now()) {
        return tokens;
      }
    }
    return null;
  }

  async onPostInit(): Promise<void> {
    console.log('[MockAuthClient] Post-init complete');
  }

  async onPreLogin(): Promise<void> {
    await this.wait();
  }

  async onLogin(credentials?: MockCredentials): Promise<MockTokens> {
    if (
      credentials?.username !== VALID_CREDENTIALS.username ||
      credentials?.password !== VALID_CREDENTIALS.password
    ) {
      throw new Error('Invalid credentials');
    }
    const tokens = this.generateTokens();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    return tokens;
  }

  async onPostLogin(isSuccess: boolean): Promise<void> {
    console.log(`[MockAuthClient] Post-login: ${isSuccess ? 'success' : 'failure'}`);
  }

  async onPreRefresh(): Promise<void> {
    await this.wait();
  }

  async onRefresh(_currentTokens: MockTokens, _minValidity?: number): Promise<MockTokens> {
    const tokens = this.generateTokens();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    return tokens;
  }

  async onPostRefresh(isSuccess: boolean): Promise<void> {
    console.log(`[MockAuthClient] Post-refresh: ${isSuccess ? 'success' : 'failure'}`);
  }

  async onPreLogout(): Promise<void> {
    await this.wait();
  }

  async onLogout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  }

  async onPostLogout(isSuccess: boolean): Promise<void> {
    console.log(`[MockAuthClient] Post-logout: ${isSuccess ? 'success' : 'failure'}`);
  }
}
