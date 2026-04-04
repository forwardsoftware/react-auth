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
      try {
        const parsed = JSON.parse(stored);
        if (
          typeof parsed?.accessToken === 'string' &&
          typeof parsed?.refreshToken === 'string' &&
          typeof parsed?.expiresAt === 'number' &&
          parsed.expiresAt > Date.now()
        ) {
          return parsed as MockTokens;
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return null;
  }

  async onPostInit(): Promise<void> {
    // Post-initialization hook — no-op in this demo
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

  async onPostLogin(_isSuccess: boolean): Promise<void> {
    // Post-login hook — no-op in this demo
  }

  async onPreRefresh(): Promise<void> {
    await this.wait();
  }

  async onRefresh(_currentTokens: MockTokens, _minValidity?: number): Promise<MockTokens> {
    const tokens = this.generateTokens();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    return tokens;
  }

  async onPostRefresh(_isSuccess: boolean): Promise<void> {
    // Post-refresh hook — no-op in this demo
  }

  async onPreLogout(): Promise<void> {
    await this.wait();
  }

  async onLogout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  }

  async onPostLogout(_isSuccess: boolean): Promise<void> {
    // Post-logout hook — no-op in this demo
  }
}
