import type { AuthClient } from '@forward-software/react-auth';
import type {
  AppleAuthCredentials,
  AppleAuthTokens,
  AppleWebAuthConfig,
  TokenStorage,
} from '../types';
import { DEFAULT_SCOPES, DEFAULT_STORAGE_KEY } from '../types';

const defaultWebStorage: TokenStorage = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
};

export class AppleAuthClient implements AuthClient<AppleAuthTokens, AppleAuthCredentials> {
  private config: AppleWebAuthConfig;
  private storage: TokenStorage;
  private storageKey: string;

  constructor(config: AppleWebAuthConfig) {
    this.config = {
      scopes: DEFAULT_SCOPES,
      persistTokens: true,
      ...config,
    };
    this.storage = config.storage ?? defaultWebStorage;
    this.storageKey = config.storageKey ?? DEFAULT_STORAGE_KEY;
  }

  async onInit(): Promise<AppleAuthTokens | null> {
    if (!this.config.persistTokens) {
      return null;
    }

    const raw = await this.storage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      const tokens: AppleAuthTokens = JSON.parse(raw);

      if (tokens.expiresAt && Date.now() >= tokens.expiresAt) {
        await this.storage.removeItem(this.storageKey);
        return null;
      }

      return tokens;
    } catch {
      await this.storage.removeItem(this.storageKey);
      return null;
    }
  }

  async onLogin(credentials?: AppleAuthCredentials): Promise<AppleAuthTokens> {
    if (!credentials?.identityToken) {
      throw new Error(
        'AppleAuthClient: credentials with identityToken are required. ' +
        'Trigger Apple Sign-In via AppleSignInButton or the Apple JS API and pass the result to login().'
      );
    }

    const expiresAt = this.extractExpiration(credentials.identityToken);

    const tokens: AppleAuthTokens = {
      identityToken: credentials.identityToken,
      authorizationCode: credentials.authorizationCode,
      email: credentials.email,
      fullName: credentials.fullName,
      user: credentials.user,
      expiresAt,
    };

    if (this.config.persistTokens) {
      await this.storage.setItem(this.storageKey, JSON.stringify(tokens));
    }

    return tokens;
  }

  async onLogout(): Promise<void> {
    await this.storage.removeItem(this.storageKey);
  }

  private base64UrlDecode(input: string): string {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return atob(padded);
  }

  private extractExpiration(identityToken: string): number | undefined {
    try {
      const payload = identityToken.split('.')[1];
      if (!payload) return undefined;

      const decodedJson = this.base64UrlDecode(payload);
      const decoded = JSON.parse(decodedJson);
      if (typeof decoded.exp === 'number') {
        return decoded.exp * 1000;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }
}
