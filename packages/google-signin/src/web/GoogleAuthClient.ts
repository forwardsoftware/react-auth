import type { AuthClient } from '@forward-software/react-auth';
import type {
  GoogleAuthCredentials,
  GoogleAuthTokens,
  GoogleWebAuthConfig,
  TokenStorage,
} from '../types';
import { DEFAULT_SCOPES, DEFAULT_STORAGE_KEY } from '../types';

const defaultWebStorage: TokenStorage = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
};

export class GoogleAuthClient implements AuthClient<GoogleAuthTokens, GoogleAuthCredentials> {
  private config: GoogleWebAuthConfig;
  private storage: TokenStorage;
  private storageKey: string;

  constructor(config: GoogleWebAuthConfig) {
    this.config = {
      scopes: DEFAULT_SCOPES,
      persistTokens: true,
      ...config,
    };
    this.storage = config.storage ?? defaultWebStorage;
    this.storageKey = config.storageKey ?? DEFAULT_STORAGE_KEY;
  }

  async onInit(): Promise<GoogleAuthTokens | null> {
    if (!this.config.persistTokens) {
      return null;
    }

    const raw = await this.storage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      const tokens: GoogleAuthTokens = JSON.parse(raw);

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

  async onLogin(credentials?: GoogleAuthCredentials): Promise<GoogleAuthTokens> {
    if (!credentials?.idToken) {
      throw new Error(
        'GoogleAuthClient: credentials with idToken are required. ' +
        'Trigger Google Sign-In via GoogleSignInButton or the GSI API and pass the result to login().'
      );
    }

    const expiresAt = this.extractExpiration(credentials.idToken);

    const tokens: GoogleAuthTokens = {
      idToken: credentials.idToken,
      accessToken: credentials.accessToken,
      serverAuthCode: credentials.serverAuthCode,
      expiresAt,
    };

    if (this.config.persistTokens) {
      await this.storage.setItem(this.storageKey, JSON.stringify(tokens));
    }

    return tokens;
  }

  async onLogout(): Promise<void> {
    await this.storage.removeItem(this.storageKey);

    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch {
        // GSI revoke is best-effort
      }
    }
  }

  /**
   * Extracts the `exp` claim from a JWT id_token to determine expiration time.
   * Returns epoch milliseconds, or undefined if the token can't be parsed.
   */
  private extractExpiration(idToken: string): number | undefined {
    try {
      const payload = idToken.split('.')[1];
      if (!payload) return undefined;

      const decoded = JSON.parse(atob(payload));
      if (typeof decoded.exp === 'number') {
        return decoded.exp * 1000;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }
}
